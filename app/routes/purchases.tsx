import type { LoaderFunction } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { getUser } from "~/utils/auth.prisma";
import { getUserPurchases } from "~/utils/stripe.server";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";

interface Purchase {
  id: string;
  bookId: string;
  amount: number;
  currency: string;
  status: string;
  downloadToken: string | null;
  downloadCount: number;
  maxDownloads: number;
  createdAt: string;
  book?: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    cloudinaryUrl: string;
  };
}

interface LoaderData {
  purchases: Purchase[];
  locale: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);
  const locale = await i18next.getLocale(request);

  if (!user) {
    return redirect("/login?redirectTo=/purchases");
  }

  const purchases = await getUserPurchases(user.id);

  return data({
    purchases: purchases as unknown as Purchase[],
    locale,
  });
};

export default function Purchases() {
  const { purchases, locale } = useLoaderData<LoaderData>();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const showSuccess = searchParams.get("success") === "true";

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale === "el" ? "el-GR" : "en-US", {
      style: "currency",
      currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === "el" ? "el-GR" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-center mb-10">
        {t("purchases.title")}
      </h1>

      {showSuccess && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-green-700 font-medium">
              {t("purchases.successMessage")}
            </p>
          </div>
        </div>
      )}

      {purchases.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">{t("purchases.noPurchases")}</p>
          <a
            href="/books"
            className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            {t("purchases.browseBooks")}
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {/* Book Thumbnail */}
                <div className="md:w-48 flex-shrink-0">
                  {purchase.book?.thumbnailUrl ? (
                    <img
                      src={purchase.book.thumbnailUrl}
                      alt={purchase.book.title}
                      className="w-full h-48 md:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 md:h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">
                        {purchase.book?.title.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Purchase Details */}
                <div className="flex-grow p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {purchase.book?.title || t("purchases.unknownBook")}
                      </h2>
                      <p className="text-gray-500 text-sm mt-1">
                        {t("purchases.purchasedOn")} {formatDate(purchase.createdAt)}
                      </p>
                      <p className="text-gray-600 mt-2">
                        {formatPrice(purchase.amount, purchase.currency)}
                      </p>
                    </div>

                    <div className="mt-4 md:mt-0 md:text-right">
                      <span
                        className={`inline-block px-3 py-1 text-sm rounded-full ${
                          purchase.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : purchase.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {t(`purchases.status.${purchase.status}`)}
                      </span>

                      {purchase.status === "completed" && purchase.downloadToken && (
                        <div className="mt-4">
                          {purchase.downloadCount >= purchase.maxDownloads ? (
                            <p className="text-sm text-red-600 mt-2">
                              {t("purchases.downloadLimitReached")}
                            </p>
                          ) : (
                            <a
                              href={`/download/${purchase.downloadToken}`}
                              className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              {t("purchases.download")}
                            </a>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            {t("purchases.downloadsRemaining", {
                              remaining: Math.max(
                                0,
                                purchase.maxDownloads - purchase.downloadCount
                              ),
                              max: purchase.maxDownloads,
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
