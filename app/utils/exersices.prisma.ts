import { prisma } from "./prisma.server";
import { UploadExersiceForm } from "./types.server";

export const createExersice = async (exer: UploadExersiceForm) => {
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
