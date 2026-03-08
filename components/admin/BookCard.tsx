import { useEffect, useState } from "react";
import { useFetcher } from "@remix-run/react";
import { Category, TAGS } from "services/models/models";
import { useTranslation } from "react-i18next";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    description: string;
    price: number;
    discountPrice?: number | null;
    currency: string;
    category: string;
    tags: string[];
    authorName?: string | null;
    pageCount?: number | null;
    isbn?: string | null;
    edition?: string | null;
    thumbnailUrl?: string | null;
    isActive: boolean;
    cloudinaryUrl: string;
    translation?: unknown;
    createdAt: string;
  };
  csrfToken: string;
}

const priceFormatter = new Intl.NumberFormat("el-GR", {
  style: "currency",
  currency: "EUR",
});

export default function BookCard({ book, csrfToken }: BookCardProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const toggleFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const editFetcher = useFetcher();

  // Parse translation to get el/en fields for editing
  const translation = book.translation as {
    el?: { title?: string; description?: string };
    en?: { title?: string; description?: string };
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
          <input type="hidden" name="_action" value="updateBook" />
          <input type="hidden" name="bookId" value={book.id} />

          <div className="p-4 space-y-3">
            {/* Title Greek */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.books.titleEl")}
              </label>
              <input
                type="text"
                name="title_el"
                defaultValue={translation?.el?.title || book.title}
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
              />
            </div>

            {/* Title English */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.books.titleEn")}
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
                {t("admin.books.descriptionEl")}
              </label>
              <textarea
                name="description_el"
                defaultValue={
                  translation?.el?.description || book.description
                }
                rows={2}
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
              />
            </div>

            {/* Description English */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.books.descriptionEn")}
              </label>
              <textarea
                name="description_en"
                defaultValue={translation?.en?.description || ""}
                rows={2}
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
              />
            </div>

            {/* Price + Discount */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  {t("admin.books.price")}
                </label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  defaultValue={book.price}
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  {t("admin.books.discountPrice")}
                </label>
                <input
                  type="number"
                  name="discountPrice"
                  step="0.01"
                  min="0"
                  defaultValue={book.discountPrice ?? ""}
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
                />
              </div>
            </div>

            {/* Author + PageCount */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  {t("admin.books.authorName")}
                </label>
                <input
                  type="text"
                  name="authorName"
                  defaultValue={book.authorName ?? ""}
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  {t("admin.books.pageCount")}
                </label>
                <input
                  type="number"
                  name="pageCount"
                  min="1"
                  defaultValue={book.pageCount ?? ""}
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
                />
              </div>
            </div>

            {/* ISBN + Edition */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  {t("admin.books.isbn")}
                </label>
                <input
                  type="text"
                  name="isbn"
                  defaultValue={book.isbn ?? ""}
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  {t("admin.books.edition")}
                </label>
                <input
                  type="text"
                  name="edition"
                  defaultValue={book.edition ?? ""}
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-orange-500 focus:border-orange-500 block w-full p-1.5"
                />
              </div>
            </div>

            {/* Category + Tags */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-500">
                  {t("admin.common.category")}
                </label>
                <select
                  name="category"
                  defaultValue={book.category}
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
                  defaultValue={book.tags[0] || ""}
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

            {/* File replacement */}
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.books.replacePdf")}
              </label>
              <input
                type="file"
                name="pdfFile"
                accept=".pdf"
                className="mt-1 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t("admin.books.keepCurrentFile")}
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">
                {t("admin.books.replaceThumbnail")}
              </label>
              <input
                type="file"
                name="thumbnailFile"
                accept="image/jpeg,image/png"
                className="mt-1 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t("admin.books.keepCurrentFile")}
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
                  ? t("admin.books.saving")
                  : t("admin.books.save")}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 rounded bg-gray-200 py-1.5 px-3 text-sm text-gray-700 hover:bg-gray-300"
              >
                {t("admin.books.cancel")}
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
      {/* Thumbnail */}
      {book.thumbnailUrl ? (
        <img
          src={book.thumbnailUrl}
          alt={book.title}
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
      )}

      <div className="p-4">
        {/* Title */}
        <h3 className="font-bold text-gray-800 truncate" title={book.title}>
          {book.title}
        </h3>

        {/* Author */}
        {book.authorName && (
          <p className="text-sm text-gray-500 mt-1">{book.authorName}</p>
        )}

        {/* Price */}
        <div className="mt-2">
          {book.discountPrice ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 line-through">
                {priceFormatter.format(book.price)}
              </span>
              <span className="text-lg font-bold text-orange-600">
                {priceFormatter.format(book.discountPrice)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-800">
              {priceFormatter.format(book.price)}
            </span>
          )}
        </div>

        {/* Category badge */}
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
            {book.category}
          </span>
          {/* Active/Inactive badge */}
          <span
            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
              book.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {book.isActive
              ? t("admin.books.active")
              : t("admin.books.inactive")}
          </span>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          {/* Edit button */}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex-1 rounded bg-orange-500 py-1.5 px-3 text-sm text-white hover:bg-orange-600"
          >
            {t("admin.books.edit")}
          </button>

          {/* Toggle active */}
          <toggleFetcher.Form method="post">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="_action" value="toggleActive" />
            <input type="hidden" name="bookId" value={book.id} />
            <button
              type="submit"
              disabled={toggleFetcher.state === "submitting"}
              className="rounded bg-gray-200 py-1.5 px-3 text-sm text-gray-700 hover:bg-gray-300 disabled:opacity-50"
              title={t("admin.books.toggleActive")}
            >
              {book.isActive ? (
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
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                  />
                </svg>
              ) : (
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              )}
            </button>
          </toggleFetcher.Form>

          {/* Delete button */}
          <deleteFetcher.Form method="post">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="_action" value="softDelete" />
            <input type="hidden" name="bookId" value={book.id} />
            <button
              type="submit"
              disabled={deleteFetcher.state === "submitting"}
              className="rounded bg-red-100 py-1.5 px-3 text-sm text-red-700 hover:bg-red-200 disabled:opacity-50"
              title={t("admin.books.delete")}
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
