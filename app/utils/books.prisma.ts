import { prisma } from "./prisma.server";
import {
  uploadToCloudinary,
  uploadImageWithTransform,
  deleteFromCloudinary,
} from "./cloudinary.server";

interface BookInput {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  tags: string[];
  pdfBase64: string;
  thumbnailBase64?: string;
  isActive?: boolean;
  translation?: Record<string, unknown>;
}

interface BookUpdateInput {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  tags?: string[];
  pdfBase64?: string;
  thumbnailBase64?: string;
  isActive?: boolean;
  translation?: Record<string, unknown>;
}

export async function createBook(data: BookInput) {
  // Upload PDF to Cloudinary
  const pdfResult = await uploadToCloudinary(data.pdfBase64, {
    folder: "maths-joy/books",
    resource_type: "raw",
    tags: data.tags,
  });

  // Upload thumbnail if provided
  let thumbnailUrl: string | null = null;
  if (data.thumbnailBase64) {
    const thumbnailResult = await uploadImageWithTransform(data.thumbnailBase64, {
      folder: "maths-joy/book-thumbnails",
      width: 400,
      height: 600,
      crop: "fill",
    });
    thumbnailUrl = thumbnailResult.secure_url;
  }

  return prisma.book.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      cloudinaryPublicId: pdfResult.public_id,
      cloudinaryUrl: pdfResult.secure_url,
      thumbnailUrl,
      category: data.category,
      tags: data.tags,
      isActive: data.isActive ?? true,
      translation: data.translation,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

export async function updateBook(id: string, data: BookUpdateInput) {
  const existingBook = await prisma.book.findUnique({ where: { id } });
  if (!existingBook) {
    throw new Error("Book not found");
  }

  let cloudinaryPublicId = existingBook.cloudinaryPublicId;
  let cloudinaryUrl = existingBook.cloudinaryUrl;
  let thumbnailUrl = existingBook.thumbnailUrl;

  // If new PDF is provided, upload it and delete the old one
  if (data.pdfBase64) {
    const pdfResult = await uploadToCloudinary(data.pdfBase64, {
      folder: "maths-joy/books",
      resource_type: "raw",
      tags: data.tags || existingBook.tags,
    });
    // Delete old PDF
    await deleteFromCloudinary(existingBook.cloudinaryPublicId, "raw");
    cloudinaryPublicId = pdfResult.public_id;
    cloudinaryUrl = pdfResult.secure_url;
  }

  // If new thumbnail is provided, upload it
  if (data.thumbnailBase64) {
    const thumbnailResult = await uploadImageWithTransform(data.thumbnailBase64, {
      folder: "maths-joy/book-thumbnails",
      width: 400,
      height: 600,
      crop: "fill",
    });
    thumbnailUrl = thumbnailResult.secure_url;
  }

  return prisma.book.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      currency: data.currency,
      cloudinaryPublicId,
      cloudinaryUrl,
      thumbnailUrl,
      category: data.category,
      tags: data.tags,
      isActive: data.isActive,
      translation: data.translation,
      updatedAt: new Date(),
    },
  });
}

export async function deleteBook(id: string) {
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    throw new Error("Book not found");
  }

  // Delete PDF from Cloudinary
  await deleteFromCloudinary(book.cloudinaryPublicId, "raw");

  return prisma.book.delete({ where: { id } });
}

export async function getBookById(id: string) {
  return prisma.book.findUnique({ where: { id } });
}

export async function getAllBooks(activeOnly = false) {
  return prisma.book.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

export async function toggleBookActive(id: string) {
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    throw new Error("Book not found");
  }

  return prisma.book.update({
    where: { id },
    data: {
      isActive: !book.isActive,
      updatedAt: new Date(),
    },
  });
}
