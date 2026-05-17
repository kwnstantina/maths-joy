import type { LoaderFunctionArgs } from "@remix-run/node";
import { data } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { prisma } from "~/utils/prisma.server";

export const handle = { i18n: ["common"] };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Prisma + MongoDB quirk: `deletedAt: null` only matches documents where the
  // field is explicitly null, not where it's missing. Existing books were
  // created without ever writing `deletedAt`, so we OR with `isSet: false`.
  const notSoftDeleted = {
    OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
  };

  const [exerciseCount, bookCount, trainingCount, videoCount, questionCount] =
    await Promise.all([
      prisma.exersice.count(),
      prisma.book.count({ where: notSoftDeleted }),
      prisma.training.count(),
      prisma.video.count(),
      prisma.question.count(),
    ]);

  return data({
    exerciseCount,
    bookCount,
    trainingCount,
    videoCount,
    questionCount,
  });
};

const statCards = [
  { key: "exercises", countKey: "exerciseCount", to: "/admin/exercises", icon: "document" },
  { key: "books", countKey: "bookCount", to: "/admin/books", icon: "book" },
  { key: "training", countKey: "trainingCount", to: "/admin/training", icon: "bulb" },
  { key: "videos", countKey: "videoCount", to: "/admin/videos", icon: "video" },
  { key: "qa", countKey: "questionCount", to: "/admin/qa", icon: "question" },
] as const;

function StatIcon({ icon }: { icon: string }) {
  const cls = "w-8 h-8 text-orange-500";
  switch (icon) {
    case "document":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case "book":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case "bulb":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case "video":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    case "question":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminDashboard() {
  const loaderData = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">
        {t("admin.dashboard.title")}
      </h1>
      <p className="text-gray-500 mb-8">{t("admin.dashboard.subtitle")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <Link
            key={card.key}
            to={card.to}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <StatIcon icon={card.icon} />
              <span className="text-3xl font-bold text-gray-800">
                {loaderData[card.countKey]}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">
              {t(`admin.dashboard.${card.key}`)}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
