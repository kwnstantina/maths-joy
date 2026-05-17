import type { LoaderFunction } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { Link, useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { prisma } from "~/utils/prisma.server";
import {
  getCheckoutSessionDetails,
  reconcilePendingPurchase,
} from "~/utils/stripe.server";

export const handle = { i18n: ["common"] };

// After this many seconds of pending state, the loader actively reconciles
// against Stripe rather than waiting for the webhook to land.
const RECONCILE_AFTER_SECONDS = 30;

interface LoaderData {
  book: { title: string; thumbnailUrl: string | null };
  isCompleted: boolean;
  isFailed: boolean;
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
  let purchase = await prisma.purchase.findFirst({
    where: { stripeSessionId: sessionId },
  });

  if (!purchase) {
    throw new Response("Purchase not found", { status: 404 });
  }

  // Reconciliation fallback: if the webhook hasn't fired but the purchase is
  // older than RECONCILE_AFTER_SECONDS, query Stripe directly. This guarantees
  // we never strand a paying customer on an infinite-spinner page when the
  // webhook is delayed or lost.
  const ageSeconds = (Date.now() - purchase.createdAt.getTime()) / 1000;
  if (purchase.status === "pending" && ageSeconds >= RECONCILE_AFTER_SECONDS) {
    await reconcilePendingPurchase(sessionId);
    purchase = await prisma.purchase.findFirst({
      where: { stripeSessionId: sessionId },
    });
    if (!purchase) {
      throw new Response("Purchase not found", { status: 404 });
    }
  }

  const isCompleted = purchase.status === "completed";
  const isFailed =
    purchase.status === "failed" || purchase.status === "refunded";

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
    isFailed,
    downloadUrl,
    cardInfo,
    downloadsRemaining,
    maxDownloads: purchase.maxDownloads,
  });
};

// Cap client-side polling so we don't spin forever if reconciliation also fails.
// At ~60s the loader has already attempted Stripe reconciliation; further
// waiting won't help and the user should be told to contact support.
const MAX_POLL_ATTEMPTS = 30; // 30 × 2s = 60s

export default function CheckoutSuccess() {
  const {
    book,
    isCompleted,
    isFailed,
    downloadUrl,
    cardInfo,
    downloadsRemaining,
    maxDownloads,
  } = useLoaderData<LoaderData>();
  const { t } = useTranslation();
  const revalidator = useRevalidator();
  const [pollAttempts, setPollAttempts] = useState(0);
  const giveUp = pollAttempts >= MAX_POLL_ATTEMPTS;

  // Poll every 2s if payment is not yet confirmed (webhook may be delayed).
  // Stops once we hit a terminal state (completed/failed/refunded) or the cap.
  useEffect(() => {
    if (isCompleted || isFailed || giveUp) return;
    const interval = setInterval(() => {
      setPollAttempts((n) => n + 1);
      revalidator.revalidate();
    }, 2000);
    return () => clearInterval(interval);
  }, [isCompleted, isFailed, giveUp, revalidator]);

  // Failed / refunded -- terminal error state
  if (isFailed) {
    return (
      <div className="container mx-auto px-6 py-10 text-center max-w-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {t("checkout.failed")}
        </h1>
        <p className="text-gray-600 mb-6">{t("checkout.failedDescription")}</p>
        <Link
          to="/books"
          className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          {t("checkout.continueBrowsing")}
        </Link>
      </div>
    );
  }

  // Polling cap hit -- webhook never landed and reconciliation didn't help
  if (giveUp && !isCompleted) {
    return (
      <div className="container mx-auto px-6 py-10 text-center max-w-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {t("checkout.stillProcessing")}
        </h1>
        <p className="text-gray-600 mb-6">
          {t("checkout.contactSupport")}
        </p>
        <Link
          to="/purchases"
          className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          {t("checkout.viewPurchases")}
        </Link>
      </div>
    );
  }

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
