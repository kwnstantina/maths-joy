import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUserId } from "~/utils/auth.prisma";
import { setMessageRating } from "~/utils/gregChat.prisma";
import { applyRateLimit } from "~/utils/ratelimit.server";

interface FeedbackBody {
  messageId?: unknown;
  rating?: unknown;
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const rateLimitResponse = applyRateLimit(request, "api", userId);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messageId = typeof body.messageId === "string" ? body.messageId : "";
  const rating = body.rating === 1 || body.rating === -1 ? body.rating : null;
  if (!messageId || rating === null) {
    return json({ error: "Invalid input" }, { status: 400 });
  }

  const result = await setMessageRating(messageId, userId, rating);
  if (!result.ok) {
    return json({ error: "Message not found" }, { status: 404 });
  }

  return json({ ok: true, rating: result.rating });
}

export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}
