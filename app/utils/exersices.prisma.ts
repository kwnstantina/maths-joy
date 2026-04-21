import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.server";
import { UploadExersiceForm } from "./types.server";
import { uploadToCloudinary } from "./cloudinary.server";

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

interface CreateExerciseData {
  title: string;
  category: string;
  fileContentType?: string;
  fileName: string;
  tags: string;
  description?: string;
  exerciseImgUrl?: string;
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  fileSize?: number;
}

/**
 * Legacy helper — retained for backward compatibility with old callers.
 * TODO: deprecated — replaced by createExerciseFromStream + getPaginatedExercises.
 */
export const createExersice = async (exer: UploadExersiceForm) => {
  const fileName = typeof exer.file === 'string' ? 'uploaded-file' : exer.file['name'] || 'exercise';

  // Prepare base exercise data
  const exerciseData: CreateExerciseData = {
    title: exer.title,
    category: exer.category,
    fileName: fileName,
    tags: exer.tags,
    description: exer.description,
    exerciseImgUrl: exer.exerciseImgUrl,
  };

  // If we have base64 content, try to upload to Cloudinary
  if (exer.fileContentType && process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const cloudinaryResult = await uploadToCloudinary(exer.fileContentType, {
        folder: 'maths-joy/exercises',
        resource_type: 'raw',
        tags: [exer.category, ...exer.tags.split(',').map(t => t.trim())],
      });

      exerciseData.cloudinaryPublicId = cloudinaryResult.public_id;
      exerciseData.cloudinaryUrl = cloudinaryResult.secure_url;
      exerciseData.fileSize = cloudinaryResult.bytes;
      // Don't store base64 in DB when using Cloudinary
      exerciseData.fileContentType = undefined;
    } catch (error) {
      console.error('Failed to upload to Cloudinary, falling back to base64:', error);
      // Fallback: store base64 in database
      exerciseData.fileContentType = exer.fileContentType;
    }
  } else {
    // No Cloudinary configured, use legacy base64 storage
    exerciseData.fileContentType = exer.fileContentType;
  }

  // Legacy helper — takes a comma-separated tags string and splits it into the
  // new String[] shape so the typed client accepts it. This is only here for
  // back-compat; new code should use createExerciseFromStream.
  const tagArray = exerciseData.tags
    ? exerciseData.tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
    : [];

  const newExercise = await prisma.exersice.create({
    data: {
      title: exerciseData.title,
      category: exerciseData.category,
      fileName: exerciseData.fileName,
      tags: tagArray,
      description: exerciseData.description ?? null,
      exerciseImgUrl: exerciseData.exerciseImgUrl ?? null,
      fileContentType: exerciseData.fileContentType ?? null,
      cloudinaryPublicId: exerciseData.cloudinaryPublicId ?? null,
      cloudinaryUrl: exerciseData.cloudinaryUrl ?? null,
      fileSize: exerciseData.fileSize ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return { id: newExercise.id };
};


export const getAllExcersices = async()=>{

  const exersices =await prisma.exersice.findMany(  {select: {
    id:true,
    title: true,
    category:true,
    createdAt:true,
    tags:true,
    description:true,
    exerciseImgUrl:true,
    translation:true,
  }})
  return exersices;
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

/**
 * TODO: deprecated — superseded by getPaginatedExercises. Left in place
 * to avoid blast radius; revisit when all call sites are audited.
 */
export const getExersiceBySearch = async(filters:any) =>{
  const exersice =await prisma.exersice.findMany({select: {
    id:true,
    title: true,
    category:true,
    createdAt:true,
    tags:true,
    description:true,
    exerciseImgUrl:true,
    translation:true,
  },where: {...filters}});

  return exersice;
}
