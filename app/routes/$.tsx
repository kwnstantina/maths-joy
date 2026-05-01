import { LoaderFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

export const handle = { i18n: ["common"] };

// Catch-all route for 404 pages
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);

  // Return empty response for browser/devtools requests
  if (url.pathname.startsWith("/.well-known") ||
      url.pathname.startsWith("/favicon") ||
      url.pathname.endsWith(".map")) {
    throw new Response(null, { status: 404 });
  }

  // For other routes, throw a proper 404
  throw new Response("Not Found", { status: 404 });
};

export default function CatchAll() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        {t('notFound.title')}
      </h2>
      <p className="text-gray-500 mb-8 text-center">
        {t('notFound.message')}
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        {t('notFound.goHome')}
      </Link>
    </div>
  );
}
