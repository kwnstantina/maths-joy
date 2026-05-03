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

export async function sendContactEmail(input: ContactEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[email] RESEND_API_KEY is not set — contact form cannot deliver");
    return { ok: false, errorKey: "contact.error" };
  }

  const to = process.env.CONTACT_EMAIL_TO || TO_DEFAULT;
  const from = process.env.CONTACT_EMAIL_FROM || FROM_DEFAULT;

  const resend = new Resend(apiKey);
  const cleanSubject = input.subject.replace(/[\r\n]/g, " ").slice(0, 200);

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: input.email,
      subject: `[Contact] ${cleanSubject}`,
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
    });

    if (error) {
    
      return { ok: false, errorKey: "contact.error" };
    }
    return { ok: true };
  } catch (err) {

    return { ok: false, errorKey: "contact.error" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
