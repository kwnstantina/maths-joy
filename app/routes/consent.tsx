import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";
import { requireUserId } from "~/utils/auth.prisma";
import {
  CONSENT_SELECT,
  consentStatusOf,
  recordConsent,
  sendParentConsent,
} from "~/utils/consent.server";
import { getCSRFToken, validateCSRFToken } from "~/utils/csrf.server";
import { prisma } from "~/utils/prisma.server";
import { applyRateLimit } from "~/utils/ratelimit.server";
import { validateEmail, validateRedirectUrl } from "~/utils/validators.server";

export const handle = { i18n: ["common"] };

export const meta: MetaFunction = () => [{ title: "Συγκατάθεση | GregKyrMaths" }];

interface ActionData {
  error?: string;
  sent?: boolean;
}

function safeRedirect(url: URL): string {
  const to = validateRedirectUrl(url.searchParams.get("redirectTo"));
  return to.startsWith("/consent") ? "/" : to;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...CONSENT_SELECT, parentEmail: true },
  });
  if (!user) throw redirect("/login");

  const status = consentStatusOf(user);
  if (status === "ok" && !url.searchParams.has("edit")) {
    throw redirect(safeRedirect(url));
  }

  const { token, headers } = await getCSRFToken(request);
  return data(
    { csrfToken: token, status, isUnder15: user.isUnder15, parentEmail: user.parentEmail },
    { headers }
  );
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const limited = applyRateLimit(request, "auth");
  if (limited) return limited;

  const userId = await requireUserId(request);
  const form = await request.formData();
  if (!(await validateCSRFToken(request, form.get("_csrf") as string | null))) {
    return data<ActionData>({ error: "consent.errors.invalidForm" }, { status: 400 });
  }

  const url = new URL(request.url);
  const locale = await i18next.getLocale(request);
  const intent = form.get("intent");

  if (intent === "resend") {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { parentEmail: true } });
    if (!user?.parentEmail) return data<ActionData>({ error: "consent.errors.invalidForm" }, { status: 400 });
    const ok = await sendParentConsent({ userId, parentEmail: user.parentEmail, origin: url.origin, locale });
    return data<ActionData>(ok ? { sent: true } : { error: "consent.errors.emailFailed" });
  }

  const age = form.get("age");
  const accepted = form.get("accept") === "on";
  const parentEmail = String(form.get("parentEmail") ?? "").trim().toLowerCase();

  if (age !== "15plus" && age !== "under15") {
    return data<ActionData>({ error: "consent.errors.ageRequired" }, { status: 400 });
  }
  if (!accepted) {
    return data<ActionData>({ error: "consent.errors.acceptRequired" }, { status: 400 });
  }
  const isUnder15 = age === "under15";
  if (isUnder15) {
    const self = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (validateEmail(parentEmail)) {
      return data<ActionData>({ error: "consent.errors.parentEmail" }, { status: 400 });
    }
    if (self?.email.toLowerCase() === parentEmail) {
      return data<ActionData>({ error: "consent.errors.parentEmailSame" }, { status: 400 });
    }
  }

  const ok = await recordConsent({ userId, isUnder15, parentEmail, origin: url.origin, locale });
  if (!ok) return data<ActionData>({ error: "consent.errors.emailFailed" });
  if (isUnder15) return data<ActionData>({ sent: true });
  return redirect(safeRedirect(url));
};

export default function Consent() {
  const { csrfToken, status, isUnder15, parentEmail } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(status !== "awaiting_parent");
  const [age, setAge] = useState<string>(isUnder15 ? "under15" : isUnder15 === false ? "15plus" : "");
  const busy = navigation.state === "submitting";
  const showWaiting = status === "awaiting_parent" && !editing && !actionData?.error;

  return (
    <section className="bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("consent.title")}</h1>

        {showWaiting || (actionData?.sent && age === "under15") ? (
          <div className="mt-4 space-y-4 text-gray-700">
            <p>{t("consent.waiting", { email: parentEmail ?? "" })}</p>
            <p className="text-sm text-gray-500">{t("consent.waitingNote")}</p>
            <Form method="post" className="flex flex-wrap gap-3">
              <input type="hidden" name="_csrf" value={csrfToken} />
              <button
                name="intent"
                value="resend"
                disabled={busy}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {t("consent.resend")}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {t("consent.change")}
              </button>
            </Form>
            {actionData?.sent && <p className="text-sm text-green-700">{t("consent.sent")}</p>}
            <Link to="/" className="inline-block text-sm text-orange-600 hover:underline">
              {t("consent.continue")}
            </Link>
          </div>
        ) : (
          <Form method="post" className="mt-4 space-y-5">
            <input type="hidden" name="_csrf" value={csrfToken} />
            <input type="hidden" name="intent" value="accept" />
            <p className="text-sm text-gray-600">
              {status === "needs_terms" && isUnder15 != null ? t("consent.updated") : t("consent.intro")}
            </p>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-gray-800">{t("consent.ageQuestion")}</legend>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="age"
                  value="15plus"
                  checked={age === "15plus"}
                  onChange={() => setAge("15plus")}
                  required
                />
                {t("consent.age15plus")}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="age"
                  value="under15"
                  checked={age === "under15"}
                  onChange={() => setAge("under15")}
                />
                {t("consent.ageUnder15")}
              </label>
            </fieldset>

            {age === "under15" && (
              <div>
                <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-800">
                  {t("consent.parentEmail")}
                </label>
                <input
                  id="parentEmail"
                  name="parentEmail"
                  type="email"
                  required
                  defaultValue={parentEmail ?? ""}
                  className="mt-1 w-full rounded border border-gray-400 px-2 py-1"
                />
                <p className="mt-1 text-xs text-gray-500">{t("consent.parentEmailHelp")}</p>
              </div>
            )}

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" name="accept" required className="mt-1" />
              <span>
                {t("consent.acceptPrefix")}{" "}
                <Link to="/useOfTerms" target="_blank" className="text-orange-600 underline">
                  {t("consent.terms")}
                </Link>{" "}
                {t("consent.and")}{" "}
                <Link to="/privacyPolicy" target="_blank" className="text-orange-600 underline">
                  {t("consent.privacy")}
                </Link>
                {t("consent.acceptSuffix")}
              </span>
            </label>

            {actionData?.error && <p className="text-sm text-red-700">{t(actionData.error)}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {t("consent.submit")}
            </button>
          </Form>
        )}
      </div>
    </section>
  );
}
