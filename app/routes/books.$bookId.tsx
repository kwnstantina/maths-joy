import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { useLoaderData, Form, useNavigation, Link } from "@remix-run/react";
import { prisma } from "~/utils/prisma.server";
import { getUser } from "~/utils/auth.prisma";
import { createCheckoutSession, isStripeConfigured } from "~/utils/stripe.server";
import { useTranslation } from "react-i18next";
import { getLocalizedContent, SupportedLanguage } from "~/utils/i18n.server";
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
  book: Book;
  isLoggedIn: boolean;
  stripeEnabled: boolean;
  locale: string;
  alreadyPurchased: boolean;
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const { bookId } = params;
  const locale = await i18next.getLocale(request);

  if (!bookId) {
    throw new Response("Book ID required", { status: 400 });
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
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
  });

  if (!book || !book) {
    throw new Response("Book not found", { status: 404 });
  }

  const user = await getUser(request);
  const isLoggedIn = !!user;

  // Check if user already purchased this book
  let alreadyPurchased = false;
  if (user) {
    const existingPurchase = await prisma.purchase.findFirst({
      where: {
        userId: user.id,
        bookId: bookId,
        status: "completed",
      },
    });
    alreadyPurchased = !!existingPurchase;
  }

  // Apply translations
  const localizedBook = getLocalizedContent(
    book as unknown as Parameters<typeof getLocalizedContent>[0],
    locale as SupportedLanguage
  );

  return data({
    book: localizedBook as unknown as Book,
    isLoggedIn,
    stripeEnabled: isStripeConfigured(),
    locale,
    alreadyPurchased,
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  const { bookId } = params;

  if (!bookId) {
    return data({ error: "Book ID required" }, { status: 400 });
  }

  const user = await getUser(request);
  if (!user) {
    return redirect(`/login?redirectTo=/books/${bookId}`);
  }

  if (!isStripeConfigured()) {
    return data({ error: "Payments are not configured" }, { status: 500 });
  }

  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const { url: checkoutUrl } = await createCheckoutSession({
      bookId,
      userId: user.id,
      successUrl: `${baseUrl}/purchases?success=true`,
      cancelUrl: `${baseUrl}/books/${bookId}?canceled=true`,
    });

    if (checkoutUrl) {
      return redirect(checkoutUrl);
    }

    return data({ error: "Failed to create checkout session" }, { status: 500 });
  } catch (error) {
    console.error("Checkout error:", error);
    return data(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
};

export default function BookDetail() {
  const { book, isLoggedIn, stripeEnabled, locale, alreadyPurchased } =
    useLoaderData<LoaderData>();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale === "el" ? "el-GR" : "en-US", {
      style: "currency",
      currency,
    }).format(price);
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <Link
        to="/books"
        className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t("books.backToBooks")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Book Image */}
        <div>
          {book.thumbnailUrl ? (
            <img
              src={book.thumbnailUrl}
              alt={book.title}
              className="w-full rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-full aspect-[3/4] bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-lg flex items-center justify-center">
              <span className="text-white text-8xl font-bold">
                {book.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Book Details */}
        <div>
          <span className="inline-block px-3 py-1 text-sm font-semibold text-orange-600 bg-orange-100 rounded-full mb-4">
            {book.category}
          </span>

          <h1 className="text-4xl font-bold text-gray-800 mb-4">{book.title}</h1>

          <p className="text-gray-600 text-lg mb-6 whitespace-pre-line">
            {book.description}
          </p>

          {book.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {book.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-3xl font-bold text-orange-600">
                {formatPrice(book.price, book.currency)}
              </span>
            </div>

            {alreadyPurchased ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-medium">
                    {t("books.alreadyPurchased")}
                  </p>
                </div>
                <Link
                  to="/purchases"
                  className="block w-full text-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  {t("books.goToDownloads")}
                </Link>
              </div>
            ) : stripeEnabled ? (
              <Form method="post">
                {!isLoggedIn && (
                  <p className="text-sm text-gray-500 mb-4">
                    {t("books.loginRequired")}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full px-6 py-3 text-white rounded-lg transition-colors ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {isSubmitting ? t("books.processing") : t("books.buy")}
                </button>
              </Form>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-700">{t("books.paymentsNotConfigured")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
