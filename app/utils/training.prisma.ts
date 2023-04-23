import { groupBy } from "utils/utils";
import { prisma } from "./prisma.server";
import { CreateTrainingExersice } from "./types.server";
import { SIDE_BAR_CATEGORIES } from "services/models/models";

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
//  exersicesList=exersicesList.map((cur):any=>{
//     let ok:any=[]
//     if(cur.content){
//         cur.content.split(' ').forEach((item:string)=>{
//              if(separateLatterMaths(item)){
//               ok.push({
//                 isText:true,
//                 content:item.replace('\r\n','  ')
//               })
//              }else{
//               ok.push({
//                 isText:false,
//                 content:item.replace('\r\n','  ')
//               })
//              }
//      })
//     }
//     return {
//       ...cur,
//       content:ok
//    }    
//   })
// const exersicesList = await prisma.training.findMany({
//   where: {
//     title: {
//       in: SIDE_BAR_CATEGORIES,
//     },
//   },
// });
  let groupedExersices=groupBy(exersicesList,(exersicesList:any)=>exersicesList.title)
  return {groupedExersices};
};
