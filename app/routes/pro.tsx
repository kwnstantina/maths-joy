import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";
import { getUserId, requireUserId } from "~/utils/auth.prisma";
import { CONSENT_SELECT, consentStatusOf } from "~/utils/consent.server";
import { getCSRFToken, validateCSRFToken } from "~/utils/csrf.server";
import { isGregProEnabled } from "~/utils/featureFlags.server";
import {
  FREE_DAILY_MESSAGES,
  GREG_PRO_PRICES,
  PRO_DAILY_MESSAGES,
  WITHDRAWAL_DAYS,
  isBillingInterval,
  type BillingInterval,
} from "~/utils/plans";
import { prisma } from "~/utils/prisma.server";
import { applyRateLimit } from "~/utils/ratelimit.server";
import { createProCheckout, hasActivePro, managedPaymentsEnabled } from "~/utils/subscription.server";

export const handle = { i18n: ["common"] };

export const meta: MetaFunction = () => [{ title: "Greg AI Pro | GregKyrMaths" }];

interface ActionData {
  error?: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!isGregProEnabled()) throw new Response("Not found", { status: 404 });

  const userId = await getUserId(request);
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { ...CONSENT_SELECT, subscriptionStatus: true, subscriptionPeriodEnd: true },
      })
    : null;
  const { token, headers } = await getCSRFToken(request);
  return data(
    {
      csrfToken: token,
      loggedIn: Boolean(user),
      consentOk: user ? consentStatusOf(user) === "ok" : false,
      isPro: user ? hasActivePro(user) : false,
      soldThroughLink: managedPaymentsEnabled(),
    },
    { headers }
  );
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (!isGregProEnabled()) throw new Response("Not found", { status: 404 });
  const limited = applyRateLimit(request, "auth");
  if (limited) return limited;

  const userId = await requireUserId(request);
  const form = await request.formData();
  if (!(await validateCSRFToken(request, form.get("_csrf") as string | null))) {
    return data<ActionData>({ error: "pro.errors.invalidForm" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...CONSENT_SELECT, subscriptionStatus: true, subscriptionPeriodEnd: true },
  });
  if (!user) throw redirect("/login?redirectTo=/pro");
  if (consentStatusOf(user) !== "ok") throw redirect("/consent?redirectTo=/pro");
  if (hasActivePro(user)) throw redirect("/account");

  const interval = form.get("interval");
  if (!isBillingInterval(interval)) {
    return data<ActionData>({ error: "pro.errors.invalidForm" }, { status: 400 });
  }
  if (form.get("payer") !== "on") {
    return data<ActionData>({ error: "pro.errors.payerRequired" }, { status: 400 });
  }
  if (form.get("terms") !== "on") {
    return data<ActionData>({ error: "pro.errors.termsRequired" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { payerConfirmedAt: new Date() } });

  try {
    const locale = (await i18next.getLocale(request)) === "en" ? "en" : "el";
    const url = await createProCheckout({ userId, interval, origin: new URL(request.url).origin, locale });
    return redirect(url);
  } catch (err) {
    console.error("[pro] checkout failed", err);
    return data<ActionData>({ error: "pro.errors.checkoutFailed" }, { status: 502 });
  }
};

function euro(amount: number, lang: string): string {
  return new Intl.NumberFormat(lang.startsWith("el") ? "el-GR" : "en-IE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export default function Pro() {
  const { csrfToken, loggedIn, consentOk, isPro, soldThroughLink } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [interval, setBillingInterval] = useState<BillingInterval>("month");
  const busy = navigation.state !== "idle";
  const lang = i18n.language ?? "el";
  const yearlySaving = Math.round(
    (1 - GREG_PRO_PRICES.year.amount / (GREG_PRO_PRICES.month.amount * 12)) * 100
  );

  return (
    <section className="bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t("pro.title")}</h1>
          <p className="mt-2 text-gray-600">{t("pro.subtitle")}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">{t("pro.free.name")}</h2>
            <p className="mt-1 text-2xl font-bold text-gray-900">{euro(0, lang)}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>✓ {t("pro.free.messages", { count: FREE_DAILY_MESSAGES })}</li>
              <li>✓ {t("pro.allFeatures")}</li>
            </ul>
          </div>

          <div className="rounded-lg border-2 border-orange-500 bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">{t("pro.pro.name")}</h2>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {euro(GREG_PRO_PRICES[interval].amount, lang)}
              <span className="text-sm font-normal text-gray-500">
                {" "}
                / {t(interval === "month" ? "pro.perMonth" : "pro.perYear")}
              </span>
            </p>
            <p className="text-xs text-gray-500">{t("pro.vatIncluded")}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>✓ {t("pro.pro.messages", { count: PRO_DAILY_MESSAGES })}</li>
              <li>✓ {t("pro.allFeatures")}</li>
              <li>✓ {t("pro.pro.cancelAnytime")}</li>
            </ul>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          {isPro ? (
            <p className="text-gray-700">
              {t("pro.alreadyPro")}{" "}
              <Link to="/account" className="text-orange-600 hover:underline">
                {t("pro.manage")}
              </Link>
            </p>
          ) : !loggedIn ? (
            <Link
              to="/login?redirectTo=/pro"
              className="inline-block rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-700"
            >
              {t("pro.loginToSubscribe")}
            </Link>
          ) : !consentOk ? (
            <Link
              to="/consent?redirectTo=/pro"
              className="inline-block rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-700"
            >
              {t("pro.consentFirst")}
            </Link>
          ) : (
            <Form method="post" className="space-y-4">
              <input type="hidden" name="_csrf" value={csrfToken} />

              <fieldset className="flex flex-wrap gap-3">
                <legend className="sr-only">{t("pro.billing")}</legend>
                {(["month", "year"] as const).map((value) => (
                  <label
                    key={value}
                    className={`cursor-pointer rounded-lg border px-4 py-2 text-sm ${
                      interval === value ? "border-orange-500 bg-orange-50" : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="interval"
                      value={value}
                      checked={interval === value}
                      onChange={() => setBillingInterval(value)}
                      className="mr-2"
                    />
                    {value === "month"
                      ? t("pro.monthly", { price: euro(GREG_PRO_PRICES.month.amount, lang) })
                      : t("pro.yearly", { price: euro(GREG_PRO_PRICES.year.amount, lang), saving: yearlySaving })}
                  </label>
                ))}
              </fieldset>

              <label className="flex items-start gap-2 text-sm text-gray-800">
                <input type="checkbox" name="payer" required className="mt-1" />
                <span>{t("pro.payerConfirm")}</span>
              </label>
              <label className="flex items-start gap-2 text-sm text-gray-800">
                <input type="checkbox" name="terms" required className="mt-1" />
                <span>
                  {t("pro.termsConfirm", {
                    period: t(interval === "month" ? "pro.perMonth" : "pro.perYear"),
                    days: WITHDRAWAL_DAYS,
                  })}{" "}
                  <Link to="/useOfTerms" target="_blank" className="text-orange-600 underline">
                    {t("consent.terms")}
                  </Link>
                </span>
              </label>

              {actionData?.error && <p className="text-sm text-red-700">{t(actionData.error)}</p>}

              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-orange-600 px-5 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {busy ? t("pro.redirecting") : t("pro.subscribe")}
              </button>
              <p className="text-xs text-gray-500">
                {t(soldThroughLink ? "pro.paymentNoteLink" : "pro.paymentNote")}
              </p>
            </Form>
          )}
        </div>
      </div>
    </section>
  );
}
