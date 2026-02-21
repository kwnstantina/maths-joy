import { prisma } from "./prisma.server";

interface VideoInput {
  title: string;
  url: string;
  description: string;
  creatorName: string;
  tags: string[];
  translation?: Record<string, unknown>;
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
