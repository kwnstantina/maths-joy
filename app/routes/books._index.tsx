import type { LoaderFunction } from "@remix-run/node";
import { data } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { prisma } from "~/utils/prisma.server";
import { useTranslation } from "react-i18next";
import { getLocalizedList, SupportedLanguage } from "~/utils/i18n.server";
import i18next from "~/i18next.server";

interface Book {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  thumbnailUrl: string | null;
  category: string;
  tags: string[];
  translation?: string | null;
}

interface LoaderData {
  books: Book[];
  locale: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  const locale = await i18next.getLocale(request);

  const books = await prisma.book.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      currency: true,
      thumbnailUrl: true,
      category: true,
      tags: true,
      translation: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Apply translations if needed
  const localizedBooks = getLocalizedList(
    books as unknown as Parameters<typeof getLocalizedList>[0],
    locale as SupportedLanguage
  );

  return data({ books: localizedBooks as unknown as Book[], locale });
};

export default function BooksIndex() {
  const { books, locale } = useLoaderData<LoaderData>();
  const { t } = useTranslation();

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale === "el" ? "el-GR" : "en-US", {
      style: "currency",
      currency,
    }).format(price);
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-center mb-10">{t("books.title")}</h1>

      {books.length === 0 ? (
        <div className="text-center text-gray-500 py-20">
          {t("books.noBooks")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {book.thumbnailUrl ? (
                <img
                  src={book.thumbnailUrl}
                  alt={book.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <span className="text-white text-4xl font-bold">
                    {book.title.charAt(0)}
                  </span>
                </div>
              )}

              <div className="p-6">
                <span className="inline-block px-2 py-1 text-xs font-semibold text-orange-600 bg-orange-100 rounded-full mb-2">
                  {book.category}
                </span>

                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {book.title}
                </h2>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {book.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-orange-600">
                    {formatPrice(book.price, book.currency)}
                  </span>

                  <Link
                    to={`/books/${book.id}`}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    {t("books.viewDetails")}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
