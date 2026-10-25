import crypto from "crypto";
import { json } from "@remix-run/node";
import { sendParentConsentEmail } from "~/utils/email.server";
import { prisma } from "~/utils/prisma.server";

/**
 * Bump when the Terms of Use or Privacy Policy change materially; users who
 * accepted an older version are asked to accept again on /consent.
 */
export const CONSENT_VERSION = "2026-10-25";

/** Greek age of digital consent (N. 4624/2019 art. 21, GDPR art. 8). */
export const DIGITAL_CONSENT_AGE = 15;

/** A parent may be re-emailed at most this often. */
const PARENT_EMAIL_COOLDOWN_MS = 10 * 60 * 1000;

export type ConsentStatus = "needs_terms" | "awaiting_parent" | "ok";

interface ConsentFields {
  termsAcceptedAt: Date | null;
  termsVersion: string | null;
  isUnder15: boolean | null;
  parentConsentAt: Date | null;
}

export const CONSENT_SELECT = {
  termsAcceptedAt: true,
  termsVersion: true,
  isUnder15: true,
  parentConsentAt: true,
} as const;

export function consentStatusOf(user: ConsentFields): ConsentStatus {
  if (!user.termsAcceptedAt || user.termsVersion !== CONSENT_VERSION || user.isUnder15 == null) {
    return "needs_terms";
  }
  if (user.isUnder15 && !user.parentConsentAt) return "awaiting_parent";
  return "ok";
}

export async function getConsentStatus(userId: string): Promise<ConsentStatus> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: CONSENT_SELECT });
  return user ? consentStatusOf(user) : "needs_terms";
}

/**
 * Greg AI processes chats, photos and learning history, so it stays locked
 * until consent is complete. Returns a 403 the widget localizes, or null.
 */
export async function requireGregConsent(userId: string): Promise<Response | null> {
  const status = await getConsentStatus(userId);
  if (status === "ok") return null;
  return json({ error: "consent_required", consent: status }, { status: 403 });
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

interface RecordConsentInput {
  userId: string;
  isUnder15: boolean;
  parentEmail?: string | null;
  origin: string;
  locale: string;
}

/**
 * Stores the user's acceptance of the current terms and their age declaration.
 * For under-15s, emails the parent a one-time confirmation link.
 * Returns false only if the parent email could not be sent.
 */
export async function recordConsent(input: RecordConsentInput): Promise<boolean> {
  const user = await prisma.user.update({
    where: { id: input.userId },
    data: {
      termsAcceptedAt: new Date(),
      termsVersion: CONSENT_VERSION,
      isUnder15: input.isUnder15,
      ...(input.isUnder15 ? {} : { parentEmail: null, parentConsentTokenHash: null }),
    },
    select: { parentEmail: true, parentConsentAt: true },
  });

  if (!input.isUnder15) return true;
  const parentEmail = input.parentEmail?.trim().toLowerCase();
  if (!parentEmail) return false;
  if (user.parentConsentAt && user.parentEmail === parentEmail) return true;
  return sendParentConsent({ ...input, parentEmail, force: true });
}

interface SendParentConsentInput {
  userId: string;
  parentEmail: string;
  origin: string;
  locale: string;
  force?: boolean;
}

export async function sendParentConsent(input: SendParentConsentInput): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true, profile: true, parentConsentSentAt: true, parentEmail: true },
  });
  if (!user) return false;

  const sameParent = user.parentEmail === input.parentEmail;
  const recentlySent =
    user.parentConsentSentAt &&
    Date.now() - user.parentConsentSentAt.getTime() < PARENT_EMAIL_COOLDOWN_MS;
  if (sameParent && recentlySent && !input.force) return true;

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: input.userId },
    data: {
      parentEmail: input.parentEmail,
      parentConsentTokenHash: hashToken(token),
      parentConsentSentAt: new Date(),
      parentConsentAt: null,
    },
  });

  const childName =
    [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") || user.email;
  return sendParentConsentEmail({
    to: input.parentEmail,
    childName,
    childEmail: user.email,
    link: `${input.origin}/parent-consent/${token}`,
    locale: input.locale,
  });
}

/** The child account a parent-consent link belongs to, or null if the link is invalid/used. */
export async function findUserByParentToken(token: string) {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  return prisma.user.findFirst({
    where: { parentConsentTokenHash: hashToken(token) },
    select: { id: true, email: true, profile: true, parentEmail: true, parentConsentAt: true },
  });
}

export async function approveParentConsent(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { parentConsentAt: new Date(), parentConsentTokenHash: null },
  });
}
