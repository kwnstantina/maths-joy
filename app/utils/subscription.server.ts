import type Stripe from "stripe";
import { CHAT_DAILY_LIMIT, CHAT_DAILY_SPEND_BUDGET } from "~/utils/anthropic.server";
import { logAuditEvent } from "~/utils/audit.server";
import { isGregProEnabled } from "~/utils/featureFlags.server";
import {
  FREE_DAILY_MESSAGES,
  GREG_PRO_PRICES,
  PRO_DAILY_MESSAGES,
  WITHDRAWAL_DAYS,
  type BillingInterval,
} from "~/utils/plans";
import { prisma } from "~/utils/prisma.server";
import { isAdmin } from "~/utils/roles";
import { stripe } from "~/utils/stripe.server";

/**
 * Greg AI Pro subscriptions.
 *
 * Stripe is the source of truth. The User.subscription* fields are a mirror,
 * refreshed by re-retrieving the subscription from the API on every webhook
 * and on the success page — so event order and webhook payload versions don't
 * matter.
 *
 * With STRIPE_MANAGED_PAYMENTS=true, Stripe (Link) is the merchant of record:
 * it charges VAT, sends receipts and handles disputes. That has to be enabled
 * for the account in the Stripe Dashboard first.
 */

// AI as a Service, cloud-based, personal use — eligible for Managed Payments.
const PRO_TAX_CODE = "txcd_10105001";
const PRO_PRODUCT_NAME = "Greg AI Pro";

// Stripe keeps retrying a failed renewal for a while (past_due); the student
// keeps Pro during those retries.
const PRO_STATUSES = ["active", "trialing", "past_due"];

export type GregPlan = "legacy" | "free" | "pro";

export interface GregLimits {
  plan: GregPlan;
  dailyMessages: number;
  /** Per UTC day, in cost units (1_000_000 = $1; see costUnits). */
  dailySpend: number;
  /** Per billing period, in cost units — keeps the heaviest Pro student profitable. */
  periodSpend: number | null;
  /** YYYY-MM-DD start of the billing period the periodSpend cap counts from. */
  periodStart: string | null;
}

// Before Pro launches (flag off) everyone keeps the original limits.
const LEGACY_LIMITS: GregLimits = {
  plan: "legacy",
  dailyMessages: CHAT_DAILY_LIMIT,
  dailySpend: CHAT_DAILY_SPEND_BUDGET,
  periodSpend: null,
  periodStart: null,
};

export const SUBSCRIPTION_SELECT = {
  role: true,
  email: true,
  stripeCustomerId: true,
  subscriptionId: true,
  subscriptionStatus: true,
  subscriptionInterval: true,
  subscriptionPeriodStart: true,
  subscriptionPeriodEnd: true,
  subscriptionCancelAtPeriodEnd: true,
  subscriptionStartedAt: true,
} as const;

type SubscriptionFields = {
  subscriptionStatus: string | null;
  subscriptionPeriodEnd: Date | null;
};

export function hasActivePro(user: SubscriptionFields): boolean {
  if (!user.subscriptionStatus || !PRO_STATUSES.includes(user.subscriptionStatus)) return false;
  // A missed webhook must not grant Pro forever: give one day of grace past the period end.
  if (!user.subscriptionPeriodEnd) return false;
  return user.subscriptionPeriodEnd.getTime() + 24 * 60 * 60 * 1000 > Date.now();
}

export async function getGregLimits(userId: string): Promise<GregLimits> {
  if (!isGregProEnabled()) return LEGACY_LIMITS;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, subscriptionStatus: true, subscriptionPeriodEnd: true, subscriptionPeriodStart: true },
  });
  if (!user) return { ...LEGACY_LIMITS, plan: "free", dailyMessages: FREE_DAILY_MESSAGES, dailySpend: 60_000 };
  // The teacher tests Greg AI a lot; give admins Pro limits without paying.
  if (isAdmin(user)) {
    return { plan: "pro", dailyMessages: PRO_DAILY_MESSAGES, dailySpend: 300_000, periodSpend: null, periodStart: null };
  }
  if (hasActivePro(user)) {
    return {
      plan: "pro",
      dailyMessages: PRO_DAILY_MESSAGES,
      dailySpend: 300_000,
      periodSpend: 3_000_000, // ~$3 of AI per month on a €5.99 plan
      periodStart: user.subscriptionPeriodStart?.toISOString().slice(0, 10) ?? null,
    };
  }
  return { plan: "free", dailyMessages: FREE_DAILY_MESSAGES, dailySpend: 60_000, periodSpend: null, periodStart: null };
}

// ---------------------------------------------------------------------------
// Stripe objects
// ---------------------------------------------------------------------------

function requireStripe(): Stripe {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe;
}

export function managedPaymentsEnabled(): boolean {
  return process.env.STRIPE_MANAGED_PAYMENTS?.trim().toLowerCase() === "true";
}

const priceIdCache = new Map<BillingInterval, string>();

/**
 * Finds the Pro price by lookup key, creating product + price on first use so
 * nothing has to be set up by hand in the Dashboard (test or live mode).
 */
async function getProPriceId(interval: BillingInterval): Promise<string> {
  const cached = priceIdCache.get(interval);
  if (cached) return cached;

  const s = requireStripe();
  const { lookupKey, amount } = GREG_PRO_PRICES[interval];
  const existing = await s.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  let price = existing.data[0];

  if (!price) {
    // Reuse the product if the other interval already created it.
    const other = await s.prices.list({
      lookup_keys: Object.values(GREG_PRO_PRICES).map((p) => p.lookupKey),
      active: true,
      limit: 1,
    });
    const productId = typeof other.data[0]?.product === "string" ? other.data[0].product : other.data[0]?.product.id;
    price = await s.prices.create({
      currency: "eur",
      unit_amount: Math.round(amount * 100),
      recurring: { interval },
      tax_behavior: "inclusive",
      lookup_key: lookupKey,
      ...(productId
        ? { product: productId }
        : { product_data: { name: PRO_PRODUCT_NAME, tax_code: PRO_TAX_CODE } }),
    });
  }

  priceIdCache.set(interval, price.id);
  return price.id;
}

async function ensureCustomer(userId: string): Promise<string> {
  const s = requireStripe();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true, profile: true },
  });
  if (!user) throw new Error("User not found");
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const name = [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") || undefined;
  const customer = await s.customers.create(
    { email: user.email, name, metadata: { userId } },
    { idempotencyKey: `customer:${userId}` }
  );
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createProCheckout({
  userId,
  interval,
  origin,
  locale,
}: {
  userId: string;
  interval: BillingInterval;
  origin: string;
  locale: "el" | "en";
}): Promise<string> {
  const s = requireStripe();
  const [customer, price] = await Promise.all([ensureCustomer(userId), getProPriceId(interval)]);

  const minuteBucket = Math.floor(Date.now() / 60_000);
  const session = await s.checkout.sessions.create(
    {
      mode: "subscription",
      customer,
      line_items: [{ price, quantity: 1 }],
      client_reference_id: userId,
      metadata: { userId, product: "greg_pro" },
      subscription_data: { metadata: { userId, product: "greg_pro" } },
      success_url: `${origin}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro`,
      locale,
      ...(managedPaymentsEnabled() ? { managed_payments: { enabled: true } } : {}),
    },
    { idempotencyKey: `pro-checkout:${userId}:${interval}:${minuteBucket}` }
  );
  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return session.url;
}

// ---------------------------------------------------------------------------
// Mirror
// ---------------------------------------------------------------------------

const TERMINAL = ["canceled", "incomplete_expired"];

export async function syncSubscription(subscriptionId: string): Promise<void> {
  const s = requireStripe();
  const sub = await s.subscriptions.retrieve(subscriptionId);
  if (sub.metadata?.product !== "greg_pro") return;

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const user = sub.metadata.userId
    ? await prisma.user.findUnique({ where: { id: sub.metadata.userId }, select: { id: true, subscriptionId: true, subscriptionStatus: true } })
    : await prisma.user.findFirst({ where: { stripeCustomerId: customerId }, select: { id: true, subscriptionId: true, subscriptionStatus: true } });
  if (!user) return; // account deleted

  // A late event about an old, finished subscription must not overwrite a newer live one.
  if (
    user.subscriptionId &&
    user.subscriptionId !== sub.id &&
    TERMINAL.includes(sub.status) &&
    user.subscriptionStatus &&
    PRO_STATUSES.includes(user.subscriptionStatus)
  ) {
    return;
  }

  const item = sub.items.data[0];
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: customerId,
      subscriptionId: sub.id,
      subscriptionStatus: sub.status,
      subscriptionInterval: item?.price.recurring?.interval ?? null,
      subscriptionPeriodStart: item ? new Date(item.current_period_start * 1000) : null,
      subscriptionPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
      subscriptionCancelAtPeriodEnd: sub.cancel_at_period_end,
      subscriptionStartedAt: new Date(sub.start_date * 1000),
    },
  });
}

/** Success page: confirm the session belongs to this user and sync without waiting for the webhook. */
export async function syncFromCheckoutSession(sessionId: string, userId: string): Promise<boolean> {
  const s = requireStripe();
  const session = await s.checkout.sessions.retrieve(sessionId);
  if (session.client_reference_id !== userId || session.mode !== "subscription") return false;
  const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (!subId) return false;
  await syncSubscription(subId);
  return session.status === "complete";
}

// ---------------------------------------------------------------------------
// Self-service
// ---------------------------------------------------------------------------

export interface SubscriptionView {
  pro: boolean;
  status: string | null;
  interval: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** ISO date until which the withdrawal button is shown, or null. */
  withdrawUntil: string | null;
}

export function subscriptionViewOf(user: {
  subscriptionStatus: string | null;
  subscriptionInterval: string | null;
  subscriptionPeriodEnd: Date | null;
  subscriptionCancelAtPeriodEnd: boolean | null;
  subscriptionStartedAt: Date | null;
}): SubscriptionView {
  const pro = hasActivePro(user);
  const withdrawUntil =
    pro && user.subscriptionStartedAt
      ? new Date(user.subscriptionStartedAt.getTime() + WITHDRAWAL_DAYS * 24 * 60 * 60 * 1000)
      : null;
  return {
    pro,
    status: user.subscriptionStatus,
    interval: user.subscriptionInterval,
    periodEnd: user.subscriptionPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: Boolean(user.subscriptionCancelAtPeriodEnd),
    withdrawUntil: withdrawUntil && withdrawUntil.getTime() > Date.now() ? withdrawUntil.toISOString() : null,
  };
}

async function currentSubscriptionId(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionId: true } });
  if (!user?.subscriptionId) throw new Error("No subscription");
  return user.subscriptionId;
}

/** Cancel at the end of the paid period (or undo that). */
export async function setCancelAtPeriodEnd(userId: string, cancel: boolean): Promise<void> {
  const s = requireStripe();
  const id = await currentSubscriptionId(userId);
  await s.subscriptions.update(id, { cancel_at_period_end: cancel });
  await syncSubscription(id);
  await logAuditEvent({
    userId,
    action: "update",
    resource: "subscription",
    resourceId: id,
    metadata: { event: cancel ? "cancel_at_period_end" : "resume" },
  });
}

/**
 * Withdrawal within 14 days (consumer law; N. 5317/2026 withdrawal button):
 * ends the subscription now and refunds the latest payment in full.
 */
export async function withdrawSubscription(userId: string): Promise<void> {
  const s = requireStripe();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: SUBSCRIPTION_SELECT });
  if (!user?.subscriptionId) throw new Error("No subscription");
  if (!subscriptionViewOf(user).withdrawUntil) throw new Error("Withdrawal period over");

  const sub = await s.subscriptions.retrieve(user.subscriptionId);
  const invoiceId = typeof sub.latest_invoice === "string" ? sub.latest_invoice : sub.latest_invoice?.id;

  await s.subscriptions.cancel(sub.id);

  let refunded = false;
  if (invoiceId) {
    const payments = await s.invoicePayments.list({ invoice: invoiceId, status: "paid", limit: 5 });
    for (const p of payments.data) {
      const pi = p.payment.payment_intent;
      const piId = typeof pi === "string" ? pi : pi?.id;
      if (piId) {
        await s.refunds.create({ payment_intent: piId, reason: "requested_by_customer" }, { idempotencyKey: `withdraw:${piId}` });
        refunded = true;
      }
    }
  }

  await syncSubscription(sub.id);
  await logAuditEvent({
    userId,
    action: "update",
    resource: "subscription",
    resourceId: sub.id,
    metadata: { event: "withdrawal", refunded },
  });
}

export async function createBillingPortalUrl(userId: string, returnUrl: string): Promise<string> {
  const s = requireStripe();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeCustomerId: true } });
  if (!user?.stripeCustomerId) throw new Error("No Stripe customer");
  const portal = await s.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: returnUrl });
  return portal.url;
}

/** Account deletion: stop future charges immediately (no refund). Throws if Stripe fails. */
export async function cancelSubscriptionForDeletion(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionId: true, subscriptionStatus: true },
  });
  if (!user?.subscriptionId || !user.subscriptionStatus || TERMINAL.includes(user.subscriptionStatus)) return;
  await requireStripe().subscriptions.cancel(user.subscriptionId);
}
