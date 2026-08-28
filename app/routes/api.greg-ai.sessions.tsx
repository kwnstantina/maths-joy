import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUserId } from "~/utils/auth.prisma";
import { isGregAiEnabled } from "~/utils/featureFlags.server";
import {
  deleteSession,
  getSessionMessages,
  listSessions,
} from "~/utils/gregChat.prisma";
import { applyRateLimit } from "~/utils/ratelimit.server";

export async function loader({ request }: LoaderFunctionArgs) {
  if (!isGregAiEnabled()) {
    return json({ error: "Greg AI is disabled" }, { status: 404 });
  }

  const userId = await getUserId(request);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResponse = applyRateLimit(request, "api", userId);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");

  if (sessionId) {
    const messages = await getSessionMessages(sessionId, userId);
    if (!messages) {
      return json({ error: "Session not found" }, { status: 404 });
    }
    return json({ messages });
  }

  const sessions = await listSessions(userId);
  return json({ sessions });
}

export async function action({ request }: ActionFunctionArgs) {
  if (!isGregAiEnabled()) {
    return json({ error: "Greg AI is disabled" }, { status: 404 });
  }

  const userId = await getUserId(request);
  if (!userId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const rateLimitResponse = applyRateLimit(request, "api", userId);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) {
    return json({ error: "sessionId required" }, { status: 400 });
  }

  const ok = await deleteSession(sessionId, userId);
  return json({ ok });
}
