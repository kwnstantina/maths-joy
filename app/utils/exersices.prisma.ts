import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.server";

export interface ExerciseFilters {
  category?: string;
  level?: string;
  type?: string;
  /**
   * Free-text search term. Matched against title + description + tags.
   * Title + description use case-insensitive substring (`mode: "insensitive"`).
   * Tag matching is an EXACT element match on the tags array (see note below).
   */
  text?: string;
  /**
   * Language hint. Reserved for future EN-mode JSON-path search (see note in
   * `getPaginatedExercises` body). In v1.1 the text filter always queries the
   * Greek-canonical columns regardless of `lang`; this field is accepted to
   * keep the API stable for Plan 06-03 and future iterations.
   */
  lang?: "el" | "en";
}

export const getExersiceById = async (id: string | undefined) => {
  const exersice = await prisma.exersice.findFirst({
    select: {
      fileContentType: true,
      title: true,
      translation: true,
      cloudinaryPublicId: true,
      cloudinaryUrl: true,
      fileSize: true,
    },
    where: { id },
  });
  return exersice;
}

/**
 * Metadata-only lookup used to give Greg AI context about the exercise the
 * student is currently viewing. Deliberately separate from `getExersiceById`
 * (which selects the fields the PDF viewer needs) so the two can diverge: this
 * one wants the pedagogical fields and none of the file plumbing.
 *
 * Returns `null` for a missing id — an unknown id is not an error here, the
 * chat just falls back to generic page context.
 */
export const getExerciseContextById = async (id: string | undefined) => {
  // The id reaches us from a URL path segment, so it may be anything. Prisma
  // throws on a malformed ObjectId rather than returning null — check first.
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) return null;
  return prisma.exersice.findFirst({
    select: {
      title: true,
      description: true,
      category: true,
      level: true,
      tags: true,
      translation: true,
      gregSource: true,
      cloudinaryPublicId: true,
    },
    where: { id },
  });
};

/**
 * Greg AI's table of contents for a booklet: one line per problem. The full
 * text is fetched per problem (getExerciseItem) so a long booklet doesn't
 * ride along on every chat message.
 */
export const getExerciseItemIndex = async (exerciseId: string) =>
  prisma.exerciseItem.findMany({
    where: { exerciseId },
    select: { order: true, section: true, label: true, topic: true },
    orderBy: { order: "asc" },
  });

/** One problem of a booklet by its 1-based position. */
export const getExerciseItem = async (exerciseId: string, order: number) =>
  prisma.exerciseItem.findFirst({
    where: { exerciseId, order },
    select: {
      id: true,
      order: true,
      section: true,
      label: true,
      topic: true,
      statement: true,
      solution: true,
    },
  });

/** One problem by id, scoped to its booklet so a stale id can't leak across. */
export const getExerciseItemById = async (exerciseId: string, itemId: string) =>
  prisma.exerciseItem.findFirst({
    where: { id: itemId, exerciseId },
    select: {
      id: true,
      order: true,
      section: true,
      label: true,
      topic: true,
      statement: true,
      solution: true,
    },
  });

/**
 * Library search for Greg AI's `search_exercises` tool. Matches individual
 * problems (topic + text) and booklet metadata, so "παράγωγος" finds the
 * derivative problems inside a booklet titled just "Γ-Λυκείου". Never returns
 * solutions.
 */
export async function searchExercisesForGreg(query: string, limit = 6) {
  const q = query.trim();
  if (!q) return [];

  const matchingBooklets = await prisma.exersice.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ],
    },
    select: { id: true },
  });

  const items = await prisma.exerciseItem.findMany({
    where: {
      OR: [
        { topic: { contains: q, mode: "insensitive" } },
        { statement: { contains: q, mode: "insensitive" } },
        { section: { contains: q, mode: "insensitive" } },
        { exerciseId: { in: matchingBooklets.map((b) => b.id) } },
      ],
    },
    select: {
      exerciseId: true,
      order: true,
      section: true,
      label: true,
      topic: true,
      statement: true,
    },
    orderBy: [{ exerciseId: "asc" }, { order: "asc" }],
    take: limit,
  });

  const booklets = await prisma.exersice.findMany({
    where: { id: { in: [...new Set(items.map((i) => i.exerciseId))] } },
    select: { id: true, title: true, category: true, level: true },
  });
  const bookletById = new Map(booklets.map((b) => [b.id, b]));

  return items.map((item) => ({ ...item, booklet: bookletById.get(item.exerciseId) }));
}

/**
 * Get paginated exercises with optional filters.
 *
 * Filter semantics:
 *   - `category`, `level`, `type`: exact equality against the Greek-canonical
 *     columns (DB storage is always Greek per Phase 5 convention).
 *   - `text`: free-text search. EL mode matches title + description via
 *     Prisma `mode: "insensitive"` substring and tags via exact-element
 *     `has` (case-sensitive — documented limitation, see comment below).
 *     EN mode matches `translation.en.title` / `translation.en.description`
 *     via JSON `string_contains` (case-sensitive until Prisma ships
 *     case-insensitive JSON path matching on MongoDB).
 *
 * Prisma version: 5.22.0. `mode: "insensitive"` is supported on the MongoDB
 * connector (since Prisma 3.6).
 */
export async function getPaginatedExercises(
  page = 1,
  limit = 12,
  filters?: ExerciseFilters
) {
  const skip = (page - 1) * limit;
  const where: Prisma.ExersiceWhereInput = {};

  if (filters?.category) where.category = filters.category;
  if (filters?.level) where.level = filters.level;
  if (filters?.type) where.type = filters.type;

  if (filters?.text) {
    const t = filters.text.trim();
    if (t.length > 0) {
      // NOTE: In Prisma 5.22 the MongoDB connector's JsonNullableFilter
      // supports only `equals` / `not` / `isSet` — it does NOT accept
      // `path` + `string_contains` (that shape is PostgreSQL-only). So we
      // cannot filter on `translation.en.title` / `translation.en.description`
      // through the typed client.
      //
      // v1.1 resolution: text search always queries the Greek-canonical
      // columns (title + description + tags). EN-mode users still see their
      // translations rendered via getLocalizedContent; a Greek-canonical
      // search term still matches the right rows because the Greek columns
      // are the source of truth. A follow-up can add EN-mode JSON-path
      // matching via `$runCommandRaw` with a case-insensitive regex if
      // users request it.
      //
      // NOTE on tags: `has` performs an EXACT element match on a String[] —
      // NOT a substring search, and it is case-sensitive. Acceptable for
      // v1.1; a lowercased-tag duplicate column is a future nice-to-have.
      where.OR = [
        { title: { contains: t, mode: "insensitive" } },
        { description: { contains: t, mode: "insensitive" } },
        { tags: { has: t } },
      ];
    }
  }

  const [exercises, total] = await Promise.all([
    prisma.exersice.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
        level: true,
        type: true,
        createdAt: true,
        tags: true,
        description: true,
        exerciseImgUrl: true,
        translation: true,
        cloudinaryPublicId: true,
        cloudinaryUrl: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.exersice.count({ where }),
  ]);

  return { exercises, total, page, totalPages: Math.ceil(total / limit) };
}

interface StreamingExerciseInput {
  title: string;
  category: string;
  tags: string[];
  level?: string | null;
  type?: string | null;
  description?: string;
  exerciseImgUrl?: string;
  fileName: string;
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  fileSize?: number;
  translation?: Prisma.InputJsonValue;
}

/**
 * Create an exercise from streaming upload results (decoupled from Cloudinary upload)
 */
export async function createExerciseFromStream(data: StreamingExerciseInput) {
  return prisma.exersice.create({
    data: {
      title: data.title,
      category: data.category,
      tags: data.tags,
      level: data.level ?? null,
      type: data.type ?? null,
      description: data.description ?? null,
      exerciseImgUrl: data.exerciseImgUrl ?? null,
      fileName: data.fileName,
      cloudinaryPublicId: data.cloudinaryPublicId ?? null,
      cloudinaryUrl: data.cloudinaryUrl ?? null,
      fileSize: data.fileSize ?? null,
      translation: data.translation ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Update an existing exercise
 */
export async function updateExercise(id: string, data: Partial<StreamingExerciseInput>) {
  const existing = await prisma.exersice.findUnique({ where: { id } });
  if (!existing) throw new Error("Exercise not found");

  const updateData: Prisma.ExersiceUpdateInput = { updatedAt: new Date() };
  if (data.title !== undefined) updateData.title = data.title;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.level !== undefined) updateData.level = data.level;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.exerciseImgUrl !== undefined) updateData.exerciseImgUrl = data.exerciseImgUrl;
  if (data.cloudinaryPublicId !== undefined) updateData.cloudinaryPublicId = data.cloudinaryPublicId;
  if (data.cloudinaryUrl !== undefined) updateData.cloudinaryUrl = data.cloudinaryUrl;
  if (data.fileSize !== undefined) updateData.fileSize = data.fileSize;
  if (data.translation !== undefined) updateData.translation = data.translation;

  return prisma.exersice.update({ where: { id }, data: updateData });
}

/**
 * Hard delete an exercise
 */
export async function deleteExercise(id: string) {
  const exercise = await prisma.exersice.findUnique({ where: { id } });
  if (!exercise) throw new Error("Exercise not found");
  await prisma.exersice.delete({ where: { id } });
  return exercise;
}

