import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon, ListBulletIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { LoaderFunction, data } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useSearchParams } from "@remix-run/react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";
import type { SupportedLanguage } from "~/utils/i18n.server";
import { getTrainingExercises } from "~/utils/training.prisma";

export const handle = { i18n: ["common"] };

export const loader: LoaderFunction = async ({ request }) => {
  const locale = (await i18next.getLocale(request)) as SupportedLanguage;
  const exercises = await getTrainingExercises(locale);
  return data(exercises);
};

export interface TrainingItem {
  id: string;
  searchableTitle: string;
  label: string;
  topic: string;
  number: string | null;
  name: string;
  href: string;
}

export interface TrainingOutletContext {
  items: TrainingItem[];
}

/** "Θέμα 9.12 · Κλίση εφαπτομένης" → { number: "9.12", name: "Κλίση εφαπτομένης" } */
function splitLabel(label: string) {
  const match = label.match(/^\D*?(\d+(?:\.\d+)?)\s*·\s*(.+)$/);
  return match ? { number: match[1], name: match[2] } : { number: null, name: label };
}

const TestYourself = () => {
  const { groupedExersices = {} } = useLoaderData<{
    groupedExersices: Record<string, { id: string; searchableTitle: string; label?: string }[]>;
  }>();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = searchParams.get("searchableTitle");

  const groups = useMemo(
    () =>
      Object.entries(groupedExersices).map(([topic, rows]) => ({
        topic,
        items: rows.map((row): TrainingItem => {
          const label = row.label ?? row.searchableTitle;
          return {
            id: row.id,
            searchableTitle: row.searchableTitle,
            label,
            topic,
            ...splitLabel(label),
            href: `?searchableTitle=${encodeURIComponent(row.searchableTitle)}`,
          };
        }),
      })),
    [groupedExersices]
  );

  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const q = query.trim().toLowerCase();
  const results = q
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.searchableTitle.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q)
      )
    : [];

  const renderItem = (item: TrainingItem) => {
    const isActive = item.searchableTitle === active;
    return (
      <li key={item.id}>
        <Link
          to={item.href}
          preventScrollReset
          onClick={() => setMobileOpen(false)}
          aria-current={isActive ? "page" : undefined}
          className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
            isActive
              ? "bg-orange-50 text-orange-800 font-semibold"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          {item.number && (
            <span
              className={`mt-0.5 inline-flex h-6 min-w-[2.5rem] shrink-0 items-center justify-center rounded-md px-1 text-xs font-semibold ${
                isActive ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {item.number}
            </span>
          )}
          <span className="leading-snug">{item.name}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 lg:px-8">
      <div className="lg:grid lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-8">
        <aside className="mb-6 lg:mb-0">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm lg:hidden"
          >
            <span className="flex items-center gap-2">
              <ListBulletIcon className="h-5 w-5 text-orange-500" aria-hidden="true" />
              {mobileOpen ? t("trainingPage.closeSidebar") : t("trainingPage.openSidebar")}
            </span>
            <ChevronDownIcon
              className={`h-5 w-5 text-gray-500 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          <nav
            aria-label={t("trainingPage.topics")}
            className={`${mobileOpen ? "block" : "hidden"} mt-3 rounded-2xl border border-gray-200 bg-white shadow-sm lg:sticky lg:top-6 lg:mt-0 lg:block lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto`}
          >
            <div className="sticky top-0 z-10 rounded-t-2xl border-b border-gray-100 bg-white p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-base font-bold text-gray-900">{t("trainingPage.topics")}</h2>
                <span className="text-xs text-gray-500">
                  {t("trainingPage.exerciseCount", { count: allItems.length })}
                </span>
              </div>
              <label className="relative block">
                <span className="sr-only">{t("search")}</span>
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search")}
                  className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </label>
            </div>

            <div className="p-2">
              {q ? (
                results.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-gray-500">
                    {t("trainingPage.noResults")}
                  </p>
                ) : (
                  <ul className="space-y-0.5">{results.map(renderItem)}</ul>
                )
              ) : (
                groups.map((group) => (
                  <Disclosure
                    key={group.topic}
                    as="div"
                    className="border-b border-gray-100 last:border-b-0"
                    defaultOpen={group.items.some((item) => item.searchableTitle === active)}
                  >
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-3 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
                          <span>{group.topic}</span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                              {group.items.length}
                            </span>
                            <ChevronDownIcon
                              className={`h-4 w-4 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          </span>
                        </Disclosure.Button>
                        <Disclosure.Panel as="ul" className="space-y-0.5 pb-2">
                          {group.items.map(renderItem)}
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                ))
              )}
            </div>
          </nav>
        </aside>

        <main id="content" className="min-w-0">
          <Outlet context={{ items: allItems } satisfies TrainingOutletContext} />
        </main>
      </div>
    </div>
  );
};

export default TestYourself;
