import { useEffect, useState } from "react";
import { useFetcher } from "@remix-run/react";
import { Category, TAGS } from "services/models/models";
import { useTranslation } from "react-i18next";

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    description: string;
    url: string;
    creatorName: string;
    category: string;
    tags: string[];
    translation?: unknown;
    createdAt: string;
  };
  csrfToken: string;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/
  );
  return match ? match[1] : null;
}

export default function VideoCard({ video, csrfToken }: VideoCardProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const deleteFetcher = useFetcher();
  const editFetcher = useFetcher();

  const translation = video.translation as {
    el?: { title?: string; description?: string };
    en?: { title?: string; description?: string };
  } | null;

  const videoId = extractYouTubeId(video.url);

  // Exit edit mode on successful save
  useEffect(() => {
    if (
      editFetcher.data &&
      typeof editFetcher.data === "object" &&
      "success" in editFetcher.data &&
      editFetcher.data.success
    ) {
      setIsEditing(false);
    }
  }, [editFetcher.data]);

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <editFetcher.Form method="post">
          <input type="hidden" name="_csrf" value={csrfToken} />
          <input type="hidden" name="_action" value="updateVideo" />
          <input type="hidden" name="videoId" value={video.id} />

          <div className="p-4 space-y-3">
            {/* Title Greek */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.videos.titleEl")}
              </label>
              <input
                type="text"
                name="title_el"
                defaultValue={translation?.el?.title || video.title}
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
              />
            </div>

            {/* Title English */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.videos.titleEn")}
              </label>
              <input
                type="text"
                name="title_en"
                defaultValue={translation?.en?.title || ""}
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
              />
            </div>

            {/* Description Greek */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.videos.descriptionEl")}
              </label>
              <textarea
                name="description_el"
                defaultValue={
                  translation?.el?.description || video.description
                }
                rows={2}
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
              />
            </div>

            {/* Description English */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.videos.descriptionEn")}
              </label>
              <textarea
                name="description_en"
                defaultValue={translation?.en?.description || ""}
                rows={2}
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
              />
            </div>

            {/* URL */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.videos.url")}
              </label>
              <input
                type="text"
                name="url"
                defaultValue={video.url}
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
              />
            </div>

            {/* Creator Name */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.videos.creatorName")}
              </label>
              <input
                type="text"
                name="creatorName"
                defaultValue={video.creatorName}
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
              />
            </div>

            {/* Category + Tags */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  {t("admin.common.category")}
                </label>
                <select
                  name="category"
                  defaultValue={video.category || ""}
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
                >
                  {Object.values(Category.byId)
                    .filter((c) => !c.unavailable)
                    .map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  {t("admin.common.tags")}
                </label>
                <select
                  name="tags"
                  defaultValue={video.tags[0] || ""}
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
                >
                  {Object.values(TAGS.byId)
                    .filter((tag) => !tag.unavailable)
                    .map((tag) => (
                      <option key={tag.id} value={tag.name}>
                        {tag.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={editFetcher.state === "submitting"}
                className="flex-1 rounded bg-orange-500 py-1.5 px-3 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {editFetcher.state === "submitting"
                  ? t("admin.videos.saving")
                  : t("admin.videos.save")}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded bg-gray-200 py-1.5 px-3 text-sm text-gray-700 hover:bg-gray-300"
              >
                {t("admin.videos.cancel")}
              </button>
            </div>
          </div>
        </editFetcher.Form>
      </div>
    );
  }

  // Display mode
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* YouTube Thumbnail */}
      {videoId ? (
        <img
          src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          alt={video.title}
          loading="lazy"
          className="w-full h-48 object-cover"
        />
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

      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-gray-800 truncate" title={video.title}>
          {video.title}
        </h3>

        {/* Creator Name */}
        <p className="text-sm text-gray-500 mt-1">{video.creatorName}</p>

        {/* Category badge */}
        {video.category && (
          <div className="mt-2">
            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
              {video.category}
            </span>
          </div>
        )}

        {/* URL link */}
        <div className="mt-2">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-orange-600 hover:text-orange-700 truncate block"
            title={video.url}
          >
            {video.url.length > 40
              ? video.url.substring(0, 40) + "..."
              : video.url}
          </a>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          {/* Edit button */}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex-1 rounded bg-orange-500 py-1.5 px-3 text-sm text-white hover:bg-orange-600"
          >
            {t("admin.videos.edit")}
          </button>

          {/* Delete button */}
          <deleteFetcher.Form method="post">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="_action" value="deleteVideo" />
            <input type="hidden" name="videoId" value={video.id} />
            <button
              type="submit"
              disabled={deleteFetcher.state === "submitting"}
              className="rounded bg-red-100 py-1.5 px-3 text-sm text-red-700 hover:bg-red-200 disabled:opacity-50"
              title={t("admin.videos.delete")}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </deleteFetcher.Form>
        </div>
      </div>
    </div>
  );
}
