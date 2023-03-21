import { separateLatterMaths } from "utils/utils";
import { prisma } from "./prisma.server";
import { CreateTrainingExersice } from "./types.server";

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
    },
  });
  return { id: newTrainingExersice.id };
};

export const getTrainingExercises = async () => {
  let exersicesList= await prisma.training.findMany({
    select:{
      id:true,
      title: true,
      category: true,
      solution:true,
      content:true,
      tags: true,
      contentImage:true,
      solutionImage:true,
    }
    
  });
 exersicesList=exersicesList.map((cur):any=>{
    let ok:any=[]
    if(cur.content){
        cur.content.split(' ').forEach((item:string)=>{
             if(separateLatterMaths(item)){
              ok.push({
                isText:true,
                content:item.replace('\r\n','  ')
              })
             }else{
              ok.push({
                isText:false,
                content:item.replace('\r\n','  ')
              })
             }
     })
    }
    return {
      ...cur,
      content:ok
    }
   
       
  })
  return { exersicesList };
};
