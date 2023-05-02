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
      description: exer.description,
      exerciseImgUrl:exer.exerciseImgUrl
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
  }})
  return exersices;
}


export const getExersiceById= async(id:string | undefined)=>{
  const exersice =await prisma.exersice.findFirst({select: {
    fileContentType:true,
    title: true,
  },where: {id}});
  return exersice;
}

export const getExersiceBySearch = async(filters:any) =>{
  const exersice =await prisma.exersice.findMany({select: {
    id:true,
    title: true,
    category:true,
    createdAt:true,
    tags:true,
  },where: {...filters}});
  
  return exersice;
}
