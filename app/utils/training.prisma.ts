import type { Prisma } from "@prisma/client";
import { groupBy } from "../../utils/utils";
import { getLocalizedContent, type SupportedLanguage } from "./i18n.server";
import { prisma } from "./prisma.server";
import { CreateTrainingExersice } from "./types.server";

export const createTrainingExercise = async (item: CreateTrainingExersice) => {
  const newTrainingExersice = await prisma.training.create({
    data: {
      title: item.title,
      category: item.category,
      solutionImage: item.solution,
      contentImage: item.exercise,
      tags: item.tags,
      content: '',
      solution: '',
      searchableTitle: item.searchableTitle,
    } as any,
  });
  return { id: newTrainingExersice.id };
};

export const getTrainingExercises = async (language: SupportedLanguage) => {
  const exersicesList = await prisma.training.findMany({
    select: {
      id: true,
      title: true,
      tags: true,
      contentImage: true,
      solutionImage: true,
      searchableTitle: true,
      translation: true,
    }
  }) as any;
  const key = "searchableTitle"
  const arrayUniqueByKey = [...new Map(exersicesList.map((item: any) => [item[key], item])).values()]
    // `searchableTitle` stays the untranslated filter key; `label` is what we show.
    .map((item: any) => {
      const localized = getLocalizedContent(item, language);
      return { ...localized, searchableTitle: item.searchableTitle, label: localized.searchableTitle };
    });
  const searchableExersices = arrayUniqueByKey.map((item: any) => {
    return {
      id: item.id,
      children: item.searchableTitle,
      href: `?searchableTitle=${item.searchableTitle}`,
    }
  })
  const groupedExersices = groupBy(arrayUniqueByKey, (exersicesList: any) => exersicesList.title)
  return { groupedExersices, searchableExersices };
};


/** One training problem as Greg AI reads it, plus whether its text is current. */
export interface TrainingProblemText {
  id: string;
  statement: string | null;
  solution: string | null;
  /** True when the stored text was made from different images (or never). */
  stale: boolean;
}

/**
 * What Greg AI is told about the training problem on screen: its chapter,
 * name, and the transcribed text of its image(s) — see trainingTranscript.server.ts.
 */
export async function getTrainingContextByTitle(
  searchableTitle: string,
  language: SupportedLanguage
): Promise<{ chapter: string; label: string; problems: TrainingProblemText[] } | null> {
  const rows = await prisma.training.findMany({
    where: { searchableTitle },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      searchableTitle: true,
      translation: true,
      contentImage: true,
      solutionImage: true,
      gregStatement: true,
      gregSolution: true,
      gregSource: true,
    },
  });
  if (rows.length === 0) return null;
  const localized = getLocalizedContent(rows[0] as any, language) as any;
  return {
    chapter: localized.title,
    label: localized.searchableTitle,
    problems: rows.map((row) => {
      // Same key as trainingSourceKey(); inlined so this module stays free of
      // the Anthropic client.
      const current = row.gregSource === `${row.contentImage}|${row.solutionImage}`;
      return {
        id: row.id,
        statement: current ? row.gregStatement : null,
        solution: current ? row.gregSolution : null,
        stale: !current,
      };
    }),
  };
}

/**
 * Get paginated training exercises for admin
 */
export async function getPaginatedTraining(page = 1, limit = 12) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.training.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.training.count(),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

interface TrainingUpdateInput {
  title?: string;
  category?: string;
  tags?: string;
  searchableTitle?: string;
  contentImage?: string;
  solutionImage?: string;
  translation?: Prisma.InputJsonValue;
}

/**
 * Create a training exercise from streaming upload results
 */
export async function createTrainingFromStream(data: {
  title: string;
  category: string;
  tags: string;
  searchableTitle: string;
  contentImage: string;
  solutionImage: string;
  translation?: Prisma.InputJsonValue;
}) {
  return prisma.training.create({
    data: {
      title: data.title,
      category: data.category,
      tags: data.tags,
      searchableTitle: data.searchableTitle,
      contentImage: data.contentImage,
      solutionImage: data.solutionImage,
      content: "",
      solution: "",
      translation: data.translation ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Parameters<typeof prisma.training.create>[0]["data"],
  });
}

/**
 * Update a training exercise
 */
export async function updateTraining(id: string, data: TrainingUpdateInput) {
  const existing = await prisma.training.findUnique({ where: { id } });
  if (!existing) throw new Error("Training not found");

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.searchableTitle !== undefined) updateData.searchableTitle = data.searchableTitle;
  if (data.contentImage !== undefined) updateData.contentImage = data.contentImage;
  if (data.solutionImage !== undefined) updateData.solutionImage = data.solutionImage;
  if (data.translation !== undefined) updateData.translation = data.translation;

  return prisma.training.update({
    where: { id },
    data: updateData as Prisma.TrainingUpdateInput,
  });
}

/**
 * Delete a training exercise
 */
export async function deleteTraining(id: string) {
  const training = await prisma.training.findUnique({ where: { id } });
  if (!training) throw new Error("Training not found");
  await prisma.training.delete({ where: { id } });
  return training;
}

export const getTraingingExerciseByTitle = async (
  searchableTitle: string | null,
  language: SupportedLanguage
) => {
  const exersiceByTitle = await prisma.training.findMany({
    where: {
      searchableTitle: {
        equals: searchableTitle || ''
      }
    },
  });
  return exersiceByTitle.map((item) =>
    getLocalizedContent(item as unknown as Parameters<typeof getLocalizedContent>[0], language)
  );
}