import { logAuditEvent } from "~/utils/audit.server";
import { prisma } from "~/utils/prisma.server";
import { cancelSubscriptionForDeletion } from "~/utils/subscription.server";
import supabase from "../../utils/supabase";

/** Q&A posts outlive the account but lose the link to the person (privacy policy §5). */
const DELETED_AUTHOR_ID = "000000000000000000000000";
const DELETED_AUTHOR_NAME = "—";

/**
 * GDPR art. 17 erasure. Deletes everything tied to the account except what the
 * privacy policy says we must keep: purchases (5 years, tax law) and the
 * security audit log (12 months). Q&A posts are anonymised, not deleted.
 */
export async function deleteAccount(userId: string, reason: "user" | "parent_declined"): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return;

  // Stop future Greg AI Pro charges first. If Stripe is unreachable this throws
  // and the account is kept, so we never keep charging a deleted account.
  await cancelSubscriptionForDeletion(userId);

  const sessions = await prisma.gregChatSession.findMany({ where: { userId }, select: { id: true } });
  const sessionIds = sessions.map((s) => s.id);

  await prisma.$transaction([
    prisma.gregChatMessage.deleteMany({ where: { sessionId: { in: sessionIds } } }),
    prisma.gregChatSession.deleteMany({ where: { userId } }),
    prisma.gregDailyUsage.deleteMany({ where: { userId } }),
    prisma.userProgress.deleteMany({ where: { userId } }),
    prisma.questionVote.deleteMany({ where: { userId } }),
    prisma.answerVote.deleteMany({ where: { userId } }),
    prisma.question.updateMany({
      where: { authorId: userId },
      data: { authorId: DELETED_AUTHOR_ID, authorName: DELETED_AUTHOR_NAME },
    }),
    prisma.answer.updateMany({
      where: { authorId: userId },
      data: { authorId: DELETED_AUTHOR_ID, authorName: DELETED_AUTHOR_NAME },
    }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  // Community chat profile lives in Supabase. Messages are removed first in
  // case the users row is referenced by a foreign key.
  try {
    const { data: rows } = await supabase.from("users").select("id").eq("provider_id", userId);
    const supabaseIds = (rows ?? []).map((r: { id: string | number }) => r.id);
    if (supabaseIds.length > 0) {
      await supabase.from("messages").delete().in("user_id", supabaseIds);
      await supabase.from("users").delete().in("id", supabaseIds);
    }
  } catch (err) {
    console.error("[account] Supabase cleanup failed for", userId, err);
  }

  await logAuditEvent({
    userId,
    action: "delete",
    resource: "user",
    resourceId: userId,
    metadata: { reason },
  });
}

/** GDPR art. 15/20: everything we hold about the user, as JSON. */
export async function exportAccountData(userId: string) {
  const [user, sessions, progress, purchases, questions, answers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        profile: true,
        role: true,
        grade: true,
        createdAt: true,
        termsAcceptedAt: true,
        termsVersion: true,
        isUnder15: true,
        parentEmail: true,
        parentConsentAt: true,
        subscriptionStatus: true,
        subscriptionInterval: true,
        subscriptionStartedAt: true,
        subscriptionPeriodEnd: true,
        subscriptionCancelAtPeriodEnd: true,
        payerConfirmedAt: true,
      },
    }),
    prisma.gregChatSession.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: { role: true, content: true, rating: true, createdAt: true },
        },
      },
    }),
    prisma.userProgress.findMany({
      where: { userId },
      select: { type: true, exerciseId: true, trainingId: true, score: true, timeSpent: true, completedAt: true },
    }),
    prisma.purchase.findMany({
      where: { userId },
      select: { bookId: true, amount: true, currency: true, status: true, createdAt: true },
    }),
    prisma.question.findMany({
      where: { authorId: userId },
      select: { title: true, body: true, createdAt: true },
    }),
    prisma.answer.findMany({
      where: { authorId: userId },
      select: { body: true, createdAt: true },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    account: user,
    gregAiConversations: sessions,
    progress,
    purchases,
    qa: { questions, answers },
  };
}
