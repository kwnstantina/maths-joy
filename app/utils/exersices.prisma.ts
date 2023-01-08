import { prisma } from "./prisma.server";

export const createExersice = async (exer: any) => {
  const newExercise = await prisma.exersice.create({
    data: {
      title: exer.title,
      category: exer.category,
      fileContentType: exer.fileContentType,
      fileName: exer.file['_name'],
      tags: exer.tags,
    },
  });
  return { id: newExercise.id };
};
