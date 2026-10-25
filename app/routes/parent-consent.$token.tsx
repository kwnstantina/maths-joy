import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { data } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { deleteAccount } from "~/utils/account.server";
import { approveParentConsent, findUserByParentToken } from "~/utils/consent.server";
import { getCSRFToken, validateCSRFToken } from "~/utils/csrf.server";
import { applyRateLimit } from "~/utils/ratelimit.server";

export const handle = { i18n: ["common"] };

export const meta: MetaFunction = () => [
  { title: "Συγκατάθεση γονέα | GregKyrMaths" },
  { name: "robots", content: "noindex" },
];

interface ActionData {
  done?: "approved" | "declined";
  error?: string;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const child = await findUserByParentToken(params.token ?? "");
  const { token, headers } = await getCSRFToken(request);
  return data(
    {
      csrfToken: token,
      child: child
        ? {
            name: [child.profile?.firstName, child.profile?.lastName].filter(Boolean).join(" "),
            email: child.email,
          }
        : null,
    },
    { headers }
  );
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const limited = applyRateLimit(request, "auth");
  if (limited) return limited;

  const form = await request.formData();
  if (!(await validateCSRFToken(request, form.get("_csrf") as string | null))) {
    return data<ActionData>({ error: "parentConsent.errors.invalidForm" }, { status: 400 });
  }
  const child = await findUserByParentToken(params.token ?? "");
  if (!child) return data<ActionData>({ error: "parentConsent.invalid" }, { status: 404 });

  if (form.get("intent") === "approve") {
    await approveParentConsent(child.id);
    return data<ActionData>({ done: "approved" });
  }
  if (form.get("intent") === "decline") {
    await deleteAccount(child.id, "parent_declined");
    return data<ActionData>({ done: "declined" });
  }
  return data<ActionData>({ error: "parentConsent.errors.invalidForm" }, { status: 400 });
};

export default function ParentConsent() {
  const { csrfToken, child } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [confirmDecline, setConfirmDecline] = useState(false);
  const busy = navigation.state === "submitting";

  let body: React.ReactNode;
  if (actionData?.done === "approved") {
    body = <p className="text-green-700">{t("parentConsent.approved")}</p>;
  } else if (actionData?.done === "declined") {
    body = <p className="text-gray-700">{t("parentConsent.declined")}</p>;
  } else if (!child) {
    body = <p className="text-gray-700">{t("parentConsent.invalid")}</p>;
  } else {
    body = (
      <div className="space-y-4 text-gray-700">
        <p>
          {t("parentConsent.intro", { child: child.name ? `${child.name} (${child.email})` : child.email })}
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>{t("parentConsent.point1")}</li>
          <li>{t("parentConsent.point2")}</li>
          <li>{t("parentConsent.point3")}</li>
          <li>{t("parentConsent.point4")}</li>
          <li>{t("parentConsent.point5")}</li>
        </ul>
        <p className="text-sm">
          {t("parentConsent.readMore")}{" "}
          <Link to="/privacyPolicy" target="_blank" className="text-orange-600 underline">
            {t("consent.privacy")}
          </Link>{" "}
          {t("consent.and")}{" "}
          <Link to="/useOfTerms" target="_blank" className="text-orange-600 underline">
            {t("consent.terms")}
          </Link>
          .
        </p>
        <p className="text-sm text-gray-500">{t("parentConsent.withdraw")}</p>
        <Form method="post" className="flex flex-wrap gap-3 pt-2">
          <input type="hidden" name="_csrf" value={csrfToken} />
          <button
            name="intent"
            value="approve"
            disabled={busy}
            className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {t("parentConsent.approve")}
          </button>
          {confirmDecline ? (
            <button
              name="intent"
              value="decline"
              disabled={busy}
              className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {t("parentConsent.declineConfirm")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDecline(true)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              {t("parentConsent.decline")}
            </button>
          )}
        </Form>
        {actionData?.error && <p className="text-sm text-red-700">{t(actionData.error)}</p>}
      </div>
    );
  }

  return (
    <section className="bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-lg bg-white p-6 shadow sm:p-8">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">{t("parentConsent.title")}</h1>
        {body}
      </div>
    </section>
  );
}
