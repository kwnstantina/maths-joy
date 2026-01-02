import SearchInput from "components/search/searchInput";
import Card from "components/card/card";
import { useLoaderData, useSearchParams, useNavigation } from "@remix-run/react";
import { LoaderFunction, data } from "@remix-run/node";
import { useState, useCallback } from "react";
import {
  getAllExcersices,
  getExersiceBySearch,
} from "~/utils/exersices.prisma";
import { TAGS, Category, Type } from "services/models/models";
import { useTranslation } from "react-i18next";
import LoadingPage from "components/loadingPage/loadingPage";

import type { JsonValue } from "@prisma/client/runtime/library";

// Type definitions
interface Exercise {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  tags?: string;
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

interface WhereClause {
  category?: string;
  title?: string;
  description?: { contains: string };
  tags?: { contains: string };
  translation?: { not: { equals: null } };
}

export const loader: LoaderFunction = async ({ request }) => {
  let exersisesAll: Exercise[] = await getAllExcersices();
  const url = new URL(request.url);
  const filters = {
    category: url.searchParams.get("category"),
    tags: url.searchParams.get("tags"),
    input: url.searchParams.get("input"),
    title: url.searchParams.get("title"),
    lang: url.searchParams.get("lang"),
  };

  const whereClause: WhereClause = {};

  // Apply filters based on the 'filters' object.
  if (filters.lang === "el") {
    if (filters.category) {
      whereClause.category = filters.category;
    }
    if (filters.title) {
      whereClause.title = filters.title;
    }
    if (filters.input) {
      whereClause.description = {
        contains: filters.input,
      };
    }
    if (filters.tags) {
      whereClause.tags = {
        contains: filters.tags,
      };
    }
    exersisesAll = await getExersiceBySearch(whereClause);
  } else if (filters.lang === "en") {
    whereClause.translation = {
      not: {
        equals: null,
      },
    };

    // After the search we need to parse the translation and query the db again
    // to get the english translation
    exersisesAll = await getExersiceBySearch(whereClause);
    exersisesAll = exersisesAll.map((exercise: Exercise) => {
      if (exercise.translation) {
        try {
          // Handle both string and already-parsed JSON
          const translation = typeof exercise.translation === 'string'
            ? JSON.parse(exercise.translation)
            : exercise.translation;
          if (translation && typeof translation === 'object' && 'en' in translation) {
            const enTranslation = (translation as { en: { title?: string; description?: string; category?: string; tags?: string } }).en;
            return {
              ...exercise,
              title: enTranslation.title ?? exercise.title,
              description: enTranslation.description ?? exercise.description,
              category: enTranslation.category ?? exercise.category,
              tags: enTranslation.tags ?? exercise.tags,
            };
          }
        } catch (err) {
          console.error("Error parsing JSON:", err);
        }
      }
      return exercise; // If no English translation, return original
    });
  }

  return data(exersisesAll) ?? [];
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
