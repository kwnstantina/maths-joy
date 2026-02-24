import { useEffect, useState } from "react";
import { useFetcher } from "@remix-run/react";
import { Category, TAGS } from "services/models/models";
import { useTranslation } from "react-i18next";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    description: string;
    price: number;
    discountPrice?: number | null;
    currency: string;
    category: string;
    tags: string[];
    authorName?: string | null;
    pageCount?: number | null;
    isbn?: string | null;
    edition?: string | null;
    thumbnailUrl?: string | null;
    isActive: boolean;
    cloudinaryUrl: string;
    translation?: unknown;
    createdAt: string;
  };
  csrfToken: string;
}

export default function BookCard({ book, csrfToken }: BookCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4">
        <h3 className="font-bold text-gray-800 truncate">{book.title}</h3>
        <p className="text-sm text-gray-500">{book.category}</p>
      </div>
    </div>
  );
}
