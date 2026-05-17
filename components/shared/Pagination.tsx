// Shared pagination component — used by both admin and public listing pages.
// Canonical implementation. `components/admin/Pagination.tsx` is a re-export
// shim pointing here so legacy admin imports keep resolving.
import { useSearchParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
}

export default function Pagination({ page, totalPages, total }: PaginationProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  if (totalPages <= 1) return null;

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(newPage));
    setSearchParams(params);
  };

  // Build page numbers to show (max 5 around current)
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between mt-8 border-t border-gray-200 pt-4">
      <p className="text-sm text-gray-500">
        {t("admin.pagination.showing", { page, totalPages, total })}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("admin.pagination.prev")}
        </button>

        {start > 1 && (
          <>
            <button
              type="button"
              onClick={() => goToPage(1)}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              1
            </button>
            {start > 2 && <span className="px-1 text-gray-400">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => goToPage(p)}
            className={`px-3 py-1.5 text-sm rounded border ${
              p === page
                ? "bg-orange-500 text-white border-orange-500"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-gray-400">...</span>}
            <button
              type="button"
              onClick={() => goToPage(totalPages)}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("admin.pagination.next")}
        </button>
      </div>
    </div>
  );
}
