import type { LoaderFunction } from "@remix-run/node";
import { data } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Category, Category_En } from "services/models/models";
import i18next from "~/i18next.server";
import { getLocalizedList, SupportedLanguage } from "~/utils/i18n.server";
import { getAllVideos } from "~/utils/video.prisma";

export const handle = { i18n: ["common"] };

interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  creatorName: string;
  category: string | null;
  tags: string[];
  translation?: unknown;
}

interface LoaderData {
  videos: Video[];
  locale: SupportedLanguage;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

export const loader: LoaderFunction = async ({ request }) => {
  const locale = (await i18next.getLocale(request)) as SupportedLanguage;
  const videos = await getAllVideos();

  const localizedVideos = getLocalizedList(
    videos as unknown as Parameters<typeof getLocalizedList>[0],
    locale
  ) as unknown as Video[];

  return data({ videos: localizedVideos, locale });
};

export default function VideosIndex() {
  const { videos } = useLoaderData<LoaderData>();
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const isEnglish = i18n.language === "en";
  const selectedCategory = searchParams.get("category");

  const categoryOptions = useMemo(() => {
    const greek = Object.values(Category.byId).filter((c) => !c.unavailable);
    const english = Object.values(Category_En.byId).filter((c) => !c.unavailable);
    return greek.map((cat, i) => ({
      value: cat.name,
      label: isEnglish ? english[i]?.name ?? cat.name : cat.name,
    }));
  }, [isEnglish]);

  const filteredVideos = useMemo(() => {
    if (!selectedCategory) return videos;
    return videos.filter((v) => v.category === selectedCategory);
  }, [videos, selectedCategory]);

  const setCategory = (value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set("category", value);
    } else {
      next.delete("category");
    }
    setSearchParams(next);
  };

  const hasAnyVideos = videos.length > 0;
  const hasMatches = filteredVideos.length > 0;

  return (
    <div className="container mx-auto px-6 py-10 pb-52">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
        {t("videos.pageTitle", "Διδακτικά Βίντεο")}
      </h1>
      <p className="text-center text-gray-600 mb-8">
        {t(
          "videos.pageSubtitle",
          "Περιηγήσου στα διαθέσιμα βίντεο ανά κατηγορία."
        )}
      </p>

      {/* Category filter bar */}
      {hasAnyVideos && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("videos.allCategories", "Όλες")}
          </button>
          {categoryOptions.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Video grid */}
      {hasMatches && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const videoId = extractYouTubeId(video.url);
            return (
              <div
                key={video.id}
                className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
              >
                {videoId ? (
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                      alt={video.title}
                      loading="lazy"
                      className="w-full h-48 object-cover"
                    />
                  </a>
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h3
                    className="font-bold text-gray-800 truncate"
                    title={video.title}
                  >
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {video.creatorName}
                  </p>
                  {video.category && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
                        {video.category}
                      </span>
                    </div>
                  )}
                  {video.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
                  >
                    {t("videos.watchOnYouTube", "Παρακολούθηση στο YouTube")} →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty: no videos at all */}
      {!hasAnyVideos && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            className="w-24 h-24 text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">
            {t("videos.noVideosAtAll", "Δεν υπάρχουν ακόμα βίντεο.")}
          </h3>
        </div>
      )}

      {/* Empty: filter matched nothing */}
      {hasAnyVideos && !hasMatches && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t(
              "videos.noVideosInCategory",
              "Δεν βρέθηκαν βίντεο σε αυτή την κατηγορία."
            )}
          </h3>
          <button
            type="button"
            onClick={() => setCategory(null)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            {t("videos.showAll", "Προβολή όλων")}
          </button>
        </div>
      )}
    </div>
  );
}
