import { prisma } from "./prisma.server";
import { UploadExersiceForm } from "./types.server";
import { uploadToCloudinary } from "./cloudinary.server";

interface CreateExerciseData {
  title: string;
  category: string;
  fileContentType?: string;
  fileName: string;
  tags: string;
  description?: string;
  exerciseImgUrl?: string;
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  fileSize?: number;
}

export const createExersice = async (exer: UploadExersiceForm) => {
  const fileName = typeof exer.file === 'string' ? 'uploaded-file' : exer.file['name'] || 'exercise';

  // Prepare base exercise data
  const exerciseData: CreateExerciseData = {
    title: exer.title,
    category: exer.category,
    fileName: fileName,
    tags: exer.tags,
    description: exer.description,
    exerciseImgUrl: exer.exerciseImgUrl,
  };

  // If we have base64 content, try to upload to Cloudinary
  if (exer.fileContentType && process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      const cloudinaryResult = await uploadToCloudinary(exer.fileContentType, {
        folder: 'maths-joy/exercises',
        resource_type: 'raw',
        tags: [exer.category, ...exer.tags.split(',').map(t => t.trim())],
      });

      exerciseData.cloudinaryPublicId = cloudinaryResult.public_id;
      exerciseData.cloudinaryUrl = cloudinaryResult.secure_url;
      exerciseData.fileSize = cloudinaryResult.bytes;
      // Don't store base64 in DB when using Cloudinary
      exerciseData.fileContentType = undefined;
    } catch (error) {
      console.error('Failed to upload to Cloudinary, falling back to base64:', error);
      // Fallback: store base64 in database
      exerciseData.fileContentType = exer.fileContentType;
    }
  } else {
    // No Cloudinary configured, use legacy base64 storage
    exerciseData.fileContentType = exer.fileContentType;
  }

  const newExercise = await prisma.exersice.create({
    data: exerciseData as Parameters<typeof prisma.exersice.create>[0]['data'],
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
    description:true,
    exerciseImgUrl:true,
    translation:true,
  }})
  return exersices;
}


export const getExersiceById = async (id: string | undefined) => {
  const exersice = await prisma.exersice.findFirst({
    select: {
      fileContentType: true,
      title: true,
      translation: true,
      cloudinaryPublicId: true,
      cloudinaryUrl: true,
      fileSize: true,
    },
    where: { id },
  });
  return exersice;
}

export const getExersiceBySearch = async(filters:any) =>{
  const exersice =await prisma.exersice.findMany({select: {
    id:true,
    title: true,
    category:true,
    createdAt:true,
    tags:true,
    description:true,
    exerciseImgUrl:true,
    translation:true,
  },where: {...filters}});
  
  return exersice;
}
