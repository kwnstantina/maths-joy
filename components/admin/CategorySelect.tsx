import { Category, TAGS } from "services/models/models";
import { useTranslation } from "react-i18next";

interface CategorySelectProps {
  defaultCategory?: string;
  defaultTag?: string;
  categoryError?: string;
}

export default function CategorySelect({
  defaultCategory,
  defaultTag,
  categoryError,
}: CategorySelectProps) {
  const { t } = useTranslation();
  const selectClass =
    "mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full p-2.5";

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          {t("admin.common.category")} *
        </label>
        <select
          id="category"
          name="category"
          required
          defaultValue={defaultCategory ?? ""}
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
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
          {t("admin.common.tags")}
        </label>
        <select
          id="tags"
          name="tags"
          defaultValue={defaultTag ?? ""}
          className={selectClass}
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
  );
}
