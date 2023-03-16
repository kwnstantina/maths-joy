import { prisma } from "./prisma.server";
import { CreateTrainingExersice } from "./types.server";

export const createTrainingExercise = async (item: CreateTrainingExersice) => {
  const newTrainingExersice= await prisma.training.create({
    data: {
      title: item.title,
      category: item.category,
      solution:item.solution,
      content:item.exercise,
      tags: item.tags,
    },
  });
  return { id: newTrainingExersice.id };
};
