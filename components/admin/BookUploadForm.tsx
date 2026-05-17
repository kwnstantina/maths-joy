import { Form } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Alerts from "components/alerts/alerts";
import { Category, TAGS } from "services/models/models";

interface BookUploadFormProps {
  csrfToken: string;
  actionData: {
    errors?: Record<string, string>;
    success?: boolean;
    _action?: string;
  } | null;
  isSubmitting: boolean;
}

export default function BookUploadForm({
  csrfToken,
  actionData,
  isSubmitting,
}: BookUploadFormProps) {
  const { t } = useTranslation();
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(
    null
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    };
  }, [pdfPreviewUrl, thumbnailPreviewUrl]);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    if (file) {
      setPdfPreviewUrl(URL.createObjectURL(file));
    } else {
      setPdfPreviewUrl(null);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    if (file) {
      setThumbnailPreviewUrl(URL.createObjectURL(file));
    } else {
      setThumbnailPreviewUrl(null);
    }
  };

  // Only show errors/success for the createBook action
  const isCreateAction = !actionData?._action || actionData._action === "createBook";
  const showErrors = actionData?.errors && isCreateAction;
  const showSuccess = actionData?.success && isCreateAction;

  return (
    <div className="mb-8">
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-4"
      >
        <svg
          className={`w-5 h-5 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        {t("admin.books.upload")}
      </button>

      {!isCollapsed && (
        <div className="bg-gray-100 rounded-lg p-6">
          <Form method="post" encType="multipart/form-data">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="_action" value="createBook" />

            {/* Basic Info - Greek */}
            <div className="space-y-4 mb-6">
              <h3 className="text-md font-medium text-gray-600 border-b pb-2">
                {t("admin.books.titleEl")} / {t("admin.books.descriptionEl")}
              </h3>
              <div>
                <label
                  htmlFor="title_el"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("admin.books.titleEl")} *
                </label>
                <input
                  type="text"
                  id="title_el"
                  name="title_el"
                  required
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                />
                {showErrors && actionData.errors?.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.title}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="description_el"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("admin.books.descriptionEl")} *
                </label>
                <textarea
                  id="description_el"
                  name="description_el"
                  required
                  rows={3}
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                />
                {showErrors && actionData.errors?.description && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.description}
                  </p>
                )}
              </div>
            </div>

            {/* Basic Info - English */}
            <div className="space-y-4 mb-6">
              <h3 className="text-md font-medium text-gray-600 border-b pb-2">
                {t("admin.books.titleEn")} / {t("admin.books.descriptionEn")}
              </h3>
              <div>
                <label
                  htmlFor="title_en"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("admin.books.titleEn")}
                </label>
                <input
                  type="text"
                  id="title_en"
                  name="title_en"
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                />
              </div>
              <div>
                <label
                  htmlFor="description_en"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("admin.books.descriptionEn")}
                </label>
                <textarea
                  id="description_en"
                  name="description_en"
                  rows={3}
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("admin.books.price")} *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  required
                  step="0.01"
                  min="0"
                  placeholder="9.99"
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                />
                {showErrors && actionData.errors?.price && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.price}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="discountPrice"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("admin.books.discountPrice")}
                </label>
                <input
                  type="number"
                  id="discountPrice"
                  name="discountPrice"
                  step="0.01"
                  min="0"
                  placeholder="7.99"
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                />
              </div>
            </div>

            {/* Metadata - 2x2 grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label
                  htmlFor="authorName"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("admin.books.authorName")}
                </label>
                <input
                  type="text"
                  id="authorName"
                  name="authorName"
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                />
              </div>
              <div>
                <label
                  htmlFor="pageCount"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("admin.books.pageCount")}
                </label>
                <input
                  type="number"
                  id="pageCount"
                  name="pageCount"
                  min="1"
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                />
              </div>
              <div>
                <label
                  htmlFor="isbn"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("admin.books.isbn")}
                </label>
                <input
                  type="text"
                  id="isbn"
                  name="isbn"
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                />
              </div>
              <div>
                <label
                  htmlFor="edition"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("admin.books.edition")}
                </label>
                <input
                  type="text"
                  id="edition"
                  name="edition"
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                />
              </div>
            </div>

            {/* Classification */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("admin.common.category")} *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                >
                  <option value="">{t("admin.common.selectCategory")}</option>
                  {Object.values(Category.byId)
                    .filter((c) => !c.unavailable)
                    .map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                </select>
                {showErrors && actionData.errors?.category && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.category}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="tags"
                  className="block text-sm font-medium text-gray-700"
                >
                  {t("admin.common.tags")} *
                </label>
                <select
                  id="tags"
                  name="tags"
                  required
                  className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
                >
                  <option value="">{t("admin.common.selectTags")}</option>
                  {Object.values(TAGS.byId)
                    .filter((t) => !t.unavailable)
                    .map((tag) => (
                      <option key={tag.id} value={tag.name}>
                        {tag.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Files */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("admin.books.pdfFile")} *
                </label>
                <input
                  type="file"
                  name="pdfFile"
                  accept=".pdf"
                  onChange={handlePdfChange}
                  required
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {showErrors && actionData.errors?.pdfFile && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.pdfFile}
                  </p>
                )}
                {pdfPreviewUrl && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-1">
                      {t("admin.books.pdfPreview")}
                    </p>
                    <object
                      data={pdfPreviewUrl}
                      type="application/pdf"
                      width="100%"
                      height="300px"
                      className="border rounded"
                    >
                      <p className="text-sm text-gray-400 p-4">
                        PDF preview not supported in this browser.
                      </p>
                    </object>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("admin.books.thumbnail")} *
                </label>
                <input
                  type="file"
                  name="thumbnailFile"
                  accept="image/jpeg,image/png"
                  onChange={handleThumbnailChange}
                  required
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                {showErrors && actionData.errors?.thumbnailFile && (
                  <p className="mt-1 text-sm text-red-600">
                    {actionData.errors.thumbnailFile}
                  </p>
                )}
                {thumbnailPreviewUrl && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-1">
                      {t("admin.books.thumbnailPreview")}
                    </p>
                    <img
                      src={thumbnailPreviewUrl}
                      alt="Thumbnail preview"
                      className="max-h-48 object-contain rounded border"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                value="true"
                className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label
                htmlFor="isActive"
                className="ml-2 block text-sm text-gray-700"
              >
                {t("admin.books.isActive")}
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-orange-500 py-2 px-4 text-white hover:bg-orange-600 focus:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? t("admin.books.uploading")
                : t("admin.books.uploadButton")}
            </button>
          </Form>

          {showErrors && actionData.errors?.general && (
            <Alerts.ErrorAlert
              error={actionData.errors.general}
            />
          )}
          {showSuccess && (
            <div className="mt-3 flex p-4 mb-4 text-sm text-green-700 border border-green-300 rounded-lg bg-green-50">
              <svg
                className="flex-shrink-0 inline w-5 h-5 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>{t("admin.books.success")}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
