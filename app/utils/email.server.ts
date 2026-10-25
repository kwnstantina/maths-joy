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

/** Sends one email. Never throws. */
async function sendEmail(to: string, email: OutgoingEmail, tag: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(`[email] RESEND_API_KEY is not set — ${tag} email cannot be delivered`);
    return false;
  }

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

/** Sends one email to the site owner. Never throws. */
function sendToOwner(email: OutgoingEmail, tag: string): Promise<boolean> {
  return sendEmail(process.env.CONTACT_EMAIL_TO || TO_DEFAULT, email, tag);
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

interface ParentConsentEmailInput {
  to: string;
  childName: string;
  childEmail: string;
  link: string;
  locale: string;
}

/**
 * Asks a parent/guardian to confirm their under-15 child's account
 * (GDPR art. 8, N. 4624/2019 art. 21). Reply-To is the teacher.
 */
export async function sendParentConsentEmail(input: ParentConsentEmailInput): Promise<boolean> {
  const el = input.locale.startsWith("el");
  const child = `${input.childName} (${input.childEmail})`;
  const lines = el
    ? {
        subject: "Επιβεβαίωση γονέα για λογαριασμό στο GregKyrMaths",
        intro: `Το παιδί σας, ${child}, δημιούργησε λογαριασμό στο GregKyrMaths, μια πλατφόρμα μαθηματικών του καθηγητή Γρηγόρη Κυρίτση, και δήλωσε ότι είναι κάτω των 15 ετών.`,
        why: "Σύμφωνα με τον νόμο (GDPR άρθρ. 8, Ν. 4624/2019 άρθρ. 21), χρειαζόμαστε τη συγκατάθεσή σας για να χρησιμοποιήσει το Greg AI, τον ψηφιακό βοηθό μαθηματικών που λειτουργεί με τεχνητή νοημοσύνη. Το Greg AI αποθηκεύει τις συνομιλίες, τις οποίες μπορεί να διαβάσει ο καθηγητής.",
        cta: "Δείτε τις λεπτομέρειες και απαντήστε",
        ignore: "Αν δεν γνωρίζετε αυτόν τον λογαριασμό, μπορείτε να ανοίξετε τον σύνδεσμο και να τον απορρίψετε — ο λογαριασμός θα διαγραφεί.",
      }
    : {
        subject: "Parent confirmation for a GregKyrMaths account",
        intro: `Your child, ${child}, created an account on GregKyrMaths, a mathematics platform run by teacher Grigoris Kyritsis, and said they are under 15.`,
        why: "By law (GDPR Art. 8, Greek Law 4624/2019 Art. 21) we need your consent before they can use Greg AI, the site's artificial-intelligence math assistant. Greg AI stores conversations, which the teacher may read.",
        cta: "See the details and respond",
        ignore: "If you don't recognise this account, open the link and decline — the account will be deleted.",
      };

  return sendEmail(
    input.to,
    {
      replyTo: process.env.CONTACT_EMAIL_TO || TO_DEFAULT,
      subject: lines.subject,
      text: [lines.intro, "", lines.why, "", `${lines.cta}: ${input.link}`, "", lines.ignore].join("\n"),
      html: `
        <div style="font-family:system-ui,sans-serif;line-height:1.5">
          <p>${escapeHtml(lines.intro)}</p>
          <p>${escapeHtml(lines.why)}</p>
          <p><a href="${escapeHtml(input.link)}" style="display:inline-block;background:#ea580c;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">${escapeHtml(lines.cta)}</a></p>
          <p style="color:#6b7280;font-size:13px">${escapeHtml(lines.ignore)}</p>
        </div>
      `,
    },
    "parent-consent"
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
