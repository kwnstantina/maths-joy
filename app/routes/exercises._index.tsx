import SearchInput from "components/search/searchInput";
import Card from "components/card/card";
import { useLoaderData, useSearchParams, useNavigation } from "@remix-run/react";
import { LoaderFunction, data } from "@remix-run/node";
import { useState, useCallback } from "react";
import { getAllExcersices } from "~/utils/exersices.prisma";
import { TAGS, Category, Type, TAGS_En, Category_En, Type_En } from "services/models/models";
import { useTranslation } from "react-i18next";
import LoadingPage from "components/loadingPage/loadingPage";

import type { JsonValue } from "@prisma/client/runtime/library";

// Type definitions
interface Exercise {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  tags: string;
  translation?: JsonValue;
}

interface ExerciseFilters {
  category: string;
  title: string;
  input: string;
  tags: string;
  lang: string;
}

interface FilterEvent {
  title: string;
  name: string;
}

// Build English→Greek lookup maps so English filter values can match Greek DB data
function buildEnToElMap(enModel: Record<string, { name: string }>, elModel: Record<string, { name: string }>): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of Object.keys(enModel)) {
    const enName = enModel[key].name;
    const elName = elModel[key]?.name;
    if (enName && elName) {
      map[enName] = elName;
    }
  }
  return map;
}

const categoryEnToEl = buildEnToElMap(Category_En.byId, Category.byId);
const levelEnToEl = buildEnToElMap(TAGS_En.byId, TAGS.byId);
const typeEnToEl = buildEnToElMap(Type_En.byId, Type.byId);

function mapToEnglish(exercise: Exercise): Exercise {
  if (!exercise.translation) return exercise;
  try {
    const translation =
      typeof exercise.translation === "string"
        ? JSON.parse(exercise.translation)
        : exercise.translation;
    const en = translation?.en;
    if (!en) return exercise;
    return {
      ...exercise,
      title: en.title ?? exercise.title,
      description: en.description ?? exercise.description,
      category: en.category ?? exercise.category,
      tags: Array.isArray(en.tags) ? en.tags.join(",") : (en.tags ?? exercise.tags),
    };
  } catch {
    return exercise;
  }
}

// Normalize for comparison: strip diacritics, handle Greek/Latin lookalikes, lowercase
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics (accents)
    .replace(/A/g, "Α")              // Latin A → Greek Α
    .replace(/B/g, "Β")              // Latin B → Greek Β
    .toLowerCase();
}

function matches(value: string | null | undefined, filter: string): boolean {
  if (!value) return false;
  return normalize(value) === normalize(filter);
}

function includes(value: string | null | undefined, filter: string): boolean {
  if (!value) return false;
  return normalize(value).includes(normalize(filter));
}

function applyFilters(
  exercises: Exercise[],
  filters: { category: string | null; title: string | null; input: string | null; tags: string | null },
  isEnglish: boolean
): Exercise[] {
  let result = exercises;

  if (filters.category) {
    const categoryEl = isEnglish ? categoryEnToEl[filters.category] : null;
    result = result.filter(
      (e) => matches(e.category, filters.category!) || (categoryEl && matches(e.category, categoryEl))
    );
  }
  // "title" filter = school level; check both title and tags fields
  // (old exercises store level in title, admin exercises store level in tags)
  if (filters.title) {
    const levelEl = isEnglish ? levelEnToEl[filters.title] : null;
    result = result.filter(
      (e) =>
        matches(e.title, filters.title!) ||
        matches(e.tags, filters.title!) ||
        (levelEl && (matches(e.title, levelEl) || matches(e.tags, levelEl)))
    );
  }
  if (filters.input) {
    const search = filters.input.toLowerCase();
    result = result.filter((e) =>
      e.description?.toLowerCase().includes(search)
    );
  }
  // "tags" filter = exercise type; check both tags and title fields
  if (filters.tags) {
    const typeEl = isEnglish ? typeEnToEl[filters.tags] : null;
    result = result.filter(
      (e) =>
        includes(e.tags, filters.tags!) ||
        includes(e.title, filters.tags!) ||
        (typeEl && (includes(e.tags, typeEl) || includes(e.title, typeEl)))
    );
  }

  return result;
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const filters = {
    category: url.searchParams.get("category"),
    tags: url.searchParams.get("tags"),
    input: url.searchParams.get("input"),
    title: url.searchParams.get("title"),
    lang: url.searchParams.get("lang"),
  };

  let exercises: Exercise[] = await getAllExcersices();

  // English: only show exercises with translations, mapped to English
  if (filters.lang === "en") {
    exercises = exercises
      .filter((e) => e.translation)
      .map(mapToEnglish);
  }

  // Apply filters in-memory (works for both languages)
  const hasFilters = filters.category || filters.title || filters.input || filters.tags;
  if (hasFilters) {
    exercises = applyFilters(exercises, filters, filters.lang === "en");
  }

  return data(exercises) ?? [];
};

const Exersices = () => {
  const data = useLoaderData<Exercise[]>();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [, setSearchParams] = useSearchParams();

  const isLoading = navigation.state === "loading";

  const [filters, setFilters] = useState<ExerciseFilters>({
    category: Object.values(Category.byId)[0].name,
    title: Object.values(Type.byId)[0].name,
    input: "",
    tags: Object.values(TAGS.byId)[0].name,
    lang: i18n.language,
  });

  const clearFilters = () => {
    setSearchParams({});
    setFilters({
      category: Object.values(Category.byId)[0].name,
      title: Object.values(Type.byId)[0].name,
      input: "",
      tags: Object.values(TAGS.byId)[0].name,
      lang: i18n.language,
    });
  };

  const handleCategorySearch = useCallback(() => {
    const entries = Object.entries(filters)
      .filter(([, value]) => value)
      .filter((item) => item !== undefined);
    const filteredSearchParams = Object.fromEntries(entries) as Record<string, string>;
    setSearchParams(filteredSearchParams);
  }, [filters, setSearchParams]);

  const setFiltersHandler = useCallback(
    (evt: FilterEvent) => {
      return setFilters((filter: ExerciseFilters) => ({
        ...filter,
        [evt.title]: evt.name,
        lang: i18n.language,
      }));
    },
    [i18n.language]
  );

  if (isLoading) return <LoadingPage />;

  return (
    <div className="container px-6 text-center pb-52 my-20">
      <SearchInput
        handleCategorySearch={handleCategorySearch}
        setFiltersHandler={setFiltersHandler}
        clearFilters={clearFilters}
        filters={filters}
      />

      {/* Result count */}
      {data && data.length > 0 && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">
          {t('exercises.resultCount', { count: data.length })}
        </p>
      )}

      {/* Empty state */}
      {(!data || data.length === 0) && (
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
            {t('exercises.noResults')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {t('exercises.noResultsDescription')}
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('exercises.clearFilters')}
          </button>
        </div>
      )}

      {/* Exercise cards */}
      {data && data.length > 0 && (
        <div className="container flex flex-wrap gap-3 mb-5 mt-10">
          {data.map((item: Exercise) => {
            return <Card key={item.id} item={item} />;
          })}
        </div>
      )}
    </div>
  );
};

export default Exersices;
