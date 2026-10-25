import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { requireUserId } from "~/utils/auth.prisma";
import { isGregProEnabled } from "~/utils/featureFlags.server";
import { syncFromCheckoutSession } from "~/utils/subscription.server";

export const handle = { i18n: ["common"] };

export const meta: MetaFunction = () => [
  { title: "Greg AI Pro | GregKyrMaths" },
  { name: "robots", content: "noindex" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (!isGregProEnabled()) throw new Response("Not found", { status: 404 });
  const userId = await requireUserId(request);
  const sessionId = new URL(request.url).searchParams.get("session_id") ?? "";

  // Sync now rather than waiting for the webhook, so Pro works on the next message.
  let done = false;
  if (/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    try {
      done = await syncFromCheckoutSession(sessionId, userId);
    } catch (err) {
      console.error("[pro] success sync failed", err);
    }
  }
  return { done };
};

export default function ProSuccess() {
  const { done } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  return (
    <section className="bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-lg bg-white p-6 text-center shadow sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">{t(done ? "pro.success.title" : "pro.success.pendingTitle")}</h1>
        <p className="mt-3 text-gray-700">{t(done ? "pro.success.body" : "pro.success.pendingBody")}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700">
            {t("pro.success.start")}
          </Link>
          <Link to="/account" className="rounded-lg border border-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-50">
            {t("pro.manage")}
          </Link>
        </div>
      </div>
    </section>
  );
}
