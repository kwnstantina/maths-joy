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
