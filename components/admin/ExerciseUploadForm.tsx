import { useState } from "react";
import { Form } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import BilingualFields from "components/admin/BilingualFields";
import ExerciseCategorySelect from "components/admin/ExerciseCategorySelect";
import FileUploadField from "components/admin/FileUploadField";
import Alerts from "components/alerts/alerts";

interface ExerciseUploadFormProps {
  csrfToken: string;
  actionData: {
    errors?: Record<string, string>;
    success?: boolean;
    _action?: string;
  } | null;
  isSubmitting: boolean;
}

export default function ExerciseUploadForm({
  csrfToken,
  actionData,
  isSubmitting,
}: ExerciseUploadFormProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Only show errors/success for the createExercise action
  const isCreateAction =
    !actionData?._action || actionData._action === "createExercise";
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
        {t("admin.exercises.upload")}
      </button>

      {!isCollapsed && (
        <div className="bg-gray-100 rounded-lg p-6">
          <Form method="post" encType="multipart/form-data">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="_action" value="createExercise" />

            {/* Title - Bilingual */}
            <div className="space-y-4 mb-6">
              <BilingualFields
                fieldName="title"
                labelKeyEl={t("admin.exercises.titleEl")}
                labelKeyEn={t("admin.exercises.titleEn")}
                required
                errors={showErrors ? actionData.errors : undefined}
              />
            </div>

            {/* Description - Bilingual */}
            <div className="space-y-4 mb-6">
              <BilingualFields
                fieldName="description"
                labelKeyEl={t("admin.exercises.descriptionEl")}
                labelKeyEn={t("admin.exercises.descriptionEn")}
                textarea
              />
            </div>

            {/* Category + Level + Type + Tags (extras) */}
            <div className="mb-6">
              <ExerciseCategorySelect
                categoryError={
                  showErrors ? actionData.errors?.category : undefined
                }
                levelError={
                  showErrors ? actionData.errors?.level : undefined
                }
                typeError={
                  showErrors ? actionData.errors?.type : undefined
                }
              />
            </div>

            {/* Exercise Image URL */}
            <div className="mb-6">
              <label
                htmlFor="exerciseImgUrl"
                className="block text-sm font-medium text-gray-700"
              >
                {t("admin.exercises.exerciseImage")}
              </label>
              <input
                type="text"
                id="exerciseImgUrl"
                name="exerciseImgUrl"
                className="mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5"
              />
            </div>

            {/* PDF File */}
            <div className="space-y-4 mb-6">
              <FileUploadField
                name="pdfFile"
                label={t("admin.exercises.pdfFile")}
                accept=".pdf"
                required
                previewType="pdf"
                error={showErrors ? actionData.errors?.pdfFile : undefined}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded bg-orange-500 py-2 px-4 text-white hover:bg-orange-600 focus:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? t("admin.exercises.uploading")
                : t("admin.exercises.uploadButton")}
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
              <div>{t("admin.exercises.success")}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
