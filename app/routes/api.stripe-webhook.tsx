import type { ActionFunction } from '@remix-run/node';
import {
  verifyWebhookSignature,
  handlePaymentSuccess,
  handlePaymentFailure,
  handlePaymentIntentFailed,
  handleChargeRefunded,
  handleDisputeCreated,
} from '~/utils/stripe.server';

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return jsonResponse({ error: 'Missing stripe-signature header' }, 400);
  }

  // Get raw body for signature verification
  const payload = await request.text();

  // Verify webhook signature
  const event = verifyWebhookSignature(payload, signature);
  if (!event) {
    return jsonResponse({ error: 'Invalid signature' }, 400);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.payment_status === 'paid') {
          await handlePaymentSuccess(session.id);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        await handlePaymentFailure(session.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        await handlePaymentIntentFailed(event.data.object);
        break;
      }

      case 'charge.refunded': {
        await handleChargeRefunded(event.data.object);
        break;
      }

      case 'charge.dispute.created': {
        await handleDisputeCreated(event.data.object);
        break;
      }

      default:
        // Unhandled event type — log at debug level only.
        // Stripe fires many events we don't subscribe to; this isn't a problem.
        console.log(`Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true });
  } catch (error) {
    // Returning 500 causes Stripe to retry — desirable for transient failures.
    // Stripe retries with exponential backoff for up to ~3 days.
    console.error('Webhook handler error:', { eventId: event.id, type: event.type, error });
    return jsonResponse({ error: 'Webhook handler failed' }, 500);
  }
};

// Webhooks only use POST
export const loader = () => {
  return jsonResponse({ error: 'Method not allowed' }, 405);
};
