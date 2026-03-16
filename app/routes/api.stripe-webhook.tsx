import type { ActionFunction } from '@remix-run/node';
import {
  verifyWebhookSignature,
  handlePaymentSuccess,
  handlePaymentFailure,
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
        // Payment failed - could log for analytics
        console.log('Payment failed:', event.data.object.id);
        break;
      }

      default:
        // Unhandled event type - that's okay
        console.log(`Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return jsonResponse({ error: 'Webhook handler failed' }, 500);
  }
};

// Webhooks only use POST
export const loader = () => {
  return jsonResponse({ error: 'Method not allowed' }, 405);
};
