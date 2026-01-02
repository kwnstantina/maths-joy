import { prisma } from './prisma.server';

// Types
export interface CreateQuestionInput {
  title: string;
  body: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
}

export interface CreateAnswerInput {
  questionId: string;
  body: string;
  authorId: string;
  authorName: string;
}

export interface QuestionFilters {
  category?: string;
  tag?: string;
  search?: string;
  isResolved?: boolean;
}

// Questions

export async function createQuestion(input: CreateQuestionInput) {
  const now = new Date();
  return prisma.question.create({
    data: {
      ...input,
      createdAt: now,
      updatedAt: now,
    },
  });
}

export async function getQuestions(filters: QuestionFilters = {}, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.tag) {
    where.tags = { has: filters.tag };
  }

  if (filters.isResolved !== undefined) {
    where.isResolved = filters.isResolved;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { body: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.question.count({ where }),
  ]);

  return {
    questions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getQuestionById(id: string) {
  const question = await prisma.question.findUnique({
    where: { id },
  });

  if (question) {
    // Increment view count
    await prisma.question.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  return question;
}

export async function updateQuestion(id: string, data: Partial<Pick<CreateQuestionInput, 'title' | 'body' | 'category' | 'tags'>>) {
  return prisma.question.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function deleteQuestion(id: string) {
  // Delete all answers and votes first
  await prisma.answer.deleteMany({ where: { questionId: id } });
  await prisma.questionVote.deleteMany({ where: { questionId: id } });
  return prisma.question.delete({ where: { id } });
}

// Answers

export async function createAnswer(input: CreateAnswerInput) {
  const now = new Date();

  const answer = await prisma.answer.create({
    data: {
      ...input,
      createdAt: now,
      updatedAt: now,
    },
  });

  // Update answer count on question
  await prisma.question.update({
    where: { id: input.questionId },
    data: {
      answerCount: { increment: 1 },
      updatedAt: now,
    },
  });

  return answer;
}

export async function getAnswersByQuestionId(questionId: string) {
  return prisma.answer.findMany({
    where: { questionId },
    orderBy: [
      { isAccepted: 'desc' },
      { voteCount: 'desc' },
      { createdAt: 'asc' },
    ],
  });
}

export async function updateAnswer(id: string, body: string) {
  return prisma.answer.update({
    where: { id },
    data: {
      body,
      updatedAt: new Date(),
    },
  });
}

export async function deleteAnswer(id: string, questionId: string) {
  await prisma.answerVote.deleteMany({ where: { answerId: id } });
  await prisma.answer.delete({ where: { id } });

  // Update answer count
  await prisma.question.update({
    where: { id: questionId },
    data: { answerCount: { decrement: 1 } },
  });
}

export async function acceptAnswer(answerId: string, questionId: string) {
  // Unmark any previously accepted answer
  await prisma.answer.updateMany({
    where: { questionId, isAccepted: true },
    data: { isAccepted: false },
  });

  // Mark this answer as accepted
  await prisma.answer.update({
    where: { id: answerId },
    data: { isAccepted: true },
  });

  // Update question
  await prisma.question.update({
    where: { id: questionId },
    data: {
      acceptedAnswerId: answerId,
      isResolved: true,
      updatedAt: new Date(),
    },
  });
}

// Voting

export async function voteQuestion(questionId: string, userId: string, value: 1 | -1) {
  const existingVote = await prisma.questionVote.findUnique({
    where: { questionId_userId: { questionId, userId } },
  });

  if (existingVote) {
    if (existingVote.value === value) {
      // Remove vote if clicking same button
      await prisma.questionVote.delete({
        where: { id: existingVote.id },
      });
      await prisma.question.update({
        where: { id: questionId },
        data: { voteCount: { decrement: value } },
      });
      return { action: 'removed', newValue: 0 };
    } else {
      // Change vote direction
      await prisma.questionVote.update({
        where: { id: existingVote.id },
        data: { value },
      });
      await prisma.question.update({
        where: { id: questionId },
        data: { voteCount: { increment: value * 2 } }, // -1 to 1 or 1 to -1
      });
      return { action: 'changed', newValue: value };
    }
  }

  // New vote
  await prisma.questionVote.create({
    data: {
      questionId,
      userId,
      value,
      createdAt: new Date(),
    },
  });
  await prisma.question.update({
    where: { id: questionId },
    data: { voteCount: { increment: value } },
  });
  return { action: 'added', newValue: value };
}

export async function voteAnswer(answerId: string, userId: string, value: 1 | -1) {
  const existingVote = await prisma.answerVote.findUnique({
    where: { answerId_userId: { answerId, userId } },
  });

  if (existingVote) {
    if (existingVote.value === value) {
      await prisma.answerVote.delete({
        where: { id: existingVote.id },
      });
      await prisma.answer.update({
        where: { id: answerId },
        data: { voteCount: { decrement: value } },
      });
      return { action: 'removed', newValue: 0 };
    } else {
      await prisma.answerVote.update({
        where: { id: existingVote.id },
        data: { value },
      });
      await prisma.answer.update({
        where: { id: answerId },
        data: { voteCount: { increment: value * 2 } },
      });
      return { action: 'changed', newValue: value };
    }
  }

  await prisma.answerVote.create({
    data: {
      answerId,
      userId,
      value,
      createdAt: new Date(),
    },
  });
  await prisma.answer.update({
    where: { id: answerId },
    data: { voteCount: { increment: value } },
  });
  return { action: 'added', newValue: value };
}

export async function getUserVotes(userId: string, questionId: string) {
  const [questionVote, answerVotes] = await Promise.all([
    prisma.questionVote.findUnique({
      where: { questionId_userId: { questionId, userId } },
    }),
    prisma.answerVote.findMany({
      where: {
        userId,
        answerId: {
          in: (await prisma.answer.findMany({
            where: { questionId },
            select: { id: true },
          })).map(a => a.id),
        },
      },
    }),
  ]);

  return {
    questionVote: questionVote?.value || 0,
    answerVotes: Object.fromEntries(answerVotes.map(v => [v.answerId, v.value])),
  };
}

// Categories (for filtering)
export async function getQuestionCategories() {
  const categories = await prisma.question.groupBy({
    by: ['category'],
    _count: { category: true },
  });
  return categories.map(c => ({ name: c.category, count: c._count.category }));
}

// Popular tags
export async function getPopularTags(limit = 10) {
  const questions = await prisma.question.findMany({
    select: { tags: true },
  });

  const tagCounts = new Map<string, number>();
  questions.forEach(q => {
    q.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}
