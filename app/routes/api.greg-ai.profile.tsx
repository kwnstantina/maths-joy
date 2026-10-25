import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUserId } from "~/utils/auth.prisma";
import { requireGregConsent } from "~/utils/consent.server";
import { isGregAiEnabled } from "~/utils/featureFlags.server";
import { isGrade } from "~/utils/grades";
import { prisma } from "~/utils/prisma.server";
import { applyRateLimit } from "~/utils/ratelimit.server";

/** Saves the school grade the student picked in the Greg AI widget. */
export async function action({ request }: ActionFunctionArgs) {
  if (!isGregAiEnabled()) {
    return json({ error: "Greg AI is disabled" }, { status: 404 });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const userId = await getUserId(request);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  const consentResponse = await requireGregConsent(userId);
  if (consentResponse) return consentResponse;

  const rateLimitResponse = applyRateLimit(request, "api", userId);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let body: { grade?: unknown };
  try {
    body = (await request.json()) as { grade?: unknown };
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isGrade(body.grade)) {
    return json({ error: "Invalid grade" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { grade: body.grade, updatedAt: new Date() },
  });

  return json({ ok: true, grade: body.grade });
}

export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}
