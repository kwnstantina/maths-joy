import Stripe from 'stripe';
import { prisma } from './prisma.server';
import crypto from 'crypto';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not set - Stripe functionality will be disabled');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-02-24.acacia' })
  : null;

// Types
export interface CreateCheckoutSessionParams {
  bookId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string | null;
}

/**
 * Create a Stripe checkout session for purchasing a book.
 *
 * Idempotency:
 *   - If the same user has a pending Purchase for the same book within the last
 *     5 minutes with a still-open Stripe session, that session is reused. This
 *     prevents double-clicked Buy buttons from creating duplicate Purchase rows.
 *   - The Stripe API call also passes an Idempotency-Key derived from
 *     userId+bookId+minute-bucket as belt-and-braces protection against
 *     parallel requests racing past the DB check.
 */
export async function createCheckoutSession({
  bookId,
  userId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Get book details
  const book = await prisma.book.findUnique({
    where: { id: bookId },
  });

  if (!book) {
    throw new Error('Book not found');
  }

  if (!book.isActive) {
    throw new Error('Book is not available for purchase');
  }

  // Reuse an existing pending Purchase + open Stripe session if the same user
  // recently started a checkout for the same book (e.g. double-clicked Buy).
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentPending = await prisma.purchase.findFirst({
    where: {
      userId,
      bookId,
      status: 'pending',
      createdAt: { gte: fiveMinutesAgo },
      stripeSessionId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentPending?.stripeSessionId) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(
        recentPending.stripeSessionId
      );
      if (existing.status === 'open' && existing.url) {
        return { sessionId: existing.id, url: existing.url };
      }
    } catch {
      // Fall through and create a fresh session
    }
  }

  // Generate a unique download token for this purchase
  const downloadToken = crypto.randomBytes(32).toString('hex');

  // Create or get Stripe price
  let priceId = book.stripePriceId;

  if (!priceId) {
    // Create product and price in Stripe if not exists
    const product = await stripe.products.create({
      name: book.title,
      description: book.description,
      images: book.thumbnailUrl ? [book.thumbnailUrl] : [],
      tax_code: 'txcd_10010001',
      metadata: {
        bookId: book.id,
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(book.price * 100), // Stripe uses cents
      currency: book.currency.toLowerCase(),
    });

    // Update book with Stripe IDs
    await prisma.book.update({
      where: { id: bookId },
      data: {
        stripeProductId: product.id,
        stripePriceId: price.id,
      },
    });

    priceId = price.id;
  }

  // Create pending purchase record
  const now = new Date();
  const purchase = await prisma.purchase.create({
    data: {
      userId,
      bookId,
      amount: book.price,
      currency: book.currency,
      status: 'pending',
      downloadToken,
      createdAt: now,
      updatedAt: now,
    },
  });

  // Idempotency key collapses concurrent identical requests into one Stripe
  // session. Minute-bucket so a user reopening the page next minute gets a
  // fresh session if the previous one expired.
  const minuteBucket = Math.floor(Date.now() / 60_000);
  const idempotencyKey = `checkout:${userId}:${bookId}:${minuteBucket}`;

  // Create Stripe checkout session.
  // Note: payment_method_types is intentionally omitted so Stripe auto-enables
  // every payment method configured in the dashboard (cards, Apple Pay,
  // Google Pay, Link, SEPA, etc).
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: true },
      metadata: {
        purchaseId: purchase.id,
        bookId,
        userId,
        downloadToken,
      },
      // Propagate metadata onto the PaymentIntent so payment_intent.payment_failed
      // webhooks can resolve back to the Purchase row.
      payment_intent_data: {
        metadata: {
          purchaseId: purchase.id,
          bookId,
          userId,
        },
      },
      customer_email: undefined, // Will be filled by user
    },
    { idempotencyKey }
  );

  // Update purchase with session ID
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      stripeSessionId: session.id,
    },
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Handle successful payment webhook.
 *
 * Idempotent: uses an atomic conditional update so concurrent webhook
 * deliveries (or webhook + reconciliation poller racing) cannot both fulfill
 * the same purchase. Only the row currently in `pending` is upgraded; any
 * subsequent caller observes count=0 and returns silently.
 */
export async function handlePaymentSuccess(
  sessionId: string
): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new Error('Payment not completed');
  }

  const purchaseId = session.metadata?.purchaseId;
  if (!purchaseId) {
    throw new Error('Purchase ID not found in session metadata');
  }

  // Set token expiration to 365 days from now
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 365);

  // Atomic transition: pending -> completed.
  // If another caller already won the race, count will be 0 and we return safely.
  const result = await prisma.purchase.updateMany({
    where: { id: purchaseId, status: 'pending' },
    data: {
      status: 'completed',
      stripePaymentId: session.payment_intent as string,
      tokenExpiresAt,
      updatedAt: new Date(),
    },
  });

  if (result.count === 0) {
    // Already fulfilled by a previous webhook delivery or by the reconciliation
    // path — nothing to do.
    return;
  }
}

/**
 * Handle payment failure webhook (checkout.session.expired)
 */
export async function handlePaymentFailure(
  sessionId: string
): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const purchaseId = session.metadata?.purchaseId;
  if (purchaseId) {
    // Only transition pending -> failed; never overwrite a completed purchase.
    await prisma.purchase.updateMany({
      where: { id: purchaseId, status: 'pending' },
      data: {
        status: 'failed',
        updatedAt: new Date(),
      },
    });
  }
}

/**
 * Handle a payment_intent.payment_failed webhook.
 *
 * Resolves the related Purchase via PaymentIntent metadata (propagated from
 * the Checkout Session via payment_intent_data.metadata at session creation)
 * and marks it 'failed'. Only transitions from 'pending' so a later success
 * cannot regress.
 */
export async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const purchaseId = paymentIntent.metadata?.purchaseId;
  if (!purchaseId) {
    // No metadata — likely a PI not created by our checkout flow. Ignore.
    return;
  }

  await prisma.purchase.updateMany({
    where: { id: purchaseId, status: 'pending' },
    data: {
      status: 'failed',
      stripePaymentId: paymentIntent.id,
      updatedAt: new Date(),
    },
  });
}

/**
 * Handle a charge.refunded webhook.
 *
 * Finds the Purchase via PaymentIntent ID (stored as Purchase.stripePaymentId
 * on success) and marks it 'refunded'. Nulls the downloadToken so the
 * /download/:token route immediately rejects further attempts.
 *
 * Stripe fires charge.refunded for both full and partial refunds. We treat
 * any refund as access-revoking — partial refunds for digital goods are rare
 * and almost always represent a customer-service decision to undo the sale.
 */
export async function handleChargeRefunded(
  charge: Stripe.Charge
): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    return;
  }

  const purchase = await prisma.purchase.findFirst({
    where: { stripePaymentId: paymentIntentId },
  });

  if (!purchase) {
    return;
  }

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      status: 'refunded',
      downloadToken: null, // revoke access
      updatedAt: new Date(),
    },
  });
}

/**
 * Handle a charge.dispute.created webhook.
 *
 * Records the dispute in AuditLog and revokes download access immediately.
 * The merchant should also receive an out-of-band alert (email/Slack) — that
 * wiring is out of scope here, but the AuditLog entry preserves the signal.
 */
export async function handleDisputeCreated(
  dispute: Stripe.Dispute
): Promise<void> {
  const chargeId =
    typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;

  let purchaseId: string | null = null;
  let userId: string | null = null;

  if (chargeId && stripe) {
    try {
      const charge = await stripe.charges.retrieve(chargeId);
      const paymentIntentId =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id;

      if (paymentIntentId) {
        const purchase = await prisma.purchase.findFirst({
          where: { stripePaymentId: paymentIntentId },
        });
        if (purchase) {
          purchaseId = purchase.id;
          userId = purchase.userId;
          // Revoke access pending dispute resolution.
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: { downloadToken: null, updatedAt: new Date() },
          });
        }
      }
    } catch (error) {
      console.error('Failed to resolve dispute charge:', error);
    }
  }

  if (userId) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'purchase',
        resource: 'book',
        resourceId: purchaseId ?? undefined,
        metadata: {
          event: 'stripe.dispute.created',
          disputeId: dispute.id,
          amount: dispute.amount,
          currency: dispute.currency,
          reason: dispute.reason,
        },
        createdAt: new Date(),
      },
    });
  }
}

/**
 * Reconcile a pending Purchase by querying Stripe directly.
 *
 * Used as a fallback when the checkout.session.completed webhook is delayed,
 * lost, or arriving outside the success-page polling window. Safe to call
 * repeatedly — handlePaymentSuccess is idempotent.
 *
 * Returns the latest Purchase status after reconciliation (or null if the
 * purchase couldn't be looked up).
 */
export async function reconcilePendingPurchase(
  sessionId: string
): Promise<string | null> {
  if (!stripe) return null;

  const purchase = await prisma.purchase.findFirst({
    where: { stripeSessionId: sessionId },
  });
  if (!purchase) return null;

  // Already in a terminal state — nothing to reconcile.
  if (purchase.status !== 'pending') return purchase.status;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      await handlePaymentSuccess(sessionId);
      return 'completed';
    }

    if (session.status === 'expired') {
      await handlePaymentFailure(sessionId);
      return 'failed';
    }
  } catch (error) {
    // Don't break the calling page if Stripe is briefly unreachable.
    console.error('Reconciliation failed:', error);
  }

  return purchase.status;
}

/**
 * Verify download token and get book info for secure download
 */
export async function verifyDownloadToken(
  token: string
): Promise<{ bookId: string; cloudinaryPublicId: string; title: string } | null> {
  // 1. Find purchase by token
  const purchase = await prisma.purchase.findUnique({
    where: { downloadToken: token },
  });

  // 2. Check purchase exists and status is 'completed'
  if (!purchase || purchase.status !== 'completed') {
    return null;
  }

  // 3. Check download limit
  if (purchase.downloadCount >= purchase.maxDownloads) {
    return null;
  }

  // 4. Check token expiration
  if (purchase.tokenExpiresAt && purchase.tokenExpiresAt < new Date()) {
    return null;
  }

  // 5. Find book
  const book = await prisma.book.findUnique({
    where: { id: purchase.bookId },
  });

  // 6. Check book exists and isActive
  if (!book || !book.isActive) {
    return null;
  }

  // 7. Increment download count (only after all checks pass)
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      downloadCount: { increment: 1 },
    },
  });

  // 8. Return book info (public ID only — caller generates signed URL)
  return {
    bookId: book.id,
    cloudinaryPublicId: book.cloudinaryPublicId,
    title: book.title,
  };
}

/**
 * Get user's purchased books
 */
export async function getUserPurchases(userId: string) {
  const purchases = await prisma.purchase.findMany({
    where: {
      userId,
      status: 'completed',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Get book details for each purchase
  const bookIds = purchases.map((p) => p.bookId);
  const books = await prisma.book.findMany({
    where: {
      id: { in: bookIds },
    },
  });

  const bookMap = new Map(books.map((b) => [b.id, b]));

  return purchases.map((purchase) => ({
    ...purchase,
    book: bookMap.get(purchase.bookId),
  }));
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  if (!stripe) {
    return null;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return null;
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}

/**
 * Checkout session details for the success page
 */
export interface CheckoutSessionDetails {
  isPaid: boolean;
  cardInfo: { last4: string; brand: string } | null;
}

/**
 * Retrieve checkout session details from Stripe API (backend truth).
 * Expands payment_intent.payment_method to get card info.
 * Only returns minimal payment data (last4, brand) — never raw card numbers.
 */
export async function getCheckoutSessionDetails(
  sessionId: string
): Promise<CheckoutSessionDetails> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent.payment_method'],
  });

  const isPaid = session.payment_status === 'paid';

  // Extract minimal card info — only last 4 and brand
  let cardInfo: { last4: string; brand: string } | null = null;
  const paymentIntent = session.payment_intent;
  if (
    paymentIntent &&
    typeof paymentIntent === 'object' &&
    'payment_method' in paymentIntent
  ) {
    const pm = paymentIntent.payment_method;
    if (pm && typeof pm === 'object' && 'card' in pm && pm.card) {
      const card = pm.card as { last4?: string; brand?: string };
      cardInfo = {
        last4: card.last4 ?? '',
        brand: card.brand ?? '',
      };
    }
  }

  return {
    isPaid,
    cardInfo,
  };
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return stripe !== null;
}
