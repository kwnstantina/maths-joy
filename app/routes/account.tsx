import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { deleteAccount } from "~/utils/account.server";
import { getUserSession, requireUserId, storage } from "~/utils/auth.prisma";
import { CONSENT_SELECT, consentStatusOf } from "~/utils/consent.server";
import { getCSRFToken, validateCSRFToken } from "~/utils/csrf.server";
import { isGregProEnabled } from "~/utils/featureFlags.server";
import { prisma } from "~/utils/prisma.server";
import { applyRateLimit } from "~/utils/ratelimit.server";
import {
  SUBSCRIPTION_SELECT,
  createBillingPortalUrl,
  setCancelAtPeriodEnd,
  subscriptionViewOf,
} from "~/utils/subscription.server";

export const handle = { i18n: ["common"] };

export const meta: MetaFunction = () => [{ title: "Λογαριασμός | GregKyrMaths" }];

interface ActionData {
  error?: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { parentEmail: true, ...CONSENT_SELECT, ...SUBSCRIPTION_SELECT },
  });
  if (!user) throw redirect("/login");
  const url = new URL(request.url);
  const { token, headers } = await getCSRFToken(request);
  return data(
    {
      csrfToken: token,
      email: user.email,
      parentEmail: user.parentEmail,
      consent: consentStatusOf(user),
      termsAcceptedAt: user.termsAcceptedAt,
      proEnabled: isGregProEnabled(),
      subscription: subscriptionViewOf(user),
      withdrawn: url.searchParams.has("withdrawn"),
    },
    { headers }
  );
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const limited = applyRateLimit(request, "auth");
  if (limited) return limited;

  const userId = await requireUserId(request);
  const form = await request.formData();
  if (!(await validateCSRFToken(request, form.get("_csrf") as string | null))) {
    return data<ActionData>({ error: "account.errors.invalidForm" }, { status: 400 });
  }

  const intent = form.get("intent");
  if (intent === "cancel" || intent === "resume" || intent === "portal") {
    try {
      if (intent === "portal") {
        return redirect(await createBillingPortalUrl(userId, new URL(request.url).origin + "/account"));
      }
      await setCancelAtPeriodEnd(userId, intent === "cancel");
      return redirect("/account");
    } catch (err) {
      console.error("[account] billing action failed", intent, err);
      return data<ActionData>({ error: "account.errors.billingFailed" }, { status: 502 });
    }
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  const typed = String(form.get("confirmEmail") ?? "").trim().toLowerCase();
  if (!user || typed !== user.email.toLowerCase()) {
    return data<ActionData>({ error: "account.errors.confirmMismatch" }, { status: 400 });
  }

  try {
    await deleteAccount(userId, "user");
  } catch (err) {
    console.error("[account] delete failed", err);
    return data<ActionData>({ error: "account.errors.deleteFailed" }, { status: 502 });
  }
  const session = await getUserSession(request);
  return redirect("/?accountDeleted=1", {
    headers: { "Set-Cookie": await storage.destroySession(session) },
  });
};

export default function Account() {
  const { csrfToken, email, parentEmail, consent, termsAcceptedAt, proEnabled, subscription, withdrawn } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const busy = navigation.state === "submitting";
  const locale = i18n.language?.startsWith("el") ? "el-GR" : "en-GB";
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale) : "");

  return (
    <section className="bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("account.title")}</h1>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">{t("account.details")}</h2>
          <p className="mt-2 text-sm text-gray-700">{email}</p>
          <p className="mt-2 text-sm text-gray-700">
            {t(`account.consent.${consent}`, { email: parentEmail ?? "" })}
            {termsAcceptedAt && consent === "ok" && (
              <> ({new Date(termsAcceptedAt).toLocaleDateString(i18n.language?.startsWith("el") ? "el-GR" : "en-GB")})</>
            )}
          </p>
          <Link to="/consent?edit=1" className="mt-2 inline-block text-sm text-orange-600 hover:underline">
            {t("account.reviewConsent")}
          </Link>
        </div>

        {proEnabled && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">{t("account.billing.title")}</h2>
            {withdrawn && <p className="mt-2 text-sm text-green-700">{t("account.billing.withdrawn")}</p>}
            {actionData?.error === "account.errors.billingFailed" && (
              <p className="mt-2 text-sm text-red-700">{t(actionData.error)}</p>
            )}
            {subscription.pro ? (
              <div className="mt-2 space-y-3 text-sm text-gray-700">
                <p>
                  {t(subscription.interval === "year" ? "account.billing.proYearly" : "account.billing.proMonthly")}
                  {" — "}
                  {t(subscription.cancelAtPeriodEnd ? "account.billing.endsOn" : "account.billing.renewsOn", {
                    date: fmt(subscription.periodEnd),
                  })}
                </p>
                {subscription.status === "past_due" && (
                  <p className="text-red-700">{t("account.billing.pastDue")}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Form method="post">
                    <input type="hidden" name="_csrf" value={csrfToken} />
                    <input type="hidden" name="intent" value={subscription.cancelAtPeriodEnd ? "resume" : "cancel"} />
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {t(subscription.cancelAtPeriodEnd ? "account.billing.resume" : "account.billing.cancel")}
                    </button>
                  </Form>
                  <Form method="post">
                    <input type="hidden" name="_csrf" value={csrfToken} />
                    <input type="hidden" name="intent" value="portal" />
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {t("account.billing.portal")}
                    </button>
                  </Form>
                </div>
                {subscription.withdrawUntil && (
                  <p>
                    <Link to="/account/withdraw" className="font-semibold text-orange-700 underline">
                      {t("account.billing.withdrawButton")}
                    </Link>{" "}
                    <span className="text-gray-500">
                      {t("account.billing.withdrawUntil", { date: fmt(subscription.withdrawUntil) })}
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-700">
                {t("account.billing.free")}{" "}
                <Link to="/pro" className="text-orange-600 hover:underline">
                  {t("account.billing.upgrade")}
                </Link>
              </p>
            )}
          </div>
        )}

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">{t("account.export.title")}</h2>
          <p className="mt-2 text-sm text-gray-700">{t("account.export.body")}</p>
          <a
            href="/account/export"
            className="mt-3 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
          >
            {t("account.export.button")}
          </a>
        </div>

        <div className="rounded-lg border border-red-200 bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-red-700">{t("account.delete.title")}</h2>
          <p className="mt-2 text-sm text-gray-700">{t("account.delete.body")}</p>
          <Form method="post" className="mt-3 space-y-3">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="intent" value="delete" />
            <label htmlFor="confirmEmail" className="block text-sm text-gray-800">
              {t("account.delete.confirmLabel")}
            </label>
            <input
              id="confirmEmail"
              name="confirmEmail"
              type="email"
              autoComplete="off"
              required
              className="w-full rounded border border-gray-400 px-2 py-1"
            />
            {actionData?.error && actionData.error !== "account.errors.billingFailed" && (
              <p className="text-sm text-red-700">{t(actionData.error)}</p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {t("account.delete.button")}
            </button>
          </Form>
        </div>
      </div>
    </section>
  );
}
