import { useEffect, useState } from "react";
import { useFetcher } from "@remix-run/react";
import { Category, TAGS } from "services/models/models";
import { useTranslation } from "react-i18next";

interface TrainingCardProps {
  training: {
    id: string;
    title: string;
    category: string;
    tags: string;
    searchableTitle: string;
    contentImage: string;
    solutionImage: string;
    translation?: unknown;
    createdAt: string;
  };
  csrfToken: string;
}

export default function TrainingCard({
  training,
  csrfToken,
}: TrainingCardProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const deleteFetcher = useFetcher();
  const editFetcher = useFetcher();

  // Parse translation to get el/en fields for editing
  const translation = training.translation as {
    el?: { title?: string };
    en?: { title?: string };
  } | null;

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
        <editFetcher.Form method="post" encType="multipart/form-data">
          <input type="hidden" name="_csrf" value={csrfToken} />
          <input type="hidden" name="_action" value="updateTraining" />
          <input type="hidden" name="trainingId" value={training.id} />

          <div className="p-4 space-y-3">
            {/* Title Greek */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.training.titleEl")}
              </label>
              <input
                type="text"
                name="title_el"
                defaultValue={translation?.el?.title || training.title}
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
              />
            </div>

            {/* Title English */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.training.titleEn")}
              </label>
              <input
                type="text"
                name="title_en"
                defaultValue={translation?.en?.title || ""}
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
              />
            </div>

            {/* Searchable Title */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.training.searchableTitle")}
              </label>
              <input
                type="text"
                name="searchableTitle"
                defaultValue={training.searchableTitle}
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
                  defaultValue={training.category}
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
                  defaultValue={training.tags || ""}
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
                >
                  <option value="">{t("admin.common.selectTags")}</option>
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

            {/* Replace content image */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.training.replaceContentImage")}
              </label>
              <input
                type="file"
                name="contentImage"
                accept="image/jpeg,image/png"
                className="mt-1 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t("admin.training.keepCurrentFile")}
              </p>
            </div>

            {/* Replace solution image */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.training.replaceSolutionImage")}
              </label>
              <input
                type="file"
                name="solutionImage"
                accept="image/jpeg,image/png"
                className="mt-1 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t("admin.training.keepCurrentFile")}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={editFetcher.state === "submitting"}
                className="flex-1 rounded bg-orange-500 py-1.5 px-3 text-sm text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {editFetcher.state === "submitting"
                  ? t("admin.training.saving")
                  : t("admin.training.save")}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded bg-gray-200 py-1.5 px-3 text-sm text-gray-700 hover:bg-gray-300"
              >
                {t("admin.training.cancel")}
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
      {/* Content image */}
      {training.contentImage ? (
        <img
          src={training.contentImage}
          alt={training.title}
          className="w-full h-48 object-cover"
          loading="lazy"
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-gray-800 truncate" title={training.title}>
          {training.title}
        </h3>

        {/* Searchable title */}
        <p className="text-sm text-gray-500 mt-1">{training.searchableTitle}</p>

        {/* Category badge */}
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            {training.category}
          </span>
        </div>

        {/* Date */}
        <p className="text-xs text-gray-400 mt-2">
          {new Date(training.createdAt).toLocaleDateString()}
        </p>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          {/* Edit button */}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex-1 rounded bg-orange-500 py-1.5 px-3 text-sm text-white hover:bg-orange-600"
          >
            {t("admin.training.edit")}
          </button>

          {/* Delete button */}
          <deleteFetcher.Form method="post">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="_action" value="deleteTraining" />
            <input type="hidden" name="trainingId" value={training.id} />
            <button
              type="submit"
              disabled={deleteFetcher.state === "submitting"}
              className="rounded bg-red-100 py-1.5 px-3 text-sm text-red-700 hover:bg-red-200 disabled:opacity-50"
              title={t("admin.training.delete")}
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
