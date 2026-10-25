import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { requireUserId } from "~/utils/auth.prisma";
import { getCSRFToken, validateCSRFToken } from "~/utils/csrf.server";
import { prisma } from "~/utils/prisma.server";
import { applyRateLimit } from "~/utils/ratelimit.server";
import { SUBSCRIPTION_SELECT, subscriptionViewOf, withdrawSubscription } from "~/utils/subscription.server";

/**
 * The withdrawal button's confirmation step (N. 5317/2026, art. 69 / Directive
 * 2023/2673): reachable from /account during the 14 days, no reason asked, and
 * a separate confirm click — the first click alone never withdraws.
 */

export const handle = { i18n: ["common"] };

export const meta: MetaFunction = () => [
  { title: "Υπαναχώρηση | GregKyrMaths" },
  { name: "robots", content: "noindex" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: SUBSCRIPTION_SELECT });
  if (!user) throw redirect("/login");
  const view = subscriptionViewOf(user);
  if (!view.withdrawUntil) throw redirect("/account");
  const { token, headers } = await getCSRFToken(request);
  return data({ csrfToken: token, email: user.email, interval: view.interval, withdrawUntil: view.withdrawUntil }, { headers });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const limited = applyRateLimit(request, "auth");
  if (limited) return limited;
  const userId = await requireUserId(request);
  const form = await request.formData();
  if (!(await validateCSRFToken(request, form.get("_csrf") as string | null))) {
    return data({ error: "account.errors.invalidForm" }, { status: 400 });
  }
  try {
    await withdrawSubscription(userId);
  } catch (err) {
    console.error("[account] withdrawal failed", err);
    return data({ error: "account.errors.billingFailed" }, { status: 502 });
  }
  return redirect("/account?withdrawn=1");
};

export default function Withdraw() {
  const { csrfToken, email, interval, withdrawUntil } = useLoaderData<typeof loader>();
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const busy = navigation.state === "submitting";
  const date = new Date(withdrawUntil).toLocaleDateString(i18n.language?.startsWith("el") ? "el-GR" : "en-GB");

  return (
    <section className="bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("withdraw.title")}</h1>
        <dl className="mt-4 space-y-1 text-sm text-gray-700">
          <div>
            <dt className="inline font-semibold">{t("withdraw.contract")}: </dt>
            <dd className="inline">
              {t(interval === "year" ? "account.billing.proYearly" : "account.billing.proMonthly")}
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold">{t("withdraw.account")}: </dt>
            <dd className="inline">{email}</dd>
          </div>
        </dl>
        <p className="mt-4 text-gray-700">{t("withdraw.body", { date })}</p>
        <Form method="post" className="mt-6 flex flex-wrap gap-3">
          <input type="hidden" name="_csrf" value={csrfToken} />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {t("withdraw.confirm")}
          </button>
          <Link to="/account" className="rounded-lg border border-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-50">
            {t("withdraw.back")}
          </Link>
        </Form>
        {actionData?.error && <p className="mt-3 text-sm text-red-700">{t(actionData.error)}</p>}
      </div>
    </section>
  );
}
