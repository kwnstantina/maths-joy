import { prisma } from "~/utils/prisma.server";

export type ProgressType = "exercise_viewed" | "training_completed" | "quiz_score";

/**
 * Track when a user views an exercise
 */
export async function trackExerciseView(
  userId: string,
  exerciseId: string
): Promise<void> {
  // Check if already tracked today to avoid duplicates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.userProgress.findFirst({
    where: {
      userId,
      exerciseId,
      type: "exercise_viewed",
      completedAt: { gte: today },
    },
  });

  if (!existing) {
    await prisma.userProgress.create({
      data: {
        userId,
        exerciseId,
        type: "exercise_viewed",
        completedAt: new Date(),
        createdAt: new Date(),
      },
    });
  }
}

/**
 * Track when a user completes a training exercise
 */
export async function trackTrainingCompletion(
  userId: string,
  trainingId: string,
  score?: number,
  timeSpent?: number
): Promise<void> {
  await prisma.userProgress.create({
    data: {
      userId,
      trainingId,
      type: "training_completed",
      score: score ?? null,
      timeSpent: timeSpent ?? null,
      completedAt: new Date(),
      createdAt: new Date(),
    },
  });
}

/**
 * Get IDs of exercises a user has viewed
 */
export async function getViewedExerciseIds(userId: string): Promise<string[]> {
  const progress = await prisma.userProgress.findMany({
    where: {
      userId,
      type: "exercise_viewed",
      exerciseId: { not: null },
    },
    select: { exerciseId: true },
    distinct: ["exerciseId"],
  });

  return progress
    .map((p) => p.exerciseId)
    .filter((id): id is string => id !== null);
}

/**
 * Get IDs of training exercises a user has completed
 */
export async function getCompletedTrainingIds(userId: string): Promise<string[]> {
  const progress = await prisma.userProgress.findMany({
    where: {
      userId,
      type: "training_completed",
      trainingId: { not: null },
    },
    select: { trainingId: true },
    distinct: ["trainingId"],
  });

  return progress
    .map((p) => p.trainingId)
    .filter((id): id is string => id !== null);
}

export interface ProgressSummary {
  exercisesViewed: number;
  trainingCompleted: number;
  totalScore: number;
  averageScore: number | null;
  totalTimeSpent: number; // in seconds
  recentActivity: Array<{
    id: string;
    type: string;
    exerciseId: string | null;
    trainingId: string | null;
    completedAt: Date;
  }>;
}

/**
 * Get a summary of user progress
 */
export async function getUserProgressSummary(
  userId: string
): Promise<ProgressSummary> {
  const [exercisesViewed, trainingCompleted, trainingStats, recentActivity] =
    await Promise.all([
      // Count unique exercises viewed
      prisma.userProgress.findMany({
        where: { userId, type: "exercise_viewed" },
        distinct: ["exerciseId"],
      }),
      // Count training completions
      prisma.userProgress.findMany({
        where: { userId, type: "training_completed" },
        distinct: ["trainingId"],
      }),
      // Get training stats
      prisma.userProgress.aggregate({
        where: { userId, type: "training_completed" },
        _sum: { score: true, timeSpent: true },
        _avg: { score: true },
      }),
      // Recent activity
      prisma.userProgress.findMany({
        where: { userId },
        orderBy: { completedAt: "desc" },
        take: 10,
        select: {
          id: true,
          type: true,
          exerciseId: true,
          trainingId: true,
          completedAt: true,
        },
      }),
    ]);

  return {
    exercisesViewed: exercisesViewed.length,
    trainingCompleted: trainingCompleted.length,
    totalScore: trainingStats._sum.score ?? 0,
    averageScore: trainingStats._avg.score ?? null,
    totalTimeSpent: trainingStats._sum.timeSpent ?? 0,
    recentActivity,
  };
}

/**
 * Get detailed progress with exercise/training info
 */
export async function getUserDetailedProgress(userId: string) {
  const [exerciseProgress, trainingProgress] = await Promise.all([
    prisma.userProgress.findMany({
      where: { userId, type: "exercise_viewed" },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
    prisma.userProgress.findMany({
      where: { userId, type: "training_completed" },
      orderBy: { completedAt: "desc" },
      take: 20,
    }),
  ]);

  // Get exercise details
  const exerciseIds = exerciseProgress
    .map((p) => p.exerciseId)
    .filter((id): id is string => id !== null);

  const exercises = exerciseIds.length
    ? await prisma.exersice.findMany({
        where: { id: { in: exerciseIds } },
        select: { id: true, title: true, category: true },
      })
    : [];

  // Get training details
  const trainingIds = trainingProgress
    .map((p) => p.trainingId)
    .filter((id): id is string => id !== null);

  const trainings = trainingIds.length
    ? await prisma.training.findMany({
        where: { id: { in: trainingIds } },
        select: { id: true, title: true, category: true },
      })
    : [];

  return {
    exercises: exerciseProgress.map((p) => ({
      ...p,
      exercise: exercises.find((e) => e.id === p.exerciseId),
    })),
    trainings: trainingProgress.map((p) => ({
      ...p,
      training: trainings.find((t) => t.id === p.trainingId),
    })),
  };
}
