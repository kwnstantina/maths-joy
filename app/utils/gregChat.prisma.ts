import { CHAT_DAILY_LIMIT, MAX_HISTORY_MESSAGES } from "./anthropic.server";
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

// Atomic per-user daily message quota. Increments first, then checks: the 50th
// message (count 50) is allowed and the 51st (count 51) is blocked.
export async function incrementDailyUsage(
  userId: string
): Promise<{ count: number; limitReached: boolean }> {
  const date = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
  const usage = await prisma.gregDailyUsage.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, count: 1 },
    update: { count: { increment: 1 } },
    select: { count: true },
  });
  return { count: usage.count, limitReached: usage.count > CHAT_DAILY_LIMIT };
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

export async function ownsSession(sessionId: string, userId: string): Promise<boolean> {
  const session = await prisma.gregChatSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });
  return Boolean(session);
}
