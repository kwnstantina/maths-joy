import { useState } from "react";
import { Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import BilingualFields from "components/admin/BilingualFields";
import CategorySelect from "components/admin/CategorySelect";
import Alerts from "components/alerts/alerts";

interface VideoUploadFormProps {
  csrfToken: string;
  actionData: {
    errors?: Record<string, string>;
    success?: boolean;
    _action?: string;
  } | null;
  isSubmitting: boolean;
}

export default function VideoUploadForm({
  csrfToken,
  actionData,
  isSubmitting,
}: VideoUploadFormProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Only show errors/success for the createVideo action
  const isCreateAction =
    !actionData?._action || actionData._action === "createVideo";
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
        {t("admin.videos.upload")}
      </button>

      {!isCollapsed && (
        <div className="bg-gray-100 rounded-lg p-6">
          <Form method="post">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="_action" value="createVideo" />

            {/* Bilingual title */}
            <div className="space-y-4 mb-6">
              <BilingualFields
                fieldName="title"
                labelKeyEl="admin.videos.titleEl"
                labelKeyEn="admin.videos.titleEn"
                required
                errors={showErrors ? actionData.errors : undefined}
              />
            </div>

            {/* Bilingual description */}
            <div className="space-y-4 mb-6">
              <BilingualFields
                fieldName="description"
                labelKeyEl="admin.videos.descriptionEl"
                labelKeyEn="admin.videos.descriptionEn"
                textarea
              />
            </div>

            {/* URL */}
            <div className="mb-6">
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700"
              >
                {t("admin.videos.url")} *
              </label>
              <input
                type="text"
                id="url"
                name="url"
                required
                placeholder={t("admin.videos.urlPlaceholder")}
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
              />
              {showErrors && actionData.errors?.url && (
                <p className="mt-1 text-sm text-red-600">
                  {actionData.errors.url}
                </p>
              )}
            </div>

            {/* Creator Name */}
            <div className="mb-6">
              <label
                htmlFor="creatorName"
                className="block text-sm font-medium text-gray-700"
              >
                {t("admin.videos.creatorName")} *
              </label>
              <input
                type="text"
                id="creatorName"
                name="creatorName"
                required
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
              />
              {showErrors && actionData.errors?.creatorName && (
                <p className="mt-1 text-sm text-red-600">
                  {actionData.errors.creatorName}
                </p>
              )}
            </div>

            {/* Category + Tags */}
            <div className="mb-6">
              <CategorySelect
                categoryError={
                  showErrors ? actionData.errors?.category : undefined
                }
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-orange-500 py-2 px-4 text-white hover:bg-orange-600 focus:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? t("admin.videos.creating")
                : t("admin.videos.createButton")}
            </button>
          </Form>

          {showErrors && actionData.errors?.general && (
            <Alerts.ErrorAlert error={actionData.errors.general} />
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
              <div>{t("admin.videos.success")}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
