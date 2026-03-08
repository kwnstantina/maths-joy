import { useTranslation } from "react-i18next";

interface AdminPageHeaderProps {
  titleKey: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export default function AdminPageHeader({
  titleKey,
  count,
  actionLabel,
  onAction,
}: AdminPageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t(titleKey)}</h1>
        {count !== undefined && (
          <p className="text-sm text-gray-500 mt-1">
            {t("admin.common.totalItems", { count })}
          </p>
        )}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded bg-orange-500 py-2 px-4 text-sm text-white hover:bg-orange-600"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
