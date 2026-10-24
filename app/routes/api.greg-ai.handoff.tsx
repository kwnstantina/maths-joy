import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { CONTACT_CARD_MARKER_PATTERN } from "~/utils/anthropic.server";
import { getUser } from "~/utils/auth.prisma";
import { sendTeacherHandoffEmail } from "~/utils/email.server";
import { isGregAiEnabled } from "~/utils/featureFlags.server";
import { getSessionMessages } from "~/utils/gregChat.prisma";
import { applyRateLimit } from "~/utils/ratelimit.server";

interface HandoffBody {
  sessionId?: unknown;
  note?: unknown;
}

const MAX_NOTE_LENGTH = 1000;
// Enough to see where the student got stuck without mailing a whole history.
const MAX_TRANSCRIPT_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 3000;

/**
 * Emails a Greg AI conversation to Greg (the human). Triggered only by the
 * student clicking "send to Greg" on the contact card — never by the model.
 */
export async function action({ request }: ActionFunctionArgs) {
  if (!isGregAiEnabled()) {
    return json({ error: "Greg AI is disabled" }, { status: 404 });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const user = await getUser(request);
  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Shares the contact form's 3/hour budget: both land in the same inbox.
  const rateLimitResponse = applyRateLimit(request, "contact", user.id);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let body: HandoffBody;
  try {
    body = (await request.json()) as HandoffBody;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
  const note =
    typeof body.note === "string" ? body.note.trim().slice(0, MAX_NOTE_LENGTH) : "";
  if (!sessionId) {
    return json({ error: "Session required" }, { status: 400 });
  }

  // Scoped to the user: a student can only forward their own conversation.
  const messages = await getSessionMessages(sessionId, user.id);
  if (!messages) {
    return json({ error: "Session not found" }, { status: 404 });
  }

  const transcript = messages.slice(-MAX_TRANSCRIPT_MESSAGES).map((m) => ({
    role: m.role,
    content: m.content.replace(CONTACT_CARD_MARKER_PATTERN, "").trim().slice(0, MAX_MESSAGE_CHARS),
  }));

  const studentName =
    [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") || user.email;

  const ok = await sendTeacherHandoffEmail({
    studentName,
    studentEmail: user.email,
    note,
    transcript,
  });
  if (!ok) {
    return json({ error: "send_failed" }, { status: 502 });
  }

  return json({ ok: true });
}

export async function loader() {
  return json({ error: "Method not allowed" }, { status: 405 });
}
