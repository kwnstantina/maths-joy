
import { prisma } from "./prisma.server";

export const getTutorialsWithPagination = async(page: number) =>{
    const tutorials =await prisma.video.findMany({
        select: {
            id:true,
            url:true,
            title: true,
            description:true,
            creatorName:true,
            tags: true, createdAt: true, 
        },
        take: 5,
        skip: page===0? 0 :page
    });

    return {
        data:tutorials,
        page:page

  }
}
  