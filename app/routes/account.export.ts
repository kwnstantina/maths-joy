import type { LoaderFunctionArgs } from "@remix-run/node";
import { exportAccountData } from "~/utils/account.server";
import { requireUserId } from "~/utils/auth.prisma";
import { applyRateLimit } from "~/utils/ratelimit.server";

/** GDPR art. 15/20 — download everything we hold about the logged-in user. */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const limited = applyRateLimit(request, "download", userId);
  if (limited) return limited;

  const payload = await exportAccountData(userId);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="gregkyrmaths-data-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
};
