import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.server";

interface BookInput {
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  currency: string;
  category: string;
  tags: string[];
  authorName?: string;
  pageCount?: number;
  isbn?: string;
  edition?: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  isActive?: boolean;
  translation?: Prisma.InputJsonValue;
}

interface BookUpdateInput {
  title?: string;
  description?: string;
  price?: number;
  discountPrice?: number;
  currency?: string;
  category?: string;
  tags?: string[];
  authorName?: string;
  pageCount?: number;
  isbn?: string;
  edition?: string;
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  isActive?: boolean;
  translation?: Prisma.InputJsonValue;
}

/**
 * Create a new book record in the database.
 * Expects Cloudinary upload results to be passed in (no file upload logic here).
 */
export async function createBook(data: BookInput) {
  return prisma.book.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      discountPrice: data.discountPrice,
      currency: data.currency,
      cloudinaryPublicId: data.cloudinaryPublicId,
      cloudinaryUrl: data.cloudinaryUrl,
      thumbnailUrl: data.thumbnailUrl ?? null,
      thumbnailPublicId: data.thumbnailPublicId ?? null,
      category: data.category,
      tags: data.tags,
      authorName: data.authorName ?? null,
      pageCount: data.pageCount ?? null,
      isbn: data.isbn ?? null,
      edition: data.edition ?? null,
      isActive: data.isActive ?? true,
      translation: data.translation ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Update an existing book record.
 * If a new cloudinaryPublicId is provided and differs from the existing one,
 * the old public ID is archived (pushed to archivedPdfIds) instead of being deleted.
 * Only provided (non-undefined) fields are updated.
 */
export async function updateBook(id: string, data: BookUpdateInput) {
  const existingBook = await prisma.book.findUnique({ where: { id } });
  if (!existingBook) {
    throw new Error("Book not found");
  }

  // Check if PDF is being replaced -- archive old public ID
  const isPdfReplaced =
    data.cloudinaryPublicId &&
    data.cloudinaryPublicId !== existingBook.cloudinaryPublicId;

  // If PDF replaced, first archive the old public ID
  if (isPdfReplaced) {
    await prisma.book.update({
      where: { id },
      data: {
        archivedPdfIds: { push: existingBook.cloudinaryPublicId },
      },
    });
  }

  // Build update data with only provided fields
  const updateData: Prisma.BookUpdateInput = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.discountPrice !== undefined) updateData.discountPrice = data.discountPrice;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.authorName !== undefined) updateData.authorName = data.authorName;
  if (data.pageCount !== undefined) updateData.pageCount = data.pageCount;
  if (data.isbn !== undefined) updateData.isbn = data.isbn;
  if (data.edition !== undefined) updateData.edition = data.edition;
  if (data.cloudinaryPublicId !== undefined) updateData.cloudinaryPublicId = data.cloudinaryPublicId;
  if (data.cloudinaryUrl !== undefined) updateData.cloudinaryUrl = data.cloudinaryUrl;
  if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
  if (data.thumbnailPublicId !== undefined) updateData.thumbnailPublicId = data.thumbnailPublicId;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.translation !== undefined) updateData.translation = data.translation;

  return prisma.book.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Soft delete a book: sets isActive to false and records deletedAt timestamp.
 * Does NOT delete data from the database or files from Cloudinary.
 */
export async function softDeleteBook(id: string) {
  const book = await prisma.book.findUnique({ where: { id } });
  if (!book) {
    throw new Error("Book not found");
  }

  return prisma.book.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

/**
 * Get a single book by ID
 */
export async function getBookById(id: string) {
  return prisma.book.findUnique({ where: { id } });
}

/**
 * Get all books, optionally filtering to only active (non-soft-deleted) books.
 * When activeOnly is true, returns books where isActive=true AND deletedAt is null.
 */
export async function getAllBooks(activeOnly = false) {
  return prisma.book.findMany({
    where: activeOnly ? { isActive: true, deletedAt: null } : undefined,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Toggle a book's active status (isActive flag)
 */
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
