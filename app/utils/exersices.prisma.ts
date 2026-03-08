import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.server";
import { UploadExersiceForm } from "./types.server";
import { uploadToCloudinary } from "./cloudinary.server";

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

  const newExercise = await prisma.exersice.create({
    data: exerciseData as Parameters<typeof prisma.exersice.create>[0]['data'],
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
 * Get paginated exercises with optional filters
 */
export async function getPaginatedExercises(page = 1, limit = 12, filters?: { category?: string; tags?: string }) {
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};
  if (filters?.category) where.category = filters.category;
  if (filters?.tags) where.tags = { contains: filters.tags };

  const [exercises, total] = await Promise.all([
    prisma.exersice.findMany({
      where,
      select: {
        id: true,
        title: true,
        category: true,
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
  tags: string;
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
