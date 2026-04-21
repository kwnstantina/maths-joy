import type { JsonValue } from "@prisma/client/runtime/library";
import type { LoaderFunction } from "@remix-run/node";
import { data } from "@remix-run/node";
import { useLoaderData, useNavigation, useSearchParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import Card from "components/card/card";
import SearchInput from "components/search/searchInput";
import Pagination from "components/shared/Pagination";
import i18next from "~/i18next.server";
import { getPaginatedExercises } from "~/utils/exersices.prisma";
import { getLocalizedList, type SupportedLanguage } from "~/utils/i18n.server";

export const handle = { i18n: ["common"] };

// Shape returned to the page (loader-localized) — keeps `tags` as string[] so
// the Card prop pipeline can decide how to render it.
interface Exercise {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  level?: string | null;
  type?: string | null;
  tags: string[];
  exerciseImgUrl?: string | null;
  cloudinaryPublicId?: string | null;
  cloudinaryUrl?: string | null;
  translation?: JsonValue;
  createdAt: string | Date;
}

interface LoaderData {
  exercises: Exercise[];
  page: number;
  totalPages: number;
  total: number;
  locale: SupportedLanguage;
}

/**
 * KEY_MAP: legacy `title` field from List callback → new URL parameter name.
 *
 * The `title` keys ("title", "tags", "category", "input") correspond to the
 * legacy `title` string prop on each model entry in
 * `services/models/models.ts`. Despite the misleading name, that prop is
 * actually the FIELD TYPE, not a human title.
 *
 * - "title" (legacy field-type for level) → URL param "level"
 * - "tags"  (legacy field-type for type)  → URL param "type"
 * - "category" → "category" (unchanged)
 * - "input"    → "input"    (unchanged)
 * - "level", "type" → themselves (future-proof passthrough)
 */
const KEY_MAP: Record<string, string> = {
  category: "category",
  title: "level",
  level: "level",
  tags: "type",
  type: "type",
  input: "input",
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const locale = (await i18next.getLocale(request)) as SupportedLanguage;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));

  // Greek-canonical URL contract (see CONTEXT.md + 06-03 must_haves):
  // values in the URL are ALREADY Greek — no EN→EL mapping needed in the
  // loader. Backward-compat: the old SearchInput used ?title for level and
  // ?tags for type, so we fall back to those keys when the new names are
  // missing. Placeholder "0" values from the legacy selects are treated as
  // unset.
  const readParam = (primary: string, fallback?: string) => {
    const raw =
      url.searchParams.get(primary) ||
      (fallback ? url.searchParams.get(fallback) || "" : "");
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "0") return "";
    return trimmed;
  };

  const rawCategory = readParam("category");
  const rawLevel = readParam("level", "title");
  const rawType = readParam("type", "tags");
  const rawText = readParam("input");

  const filters = {
    category: rawCategory || undefined,
    level: rawLevel || undefined,
    type: rawType || undefined,
    text: rawText || undefined,
    lang: locale,
  };

  const { exercises, total, totalPages } = await getPaginatedExercises(
    page,
    12,
    filters,
  );

  const localized = getLocalizedList(
    exercises as unknown as Parameters<typeof getLocalizedList>[0],
    locale,
  ) as unknown as Exercise[];

  return data({
    exercises: localized,
    page,
    totalPages,
    total,
    locale,
  });
};

const Exersices = () => {
  const { exercises, page, totalPages, total } = useLoaderData<LoaderData>();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Only treat as "revalidating" when a GET navigation is in flight targeting
  // the /exercises page itself (i.e., filter/pagination change). Keep the
  // current results visible with a subtle dim while the new page loads —
  // replacing the whole page with a spinner on every keystroke is bad UX.
  const isRevalidating =
    navigation.state === "loading" &&
    navigation.location?.pathname === "/exercises";

  // Filters are derived from URL searchParams every render (URL is the single
  // source of truth). Backward-compat: accept legacy ?title / ?tags keys as
  // fallbacks for ?level / ?type so old bookmarks keep resolving.
  const filters = {
    category: searchParams.get("category") || "",
    level: searchParams.get("level") || searchParams.get("title") || "",
    type: searchParams.get("type") || searchParams.get("tags") || "",
    input: searchParams.get("input") || "",
    // SearchInput reads this as `filters.title` / `filters.tags` for
    // back-compat with its existing prop shape. The values map to the URL
    // level / type params.
    title: searchParams.get("level") || searchParams.get("title") || "",
    tags: searchParams.get("type") || searchParams.get("tags") || "",
  };

  const setFiltersHandler = (evt: { title: string; name: string }) => {
    const urlKey = KEY_MAP[evt.title] ?? evt.title;
    const next = new URLSearchParams(searchParams);
    const value = (evt.name ?? "").toString();
    if (value && value.trim() && value !== "0") {
      next.set(urlKey, value);
    } else {
      next.delete(urlKey);
    }
    // Any filter change resets pagination to page 1.
    next.delete("page");
    setSearchParams(next);
  };

  // SearchInput's explicit search button is redundant now (every keystroke
  // already syncs to URL). Keep the prop as a no-op for UI compatibility.
  const handleCategorySearch = () => {};

  const clearFilters = () => setSearchParams({});

  const hasResults = exercises.length > 0;

  return (
    <div
      className={`container px-6 text-center pb-52 my-20 transition-opacity duration-150 ${
        isRevalidating ? "opacity-60" : "opacity-100"
      }`}
      aria-busy={isRevalidating}
    >
      <SearchInput
        handleCategorySearch={handleCategorySearch}
        setFiltersHandler={setFiltersHandler}
        clearFilters={clearFilters}
        filters={filters}
      />

      {/* Result count */}
      {hasResults && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">
          {t("exercises.resultCount", { count: total })}
        </p>
      )}

      {/* Empty state */}
      {!hasResults && (
        <div className="flex flex-col items-center justify-center py-16">
          <svg
            className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {t("exercises.noResults")}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t("exercises.noResultsDescription")}
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t("exercises.clearFilters")}
          </button>
        </div>
      )}

      {/* Exercise cards */}
      {hasResults && (
        <div className="container flex flex-wrap gap-3 mb-5 mt-10">
          {exercises.map((item) => {
            // Card currently renders `item.tags` as a single string badge. The
            // loader now returns tags: string[]; join them at the call site so
            // Card itself stays untouched (Plan 06-03 scope).
            const cardItem = {
              ...item,
              tags: Array.isArray(item.tags)
                ? item.tags.join(", ")
                : item.tags ?? "",
              // Surface the dedicated level column (if present) in the second
              // badge slot where the old UI showed `item.title`.
              title: item.level ?? item.title,
            };
            return <Card key={item.id} item={cardItem} />;
          })}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
};

export default Exersices;
