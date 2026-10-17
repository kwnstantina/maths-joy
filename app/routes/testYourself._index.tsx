import { AcademicCapIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { data, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData, useOutletContext, useSearchParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import TrainingList from "components/training/trainingList";
import i18next from "~/i18next.server";
import type { SupportedLanguage } from "~/utils/i18n.server";
import { getTraingingExerciseByTitle } from "~/utils/training.prisma";
import type { TrainingOutletContext } from "./testYourself";

export const handle = { i18n: ["common"] };

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const searchableTitle = url.searchParams.get("searchableTitle");
  const locale = (await i18next.getLocale(request)) as SupportedLanguage;
  const exercises = searchableTitle
    ? await getTraingingExerciseByTitle(searchableTitle, locale)
    : [];
  return data(exercises);
};

const TestYourself = () => {
  const exercises = useLoaderData<
    { id: string; contentImage: string; solutionImage: string }[]
  >();
  const { items } = useOutletContext<TrainingOutletContext>();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const active = searchParams.get("searchableTitle");
  const index = items.findIndex((item) => item.searchableTitle === active);
  const current = index >= 0 ? items[index] : null;

  if (!current || exercises.length === 0) {
    const first = items[0];
    return (
      <div className="flex min-h-[24rem] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
          <AcademicCapIcon className="h-7 w-7 text-orange-600" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-bold text-gray-900">{t("trainingPage.emptyTitle")}</h1>
        <p className="mt-2 max-w-md text-sm text-gray-600">{t("trainingPage.emptyText")}</p>
        {first && (
          <Link
            to={first.href}
            className="mt-6 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          >
            {t("trainingPage.start")}
          </Link>
        )}
      </div>
    );
  }

  const prev = index > 0 ? items[index - 1] : null;
  const next = index < items.length - 1 ? items[index + 1] : null;

  return (
    <article>
      <header className="mb-6">
        <p className="text-sm font-medium text-orange-600">{current.topic}</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          {current.number && (
            <span className="text-gray-400">
              {t("trainingPage.exercise", { number: current.number })} ·{" "}
            </span>
          )}
          {current.name}
        </h1>
      </header>

      <div className="space-y-8">
        {exercises.map((exercise, i) => (
          <TrainingList
            key={exercise.id}
            id={exercise.id}
            contentImage={exercise.contentImage}
            solutionImage={exercise.solutionImage}
            label={exercises.length > 1 ? `${current.name} (${i + 1})` : current.name}
          />
        ))}
      </div>

      <nav className="mt-10 flex items-stretch justify-between gap-4 border-t border-gray-200 pt-6">
        {prev ? (
          <Link
            to={prev.href}
            className="group flex max-w-[48%] items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeftIcon className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-orange-500" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-xs text-gray-500">{t("trainingPage.previous")}</span>
              <span className="block truncate font-medium">{prev.name}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            to={next.href}
            className="group flex max-w-[48%] items-center gap-2 rounded-lg px-3 py-2 text-right text-sm text-gray-700 hover:bg-gray-50"
          >
            <span className="min-w-0">
              <span className="block text-xs text-gray-500">{t("trainingPage.next")}</span>
              <span className="block truncate font-medium">{next.name}</span>
            </span>
            <ChevronRightIcon className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-orange-500" aria-hidden="true" />
          </Link>
        )}
      </nav>
    </article>
  );
};

export default TestYourself;
