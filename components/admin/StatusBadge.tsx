import { useTranslation } from "react-i18next";

interface StatusBadgeProps {
  isActive: boolean;
  isDeleted?: boolean;
}

export default function StatusBadge({ isActive, isDeleted }: StatusBadgeProps) {
  const { t } = useTranslation();

  if (isDeleted) {
    return (
      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
        {t("admin.common.deleted")}
      </span>
    );
  }

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
        isActive
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-500"
      }`}
    >
      {isActive ? t("admin.common.active") : t("admin.common.inactive")}
    </span>
  );
}
