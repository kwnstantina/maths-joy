import type { LoaderFunction } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { Link, useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { prisma } from "~/utils/prisma.server";
import { getCheckoutSessionDetails } from "~/utils/stripe.server";

export const handle = { i18n: ["common"] };

interface LoaderData {
  book: { title: string; thumbnailUrl: string | null };
  isCompleted: boolean;
  downloadUrl: string | null;
  cardInfo: { last4: string; brand: string } | null;
  downloadsRemaining: number;
  maxDownloads: number;
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return redirect("/books");
  }

  // Find purchase by stripeSessionId -- the key connecting the returning user to their payment
  const purchase = await prisma.purchase.findFirst({
    where: { stripeSessionId: sessionId },
  });

  if (!purchase) {
    throw new Response("Purchase not found", { status: 404 });
  }

  const isCompleted = purchase.status === "completed";

  // Only call Stripe API on initial load (when payment just completed) to get card info.
  // During polling (isCompleted=false), we only need the DB purchase status.
  let cardInfo: { last4: string; brand: string } | null = null;
  if (isCompleted) {
    try {
      const sessionDetails = await getCheckoutSessionDetails(sessionId);
      cardInfo = sessionDetails.cardInfo;
    } catch {
      // Card info is cosmetic — don't fail the page if Stripe is unreachable
    }
  }

  // Find the book associated with the purchase
  const book = await prisma.book.findUnique({
    where: { id: purchase.bookId },
    select: {
      title: true,
      thumbnailUrl: true,
    },
  });

  if (!book) {
    throw new Response("Book not found", { status: 404 });
  }

  const canDownload =
    isCompleted && purchase.downloadCount < purchase.maxDownloads;

  // Use the secure /download/:token route instead of exposing the raw Cloudinary URL.
  // This ensures downloads are gated by token verification, expiration, and rate limiting.
  const downloadUrl =
    canDownload && purchase.downloadToken
      ? `/download/${purchase.downloadToken}`
      : null;

  const downloadsRemaining = Math.max(
    0,
    purchase.maxDownloads - purchase.downloadCount
  );

  return data<LoaderData>({
    book: { title: book.title, thumbnailUrl: book.thumbnailUrl },
    isCompleted,
    downloadUrl,
    cardInfo,
    downloadsRemaining,
    maxDownloads: purchase.maxDownloads,
  });
};

export default function CheckoutSuccess() {
  const {
    book,
    isCompleted,
    downloadUrl,
    cardInfo,
    downloadsRemaining,
    maxDownloads,
  } = useLoaderData<LoaderData>();
  const { t } = useTranslation();
  const revalidator = useRevalidator();

  // Poll every 2s if payment is not yet confirmed (webhook may be delayed)
  useEffect(() => {
    if (!isCompleted) {
      const interval = setInterval(() => {
        revalidator.revalidate();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isCompleted, revalidator]);

  // Processing state -- webhook hasn't fired yet
  if (!isCompleted) {
    return (
      <div className="container mx-auto px-6 py-10 text-center">
        <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {t("checkout.verifying")}
        </h1>
        <p className="text-gray-600">{t("checkout.pleaseWait")}</p>
      </div>
    );
  }

  // Confirmed -- show book + download
  return (
    <div className="container mx-auto px-6 py-10 max-w-2xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {t("checkout.success")}
        </h1>
        {cardInfo && (
          <p className="text-gray-500 text-sm">
            {t("checkout.paidWith", {
              brand: cardInfo.brand,
              last4: cardInfo.last4,
            })}
          </p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          {book.thumbnailUrl ? (
            <img
              src={book.thumbnailUrl}
              alt={book.title}
              className="w-20 h-28 object-cover rounded-lg"
            />
          ) : (
            <div className="w-20 h-28 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-2xl font-bold">
                {book.title.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {book.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("checkout.downloadsRemaining", {
                remaining: downloadsRemaining,
                max: maxDownloads,
              })}
            </p>
          </div>
        </div>

        {downloadUrl ? (
          <a
            href={downloadUrl}
            className="block w-full text-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            download
          >
            {t("checkout.downloadBook")}
          </a>
        ) : (
          <p className="text-center text-red-600 text-sm">
            {t("checkout.downloadLimitReached")}
          </p>
        )}
      </div>

      <div className="text-center space-x-4">
        <Link
          to="/purchases"
          className="text-orange-600 hover:text-orange-700 text-sm"
        >
          {t("checkout.viewPurchases")}
        </Link>
        <Link
          to="/books"
          className="text-gray-500 hover:text-gray-600 text-sm"
        >
          {t("checkout.continueBrowsing")}
        </Link>
      </div>
    </div>
  );
}
