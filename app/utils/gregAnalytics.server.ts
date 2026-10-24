import { CONTACT_CARD_MARKER_PATTERN } from "./anthropic.server";
import { prisma } from "./prisma.server";

/**
 * Teacher dashboard for Greg AI: what students ask about, where they get
 * stuck, and what it costs. Read-only aggregation over data the chat already
 * records — no model calls.
 */

export const ANALYTICS_WINDOWS = [7, 30, 90] as const;
export type AnalyticsWindow = (typeof ANALYTICS_WINDOWS)[number];

export interface TopicRow {
  page: string | null;
  title: string;
  /** Same-site link to the booklet or training problem. */
  href: string | null;
  questions: number;
  /** Messages sent with "bigger hint" or "show solution". */
  bigHints: number;
  solutions: number;
}

export interface GregAnalytics {
  days: AnalyticsWindow;
  students: number;
  messages: number;
  /** USD, from GregDailyUsage.spend (1_000_000 units = $1). */
  costUsd: number;
  thumbsUp: number;
  thumbsDown: number;
  hints: { level1: number; level2: number; level3: number };
  practiceChecks: number;
  practiceAverage: number | null;
  topics: TopicRow[];
  recentThumbsDown: { id: string; excerpt: string; createdAt: string }[];
}

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const TOP_TOPICS = 15;

export async function getGregAnalytics(days: AnalyticsWindow): Promise<GregAnalytics> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceDate = since.toISOString().slice(0, 10);
  const userMessages = { role: "user", createdAt: { gte: since } };

  const [usage, ratings, hintGroups, practice, topicGroups, bigHintGroups, solutionGroups, thumbsDown] =
    await Promise.all([
      prisma.gregDailyUsage.findMany({
        where: { date: { gte: sinceDate } },
        select: { userId: true, count: true, spend: true },
      }),
      prisma.gregChatMessage.groupBy({
        by: ["rating"],
        where: { role: "assistant", createdAt: { gte: since }, rating: { not: null } },
        _count: { _all: true },
      }),
      prisma.gregChatMessage.groupBy({
        by: ["hintLevel"],
        where: { ...userMessages, hintLevel: { not: null } },
        _count: { _all: true },
      }),
      prisma.userProgress.aggregate({
        where: { type: "quiz_score", completedAt: { gte: since } },
        _count: { _all: true },
        _avg: { score: true },
      }),
      prisma.gregChatMessage.groupBy({
        by: ["page", "contextKey"],
        where: { ...userMessages, contextKey: { not: null } },
        _count: { _all: true },
      }),
      prisma.gregChatMessage.groupBy({
        by: ["page", "contextKey"],
        where: { ...userMessages, contextKey: { not: null }, hintLevel: { gte: 2 } },
        _count: { _all: true },
      }),
      prisma.gregChatMessage.groupBy({
        by: ["page", "contextKey"],
        where: { ...userMessages, contextKey: { not: null }, hintLevel: 3 },
        _count: { _all: true },
      }),
      prisma.gregChatMessage.findMany({
        where: { role: "assistant", rating: -1, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, content: true, createdAt: true },
      }),
    ]);

  const countOf = (groups: { page: string | null; contextKey: string | null; _count: { _all: number } }[]) =>
    new Map(groups.map((g) => [`${g.page}|${g.contextKey}`, g._count._all]));
  const bigHints = countOf(bigHintGroups);
  const solutions = countOf(solutionGroups);

  const top = [...topicGroups].sort((a, b) => b._count._all - a._count._all).slice(0, TOP_TOPICS);
  const exerciseIds = top
    .filter((g) => g.page === "exercise" && g.contextKey && OBJECT_ID.test(g.contextKey))
    .map((g) => g.contextKey as string);
  const booklets = exerciseIds.length
    ? await prisma.exersice.findMany({
        where: { id: { in: exerciseIds } },
        select: { id: true, title: true },
      })
    : [];
  const bookletTitle = new Map(booklets.map((b) => [b.id, b.title]));

  const topics: TopicRow[] = top.map((g) => {
    const key = g.contextKey ?? "";
    const isExercise = g.page === "exercise";
    return {
      page: g.page,
      title: isExercise ? bookletTitle.get(key) ?? key : key,
      href: isExercise
        ? `/exercises/${key}`
        : g.page === "training"
          ? `/testYourself?searchableTitle=${encodeURIComponent(key)}`
          : null,
      questions: g._count._all,
      bigHints: bigHints.get(`${g.page}|${g.contextKey}`) ?? 0,
      solutions: solutions.get(`${g.page}|${g.contextKey}`) ?? 0,
    };
  });

  const hintCount = (level: number) =>
    hintGroups.find((g) => g.hintLevel === level)?._count._all ?? 0;
  const ratingCount = (rating: number) =>
    ratings.find((g) => g.rating === rating)?._count._all ?? 0;

  return {
    days,
    students: new Set(usage.map((u) => u.userId)).size,
    messages: usage.reduce((sum, u) => sum + u.count, 0),
    costUsd: usage.reduce((sum, u) => sum + u.spend, 0) / 1_000_000,
    thumbsUp: ratingCount(1),
    thumbsDown: ratingCount(-1),
    hints: { level1: hintCount(1), level2: hintCount(2), level3: hintCount(3) },
    practiceChecks: practice._count._all,
    practiceAverage: practice._avg.score ?? null,
    topics,
    recentThumbsDown: thumbsDown.map((m) => ({
      id: m.id,
      excerpt: m.content.replace(CONTACT_CARD_MARKER_PATTERN, "").trim().slice(0, 240),
      createdAt: m.createdAt.toISOString(),
    })),
  };
}
