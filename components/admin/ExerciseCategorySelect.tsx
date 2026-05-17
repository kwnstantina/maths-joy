import { useTranslation } from "react-i18next";
import { Category, TAGS, Type } from "services/models/models";

/**
 * Exercise-specific category/level/type/tags-extras select.
 *
 * Renders FOUR fields on the admin exercise upload form:
 *   1. category — required dropdown (Category.byId)
 *   2. level    — optional dropdown (TAGS.byId)
 *   3. type     — optional dropdown (Type.byId)
 *   4. tags     — optional free-text input for extras (comma-separated)
 *
 * The generic CategorySelect is intentionally LEFT UNTOUCHED so the Video and
 * Training upload forms keep their existing UI. See Plan 06-02 for the design
 * choice (NEW component rather than an in-place refactor).
 *
 * Prop surface: only the `*Error` props are exposed. `default*` hydration
 * props were considered (for prefilling edit/retry forms) but neither the
 * single ExerciseUploadForm nor the BulkExerciseUploadForm end up passing
 * them — the retry path manages selection via local React state, and the
 * inline edit flow lives on ExerciseCard. Keeping the prop surface minimal
 * per the plan's Minor #10 guidance.
 */
interface ExerciseCategorySelectProps {
  categoryError?: string;
  levelError?: string;
  typeError?: string;
}

export default function ExerciseCategorySelect({
  categoryError,
  levelError,
  typeError,
}: ExerciseCategorySelectProps) {
  const { t } = useTranslation();
  const selectClass =
    "mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Category (required) */}
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
          defaultValue=""
          className={selectClass}
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
        {categoryError && (
          <p className="mt-1 text-sm text-red-600">{categoryError}</p>
        )}
      </div>

      {/* Level (optional) */}
      <div>
        <label
          htmlFor="level"
          className="block text-sm font-medium text-gray-700"
        >
          {t("admin.common.level")}
        </label>
        <select
          id="level"
          name="level"
          defaultValue=""
          className={selectClass}
        >
          <option value="">{t("admin.common.selectLevel")}</option>
          {Object.values(TAGS.byId)
            .filter((lvl) => !lvl.unavailable)
            .map((lvl) => (
              <option key={lvl.id} value={lvl.name}>
                {lvl.name}
              </option>
            ))}
        </select>
        {levelError && (
          <p className="mt-1 text-sm text-red-600">{levelError}</p>
        )}
      </div>

      {/* Type (optional) */}
      <div>
        <label
          htmlFor="type"
          className="block text-sm font-medium text-gray-700"
        >
          {t("admin.common.type")}
        </label>
        <select
          id="type"
          name="type"
          defaultValue=""
          className={selectClass}
        >
          <option value="">{t("admin.common.selectType")}</option>
          {Object.values(Type.byId)
            .filter((typ) => !typ.unavailable)
            .map((typ) => (
              <option key={typ.id} value={typ.name}>
                {typ.name}
              </option>
            ))}
        </select>
        {typeError && (
          <p className="mt-1 text-sm text-red-600">{typeError}</p>
        )}
      </div>

      {/* Tags-extras (optional, free-form comma-separated) */}
      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-gray-700"
        >
          {t("admin.common.tagsExtra")}
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          placeholder={t("admin.common.tagsExtraPlaceholder")}
          className={selectClass}
        />
      </div>
    </div>
  );
}
