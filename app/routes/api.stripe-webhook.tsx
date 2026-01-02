import { ActionFunction, json } from '@remix-run/node';
import {
  verifyWebhookSignature,
  handlePaymentSuccess,
  handlePaymentFailure,
} from '~/utils/stripe.server';

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Get raw body for signature verification
  const payload = await request.text();

  // Verify webhook signature
  const event = verifyWebhookSignature(payload, signature);
  if (!event) {
    return json({ error: 'Invalid signature' }, { status: 400 });
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

    return json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
};

// Webhooks only use POST
export const loader = () => {
  return json({ error: 'Method not allowed' }, { status: 405 });
};
