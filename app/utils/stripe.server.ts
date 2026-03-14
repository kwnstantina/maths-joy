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
 * Create a Stripe checkout session for purchasing a book
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

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
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
    customer_email: undefined, // Will be filled by user
  });

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
 * Handle successful payment webhook
 */
export async function handlePaymentSuccess(
  sessionId: string
): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  // Idempotency: check if already processed
  const existingPurchase = await prisma.purchase.findFirst({
    where: { stripeSessionId: sessionId, status: 'completed' },
  });
  if (existingPurchase) return; // Already fulfilled — safe to return

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

  // Update purchase status
  await prisma.purchase.update({
    where: { id: purchaseId },
    data: {
      status: 'completed',
      stripePaymentId: session.payment_intent as string,
      tokenExpiresAt,
      updatedAt: new Date(),
    },
  });
}

/**
 * Handle payment failure webhook
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
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'failed',
      },
    });
  }
}

/**
 * Verify download token and get book download URL
 */
export async function verifyDownloadToken(
  token: string
): Promise<{ bookId: string; cloudinaryUrl: string; title: string } | null> {
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

  // 8. Return book info
  return {
    bookId: book.id,
    cloudinaryUrl: book.cloudinaryUrl,
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
  purchaseId: string | null;
  bookId: string | null;
  downloadToken: string | null;
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
    purchaseId: session.metadata?.purchaseId ?? null,
    bookId: session.metadata?.bookId ?? null,
    downloadToken: session.metadata?.downloadToken ?? null,
    cardInfo,
  };
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return stripe !== null;
}
