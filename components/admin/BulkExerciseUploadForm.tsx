import { useState } from "react";
import { Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import BilingualFields from "components/admin/BilingualFields";
import ExerciseCategorySelect from "components/admin/ExerciseCategorySelect";
import Alerts from "components/alerts/alerts";

/**
 * BulkExerciseUploadForm
 *
 * Admin-only multi-file exercise upload form:
 *   - Pick many PDFs in one go with a single file input (`name="pdfFiles"`, multiple).
 *   - Shared metadata panel (category, level, type, description_el/en, tags-extras)
 *     applies to every file in the batch.
 *   - Per-file row lets the admin optionally override title_el / title_en.
 *     If left blank, the server falls back to the filename (minus `.pdf`).
 *   - After submit, renders a per-file result table from `actionData.bulk.results`.
 *     Failures show an inline error; the "Retry failed" button shrinks the local
 *     file list to only those that failed (in-memory state, keeps shared metadata).
 *
 * Security:
 *   - `_csrf` is a hidden input; validated server-side after multipart parsing.
 *   - The upload bucket rate limit (5/hour) is applied server-side; the form
 *     surfaces a user-facing warning so the admin understands the budget.
 *
 * Multipart contract (parallel arrays):
 *   - `pdfFiles`: one file entry per selected PDF.
 *   - `title_el`: one string entry per selected PDF, in DOM order.
 *   - `title_en`: one string entry per selected PDF, in DOM order.
 * Remix's `formData.getAll(name)` returns values in DOM order, so the server
 * can zip by index.
 */
interface BulkActionResult {
  index: number;
  title: string;
  success: boolean;
  exerciseId?: string;
  error?: string;
}

interface BulkActionData {
  bulk?: {
    results: BulkActionResult[];
    totalSucceeded: number;
    totalFailed: number;
  };
  errors?: Record<string, string>;
  _action?: string;
}

interface BulkExerciseUploadFormProps {
  csrfToken: string;
  actionData: BulkActionData | null;
  isSubmitting: boolean;
}

export default function BulkExerciseUploadForm({
  csrfToken,
  actionData,
  isSubmitting,
}: BulkExerciseUploadFormProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [files, setFiles] = useState<File[]>([]);

  const isBulkAction = actionData?._action === "createExerciseBulk";
  const bulk = isBulkAction ? actionData?.bulk : undefined;
  const bulkErrors = isBulkAction ? actionData?.errors : undefined;

  const onFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles(selected);
  };

  const onRetryFailed = () => {
    if (!bulk) return;
    const failedIndexes = new Set(
      bulk.results.filter((r) => !r.success).map((r) => r.index)
    );
    const remaining = files.filter((_, idx) => failedIndexes.has(idx));
    setFiles(remaining);
  };

  const inputClass =
    "mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5";

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
        {t("admin.exercises.bulkUpload")}
      </button>

      {!isCollapsed && (
        <div className="bg-gray-100 rounded-lg p-6">
          {/* Rate-limit warning */}
          <div className="mb-4 flex items-start gap-2 p-3 text-sm text-amber-800 border border-amber-300 rounded-lg bg-amber-50">
            <svg
              className="flex-shrink-0 w-5 h-5 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{t("admin.exercises.bulkRateLimitWarning")}</span>
          </div>

          <Form method="post" encType="multipart/form-data">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="_action" value="createExerciseBulk" />

            {/* Shared description */}
            <div className="space-y-4 mb-6">
              <BilingualFields
                fieldName="description"
                labelKeyEl="admin.exercises.descriptionEl"
                labelKeyEn="admin.exercises.descriptionEn"
                textarea
              />
            </div>

            {/* Shared category + level + type + tags */}
            <div className="mb-6">
              <ExerciseCategorySelect
                categoryError={bulkErrors?.category}
                levelError={bulkErrors?.level}
                typeError={bulkErrors?.type}
              />
            </div>

            {/* File picker */}
            <div className="mb-6">
              <label
                htmlFor="pdfFiles"
                className="block text-sm font-medium text-gray-700"
              >
                {t("admin.exercises.bulkFilePickerLabel")} *
              </label>
              <input
                type="file"
                id="pdfFiles"
                name="pdfFiles"
                accept=".pdf"
                multiple
                required
                onChange={onFilesChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            </div>

            {/* Per-file title overrides */}
            {files.length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-600 uppercase">
                      <th className="pb-2 pr-3">#</th>
                      <th className="pb-2 pr-3">
                        {t("admin.exercises.bulkFilePickerLabel")}
                      </th>
                      <th className="pb-2 pr-3">
                        {t("admin.exercises.bulkTitlePerFileEl")}
                      </th>
                      <th className="pb-2">
                        {t("admin.exercises.bulkTitlePerFileEn")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file, idx) => (
                      <tr key={`${file.name}-${idx}`} className="border-t border-gray-200">
                        <td className="py-2 pr-3 text-gray-500">{idx + 1}</td>
                        <td className="py-2 pr-3 text-gray-700 truncate max-w-xs" title={file.name}>
                          {file.name}
                        </td>
                        <td className="py-2 pr-3">
                          <input
                            type="text"
                            name="title_el"
                            placeholder={file.name.replace(/\.pdf$/i, "")}
                            className={inputClass}
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="text"
                            name="title_en"
                            placeholder=""
                            className={inputClass}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || files.length === 0}
              className="w-full rounded bg-orange-500 py-2 px-4 text-white hover:bg-orange-600 focus:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? t("admin.exercises.bulkUploading", { count: files.length })
                : t("admin.exercises.bulkUploadButton")}
            </button>
          </Form>

          {/* General error (whole-batch validation failure) */}
          {bulkErrors?.general && (
            <Alerts.ErrorAlert error={bulkErrors.general} />
          )}

          {/* Per-file results */}
          {bulk && bulk.results.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("admin.exercises.bulkResultsSucceeded", { count: bulk.totalSucceeded })}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t("admin.exercises.bulkResultsFailed", { count: bulk.totalFailed })}
                </span>
                {bulk.totalFailed > 0 && (
                  <button
                    type="button"
                    onClick={onRetryFailed}
                    className="ml-auto rounded bg-orange-500 py-1.5 px-3 text-sm text-white hover:bg-orange-600"
                  >
                    {t("admin.exercises.bulkRetryFailed")}
                  </button>
                )}
              </div>

              <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
                {bulk.results.map((r) => (
                  <li
                    key={r.index}
                    className="flex items-start gap-3 px-4 py-2 text-sm"
                  >
                    {r.success ? (
                      <svg
                        className="flex-shrink-0 w-5 h-5 text-green-600 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="flex-shrink-0 w-5 h-5 text-red-600 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 truncate">
                        {r.title}
                      </div>
                      {!r.success && r.error && (
                        <div className="text-red-600 text-xs mt-0.5">
                          {r.error}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
