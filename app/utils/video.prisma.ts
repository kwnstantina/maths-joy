import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.server";

interface VideoInput {
  title: string;
  url: string;
  description: string;
  creatorName: string;
  category?: string;
  tags: string[];
  translation?: Prisma.InputJsonValue;
}

export async function createVideo(data: VideoInput) {
  return prisma.video.create({
    data: {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function updateVideo(id: string, data: Partial<VideoInput>) {
  return prisma.video.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function deleteVideo(id: string) {
  return prisma.video.delete({
    where: { id },
  });
}

export async function getVideoById(id: string) {
  return prisma.video.findUnique({
    where: { id },
  });
}

/**
 * Greg AI's video search: same keyword match as the exercise search, over
 * the fields a student would describe a video by.
 */
export async function searchVideosForGreg(query: string, limit = 3) {
  const q = query.trim();
  if (!q) return [];
  return prisma.video.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ],
    },
    select: { id: true, title: true, category: true },
    take: limit,
  });
}

export async function getAllVideos() {
  return prisma.video.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get paginated videos for admin
 */
export async function getPaginatedVideos(page = 1, limit = 12) {
  const skip = (page - 1) * limit;

  const [videos, total] = await Promise.all([
    prisma.video.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.video.count(),
  ]);

  return { videos, total, page, totalPages: Math.ceil(total / limit) };
}
