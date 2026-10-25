import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { data, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { deleteAccount } from "~/utils/account.server";
import { getUserSession, requireUserId, storage } from "~/utils/auth.prisma";
import { CONSENT_SELECT, consentStatusOf } from "~/utils/consent.server";
import { getCSRFToken, validateCSRFToken } from "~/utils/csrf.server";
import { prisma } from "~/utils/prisma.server";
import { applyRateLimit } from "~/utils/ratelimit.server";

export const handle = { i18n: ["common"] };

export const meta: MetaFunction = () => [{ title: "Λογαριασμός | GregKyrMaths" }];

interface ActionData {
  error?: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, parentEmail: true, ...CONSENT_SELECT },
  });
  if (!user) throw redirect("/login");
  const { token, headers } = await getCSRFToken(request);
  return data(
    {
      csrfToken: token,
      email: user.email,
      parentEmail: user.parentEmail,
      consent: consentStatusOf(user),
      termsAcceptedAt: user.termsAcceptedAt,
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

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  const typed = String(form.get("confirmEmail") ?? "").trim().toLowerCase();
  if (!user || typed !== user.email.toLowerCase()) {
    return data<ActionData>({ error: "account.errors.confirmMismatch" }, { status: 400 });
  }

  await deleteAccount(userId, "user");
  const session = await getUserSession(request);
  return redirect("/?accountDeleted=1", {
    headers: { "Set-Cookie": await storage.destroySession(session) },
  });
};

export default function Account() {
  const { csrfToken, email, parentEmail, consent, termsAcceptedAt } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const busy = navigation.state === "submitting";

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
            {actionData?.error && <p className="text-sm text-red-700">{t(actionData.error)}</p>}
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
