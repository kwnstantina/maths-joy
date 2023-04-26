import { groupBy } from "utils/utils";
import { prisma } from "./prisma.server";
import { CreateTrainingExersice } from "./types.server";
import { json } from "@remix-run/node";

export const createTrainingExercise = async (item: CreateTrainingExersice) => {
  const newTrainingExersice= await prisma.training.create({
    data: {
      title: item.title,
      category: item.category,
      solutionImage:item.solution,
      contentImage:item.exercise,
      tags: item.tags,
      content:'',
      solution:'',
      searchableTitle:item.searchableTitle,
    },
  });
  return { id: newTrainingExersice.id };
};

export const getTrainingExercises = async () => {
  let exersicesList= await prisma.training.findMany({
    select:{
      id:true,
      title: true,
      tags: true,
      contentImage:true,
      solutionImage:true,
      searchableTitle:true
    }
   }) as any;
   const key="searchableTitle"
   const arrayUniqueByKey = [...new Map(exersicesList.map((item:any) =>
    [item[key], item])).values()];
  const groupedExersices=groupBy(arrayUniqueByKey,(exersicesList:any)=>exersicesList.title)
  return {groupedExersices};
};


export const getTraingingExerciseByTitle =async (searchableTitle:string | null)=>{
  const exersiceByTitle = await prisma.training.findMany({
    where: {
      searchableTitle:{
      equals: searchableTitle
      }
    },
  });
  return exersiceByTitle
}