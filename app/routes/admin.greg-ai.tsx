import type { LoaderFunctionArgs } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { getUser } from "~/utils/auth.prisma";
import type { AnalyticsWindow } from "~/utils/gregAnalytics.server";
import { ANALYTICS_WINDOWS, getGregAnalytics } from "~/utils/gregAnalytics.server";
import { isAdmin } from "~/utils/roles";

export const handle = { i18n: ["common"] };

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getUser(request);
  if (!isAdmin(user)) throw redirect("/progress");

  const requested = Number(new URL(request.url).searchParams.get("days"));
  const days: AnalyticsWindow = (ANALYTICS_WINDOWS as readonly number[]).includes(requested)
    ? (requested as AnalyticsWindow)
    : 30;

  return data(await getGregAnalytics(days));
};

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-gray-800 tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

export default function AdminGregAi() {
  const stats = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation();
  const nf = new Intl.NumberFormat(i18n.language);
  const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—");
  const rated = stats.thumbsUp + stats.thumbsDown;

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{t("admin.gregAi.title")}</h1>
      <p className="text-gray-500 mb-6">{t("admin.gregAi.subtitle")}</p>

      <div className="mb-6 flex gap-2" role="group" aria-label={t("admin.gregAi.range")}>
        {ANALYTICS_WINDOWS.map((d) => (
          <Link
            key={d}
            to={`?days=${d}`}
            aria-current={stats.days === d ? "true" : undefined}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              stats.days === d ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t("admin.gregAi.lastDays", { count: d })}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label={t("admin.gregAi.students")} value={nf.format(stats.students)} />
        <StatTile label={t("admin.gregAi.messages")} value={nf.format(stats.messages)} />
        <StatTile
          label={t("admin.gregAi.cost")}
          value={`$${stats.costUsd.toFixed(2)}`}
          hint={stats.messages > 0 ? t("admin.gregAi.perMessage", { cost: `$${(stats.costUsd / stats.messages).toFixed(4)}` }) : undefined}
        />
        <StatTile
          label={t("admin.gregAi.helpful")}
          value={pct(stats.thumbsUp, rated)}
          hint={t("admin.gregAi.ratings", { up: stats.thumbsUp, down: stats.thumbsDown })}
        />
        <StatTile label={t("admin.gregAi.hint1")} value={nf.format(stats.hints.level1)} />
        <StatTile label={t("admin.gregAi.hint2")} value={nf.format(stats.hints.level2)} />
        <StatTile label={t("admin.gregAi.hint3")} value={nf.format(stats.hints.level3)} />
        <StatTile
          label={t("admin.gregAi.practice")}
          value={nf.format(stats.practiceChecks)}
          hint={
            stats.practiceAverage !== null
              ? t("admin.gregAi.practiceAverage", { score: Math.round(stats.practiceAverage) })
              : undefined
          }
        />
      </div>

      <h2 className="mt-10 mb-1 text-lg font-semibold text-gray-800">{t("admin.gregAi.topicsTitle")}</h2>
      <p className="mb-3 text-sm text-gray-500">{t("admin.gregAi.topicsHelp")}</p>
      {stats.topics.length === 0 ? (
        <p className="text-sm text-gray-500">{t("admin.gregAi.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">{t("admin.gregAi.colTopic")}</th>
                <th scope="col" className="px-4 py-2 font-medium text-right">{t("admin.gregAi.colQuestions")}</th>
                <th scope="col" className="px-4 py-2 font-medium text-right">{t("admin.gregAi.colBigHints")}</th>
                <th scope="col" className="px-4 py-2 font-medium text-right">{t("admin.gregAi.colSolutions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.topics.map((row) => (
                <tr key={`${row.page}|${row.title}`}>
                  <td className="px-4 py-2 text-gray-800">
                    {row.href ? (
                      <Link to={row.href} className="text-blue-600 hover:underline">
                        {row.title}
                      </Link>
                    ) : (
                      row.title
                    )}
                    <span className="ml-2 text-xs text-gray-500">
                      {t(row.page === "training" ? "admin.gregAi.training" : "admin.gregAi.exercise")}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-800">{nf.format(row.questions)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-800">{nf.format(row.bigHints)}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-gray-800">{nf.format(row.solutions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-10 mb-1 text-lg font-semibold text-gray-800">{t("admin.gregAi.thumbsDownTitle")}</h2>
      <p className="mb-3 text-sm text-gray-500">{t("admin.gregAi.thumbsDownHelp")}</p>
      {stats.recentThumbsDown.length === 0 ? (
        <p className="text-sm text-gray-500">{t("admin.gregAi.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {stats.recentThumbsDown.map((m) => (
            <li key={m.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
              <div className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString(i18n.language)}</div>
              <p className="mt-1 whitespace-pre-wrap text-gray-800">{m.excerpt}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
