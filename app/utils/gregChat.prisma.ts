import { MAX_HISTORY_MESSAGES } from "./anthropic.server";
import { prisma } from "./prisma.server";

export type ChatRole = "user" | "assistant";

export interface ChatMessageDTO {
  id: string;
  role: ChatRole;
  content: string;
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
    select: { id: true, role: true, content: true, createdAt: true },
  });
  return messages.map((m) => ({
    id: m.id,
    role: m.role as ChatRole,
    content: m.content,
    createdAt: m.createdAt,
  }));
}

export async function appendMessage(
  sessionId: string,
  role: ChatRole,
  content: string
): Promise<void> {
  const now = new Date();
  await prisma.$transaction([
    prisma.gregChatMessage.create({
      data: { sessionId, role, content, createdAt: now },
    }),
    prisma.gregChatSession.update({
      where: { id: sessionId },
      data: { updatedAt: now },
    }),
  ]);
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
