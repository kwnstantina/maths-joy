import { Resend } from "resend";

interface ContactEmailInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface SendResult {
  ok: boolean;
  errorKey?: string;
}

const FROM_DEFAULT = "Contact Form <onboarding@resend.dev>";
const TO_DEFAULT = "gregkirmaths@gmail.com";

interface OutgoingEmail {
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}

/** Sends one email to the site owner. Never throws. */
async function sendToOwner(email: OutgoingEmail, tag: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(`[email] RESEND_API_KEY is not set — ${tag} email cannot be delivered`);
    return false;
  }

  const to = process.env.CONTACT_EMAIL_TO || TO_DEFAULT;
  const from = process.env.CONTACT_EMAIL_FROM || FROM_DEFAULT;

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to,
      replyTo: email.replyTo,
      subject: email.subject.replace(/[\r\n]/g, " ").slice(0, 200),
      text: email.text,
      html: email.html,
    });
    if (error) {
      console.error(`[email] ${tag} send failed:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] ${tag} send threw:`, err);
    return false;
  }
}

export async function sendContactEmail(input: ContactEmailInput): Promise<SendResult> {
  const ok = await sendToOwner(
    {
      replyTo: input.email,
      subject: `[Contact] ${input.subject}`,
      text: [
        `From: ${input.name} <${input.email}>`,
        `Subject: ${input.subject}`,
        "",
        input.message,
      ].join("\n"),
      html: `
        <div style="font-family:system-ui,sans-serif;line-height:1.5">
          <p><strong>From:</strong> ${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;</p>
          <p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>
          <hr style="border:none;border-top:1px solid #eee;margin:1em 0" />
          <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
        </div>
      `,
    },
    "contact"
  );
  return ok ? { ok: true } : { ok: false, errorKey: "contact.error" };
}

interface HandoffEmailInput {
  studentName: string;
  studentEmail: string;
  note: string;
  transcript: { role: "user" | "assistant"; content: string }[];
}

/**
 * A student asked Greg AI to pass their conversation to Greg (the human).
 * Reply-To is the student, so answering the email reaches them directly.
 */
export async function sendTeacherHandoffEmail(input: HandoffEmailInput): Promise<boolean> {
  const speaker = (role: "user" | "assistant") =>
    role === "user" ? input.studentName : "Greg AI";

  const text = [
    `Student: ${input.studentName} <${input.studentEmail}>`,
    "",
    "Note from the student:",
    input.note || "(none)",
    "",
    "--- Conversation with Greg AI ---",
    ...input.transcript.map((m) => `\n[${speaker(m.role)}]\n${m.content}`),
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.5">
      <p><strong>Student:</strong> ${escapeHtml(input.studentName)} &lt;${escapeHtml(input.studentEmail)}&gt;</p>
      <p><strong>Note from the student:</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(input.note || "(none)")}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:1em 0" />
      <p><strong>Conversation with Greg AI</strong></p>
      ${input.transcript
        .map(
          (m) => `
        <div style="margin:0.75em 0;padding:0.5em 0.75em;border-radius:8px;background:${m.role === "user" ? "#fff7ed" : "#f3f4f6"}">
          <div style="font-size:12px;color:#6b7280">${escapeHtml(speaker(m.role))}</div>
          <div style="white-space:pre-wrap">${escapeHtml(m.content)}</div>
        </div>`
        )
        .join("")}
    </div>
  `;

  return sendToOwner(
    {
      replyTo: input.studentEmail,
      subject: `[Greg AI] ${input.studentName} needs help`,
      text,
      html,
    },
    "handoff"
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
