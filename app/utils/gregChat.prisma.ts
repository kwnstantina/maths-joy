import type { TokenUsage } from "./anthropic.server";
import {
  CHAT_DAILY_LIMIT,
  CHAT_DAILY_SPEND_BUDGET,
  costUnits,
  MAX_HISTORY_MESSAGES,
} from "./anthropic.server";
import { prisma } from "./prisma.server";

export type ChatRole = "user" | "assistant";

export interface ChatMessageDTO {
  id: string;
  role: ChatRole;
  content: string;
  rating: number | null; // -1 / 1 / null
  createdAt: Date;
}

export interface ChatSessionDTO {
  id: string;
  title: string;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
}

function deriveTitle(firstMessage: string): string {
  const cleaned = firstMessage.replace(/\s+/g, " ").trim();
  return cleaned.length > 60 ? cleaned.slice(0, 57) + "..." : cleaned || "Νέα συζήτηση";
}

export async function listSessions(userId: string): Promise<ChatSessionDTO[]> {
  const sessions = await prisma.gregChatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, locale: true, createdAt: true, updatedAt: true },
    take: 50,
  });
  return sessions;
}

export async function createSession(
  userId: string,
  firstUserMessage: string,
  locale: string
): Promise<ChatSessionDTO> {
  const now = new Date();
  const session = await prisma.gregChatSession.create({
    data: {
      userId,
      title: deriveTitle(firstUserMessage),
      locale,
      createdAt: now,
      updatedAt: now,
    },
    select: { id: true, title: true, locale: true, createdAt: true, updatedAt: true },
  });
  return session;
}

export async function getSessionMessages(
  sessionId: string,
  userId: string
): Promise<ChatMessageDTO[] | null> {
  const session = await prisma.gregChatSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });
  if (!session) return null;

  const messages = await prisma.gregChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, rating: true, createdAt: true },
  });
  return messages.map((m) => ({
    id: m.id,
    role: m.role as ChatRole,
    content: m.content,
    rating: m.rating ?? null,
    createdAt: m.createdAt,
  }));
}

export async function appendMessage(
  sessionId: string,
  role: ChatRole,
  content: string
): Promise<{ id: string }> {
  const now = new Date();
  const [created] = await prisma.$transaction([
    prisma.gregChatMessage.create({
      data: { sessionId, role, content, createdAt: now },
      select: { id: true },
    }),
    prisma.gregChatSession.update({
      where: { id: sessionId },
      data: { updatedAt: now },
    }),
  ]);
  return { id: created.id };
}

/** UTC calendar date key, YYYY-MM-DD. */
function usageDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export type QuotaReason = "messages" | "spend";

// Atomic per-user daily quota. Increments the message counter first, then
// checks both ceilings: the 50th message (count 50) is allowed and the 51st
// (count 51) is blocked.
//
// The spend check uses what has been *recorded so far today* — a request is
// only billed once it completes (see recordTokenUsage), so a user can cross
// the budget by at most one exchange. That is a bounded overshoot of
// MAX_OUTPUT_TOKENS and not worth a pre-flight token count to avoid.
export async function incrementDailyUsage(
  userId: string
): Promise<{ count: number; spend: number; limitReached: boolean; reason?: QuotaReason }> {
  const usage = await prisma.gregDailyUsage.upsert({
    where: { userId_date: { userId, date: usageDate() } },
    create: { userId, date: usageDate(), count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true, spend: true },
  });

  if (usage.count > CHAT_DAILY_LIMIT) {
    return { ...usage, limitReached: true, reason: "messages" };
  }
  if (usage.spend >= CHAT_DAILY_SPEND_BUDGET) {
    return { ...usage, limitReached: true, reason: "spend" };
  }
  return { ...usage, limitReached: false };
}

// Bills a completed exchange against today's row. Called after the stream
// finishes; failures are swallowed by the caller so a usage-write problem can
// never break a reply the student has already received.
export async function recordTokenUsage(
  userId: string,
  usage: TokenUsage
): Promise<void> {
  const date = usageDate();
  await prisma.gregDailyUsage.upsert({
    where: { userId_date: { userId, date } },
    // The row is created by incrementDailyUsage earlier in the same request,
    // so this create branch is effectively unreachable — present because
    // upsert requires it, and it keeps the counters correct if the day rolls
    // over between the two writes.
    create: {
      userId,
      date,
      count: 1,
      inputTokens: usage.input + usage.cacheRead + usage.cacheCreate,
      outputTokens: usage.output,
      spend: costUnits(usage),
    },
    update: {
      inputTokens: { increment: usage.input + usage.cacheRead + usage.cacheCreate },
      outputTokens: { increment: usage.output },
      spend: { increment: costUnits(usage) },
    },
    select: { id: true },
  });
}

// Set/toggle a 👍/👎 rating on an assistant message the user owns. Re-applying
// the same rating clears it (toggle → null). Returns ok:false if not found/owned.
export async function setMessageRating(
  messageId: string,
  userId: string,
  rating: number
): Promise<{ ok: boolean; rating: number | null }> {
  const message = await prisma.gregChatMessage.findFirst({
    where: { id: messageId, role: "assistant", session: { userId } },
    select: { id: true, rating: true },
  });
  if (!message) return { ok: false, rating: null };
  const next = message.rating === rating ? null : rating; // toggle clears
  await prisma.gregChatMessage.update({
    where: { id: messageId },
    data: { rating: next },
  });
  return { ok: true, rating: next };
}

export async function getRecentHistoryForLLM(
  sessionId: string
): Promise<{ role: "user" | "assistant"; content: string }[]> {
  const messages = await prisma.gregChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY_MESSAGES,
    select: { role: true, content: true },
  });
  return messages
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}

export async function deleteSession(sessionId: string, userId: string): Promise<boolean> {
  const result = await prisma.gregChatSession.deleteMany({
    where: { id: sessionId, userId },
  });
  return result.count > 0;
}

/** The ExerciseItem this conversation is working on, if any. */
export async function getActiveItemId(sessionId: string): Promise<string | null> {
  const session = await prisma.gregChatSession.findUnique({
    where: { id: sessionId },
    select: { activeItemId: true },
  });
  return session?.activeItemId ?? null;
}

export async function setActiveItemId(sessionId: string, itemId: string): Promise<void> {
  await prisma.gregChatSession.update({
    where: { id: sessionId },
    data: { activeItemId: itemId },
    select: { id: true },
  });
}

export async function ownsSession(sessionId: string, userId: string): Promise<boolean> {
  const session = await prisma.gregChatSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });
  return Boolean(session);
}
