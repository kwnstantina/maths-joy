# Stripe — What to Learn to Avoid Mistakes

Curated reading list and audit notes for this codebase's Stripe integration.
Grounded in the actual implementation in [app/utils/stripe.server.ts](app/utils/stripe.server.ts),
[app/routes/api.stripe-webhook.tsx](app/routes/api.stripe-webhook.tsx),
and [app/routes/books.checkout-success.tsx](app/routes/books.checkout-success.tsx).

> Status legend: ✅ already done · ⚠️ partial / risky · ❌ missing

---

## Tier 1 — Mental models that prevent the worst bugs

### 1. Webhooks are the source of truth. Redirects are not. ✅

We already do this right: the `success_url` triggers a polling page that
waits for `handlePaymentSuccess` via webhook. Internalize *why*: redirects
can be lost (network, closed tab, refund-after-redirect), webhooks are
retried for ~3 days. **Never grant entitlements in a `success_url` loader.**

→ Read: Stripe Docs → "Fulfillment" guide.

### 2. Idempotency at every layer. ⚠️

Three layers, three different mechanisms:

- **Outbound calls** (creating sessions, refunds): use the `Idempotency-Key`
  header. ❌ We don't currently set one on `stripe.checkout.sessions.create`
  in [app/utils/stripe.server.ts:106](app/utils/stripe.server.ts#L106) —
  if a user double-clicks "Buy" we can create two sessions and two pending
  Purchase rows.
- **Inbound webhooks**: Stripe will deliver the same event multiple times.
  `handlePaymentSuccess` checks `status: 'completed'` first
  ([app/utils/stripe.server.ts:152](app/utils/stripe.server.ts#L152)) — good,
  ⚠️ but the check + update is **not atomic**. Two webhooks arriving in
  parallel can both pass the check. Safer pattern: store `event.id` in a
  `ProcessedWebhookEvent` table with a unique constraint, or use Prisma's
  `updateMany({ where: { id, status: 'pending' } })` so the second update is
  a no-op.
- **API requests in general**: any retried Stripe call should reuse the same
  idempotency key.

→ Read: Stripe Docs → "Idempotent Requests" + "Handle duplicate events".

### 3. Webhook event ordering is not guaranteed.

`checkout.session.completed`, `payment_intent.succeeded`, and
`charge.succeeded` can arrive **in any order**. Don't write code that
assumes one fires before another. Always re-fetch state from Stripe rather
than chaining off event payloads.

### 4. Money is integer cents. ⚠️

We do `Math.round(book.price * 100)`
([app/utils/stripe.server.ts:74](app/utils/stripe.server.ts#L74)) — fine
for whole prices, but `Math.round(19.99 * 100)` = 1999 only because of luck
with binary representation. For currency math, **store cents in the DB as an
integer**. Don't store floats.

---

## Tier 2 — Things missing in our current code

### 5. Reconciliation / fallback poller. ❌

What if Stripe's webhook never reaches us (DNS hiccup, Vercel cold start
timeout > 30s, deploy during the event)? `books.checkout-success.tsx`
polls indefinitely
([app/routes/books.checkout-success.tsx:102](app/routes/books.checkout-success.tsx#L102)).
We need either:

- A cron that scans `Purchase { status: 'pending', createdAt: < now - 10min }`
  and calls `stripe.checkout.sessions.retrieve` to reconcile, **or**
- The success page itself reconciles after N polls fail.

### 6. Refunds and disputes. ❌

No handling for `charge.refunded`, `charge.dispute.created`,
`charge.dispute.closed`. If a refund is issued from the Stripe dashboard,
`Purchase.status` stays `completed` and the user keeps download access.

At minimum:

- Revoke `downloadToken` on refund.
- Alert on disputes (chargebacks cost €15+ each).

### 7. Price drift between DB and Stripe. ⚠️

We cache `stripePriceId` on the Book
([app/utils/stripe.server.ts:58](app/utils/stripe.server.ts#L58)). If an
admin updates `book.price` in our DB, **Stripe still charges the old price**.

Either:
- Invalidate `stripePriceId` whenever `book.price` changes, or
- Use `price_data` inline in `line_items` and skip caching prices entirely.

Option (b) is simpler for a low-volume catalog.

### 8. `payment_intent.payment_failed` is a log statement. ⚠️

Currently just `console.log`
([app/routes/api.stripe-webhook.tsx:51](app/routes/api.stripe-webhook.tsx#L51)).
We're losing analytics + we have no way to email the user "your card
declined." Decide whether we care; if yes, mark the Purchase failed *and*
notify the user.

### 9. Wallets (Apple Pay / Google Pay / Link). ⚠️

We hardcode `payment_method_types: ['card']`
([app/utils/stripe.server.ts:108](app/utils/stripe.server.ts#L108)).
**Drop that key entirely** and Stripe will auto-enable wallets configured
in our dashboard. Higher conversion, zero code.

---

## Tier 3 — Operational discipline

### 10. Stripe CLI for webhook dev.

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
stripe trigger checkout.session.completed
```

Non-negotiable for testing — don't push to prod and hope.

### 11. Test mode vs live mode keys.

Separate `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` per environment.

- Test keys start with `sk_test_`
- Live keys start with `sk_live_`

**Never share a webhook endpoint between modes** — signatures use different
secrets.

### 12. API version pinning + upgrade hygiene. ✅

We pin `'2025-02-24.acacia'` ✓
([app/utils/stripe.server.ts:12](app/utils/stripe.server.ts#L12)). When
upgrading: read the changelog, test in test mode, then bump. Don't blindly
`npm update stripe`.

### 13. Metadata limits.

- 50 keys max
- 500 chars per value
- 8 KB total per object

We pass `purchaseId, bookId, userId, downloadToken` (64 hex chars) — fine,
but know the ceiling.

### 14. PCI scope. ✅

Because we use **Stripe Checkout** (hosted page) we're in **SAQ A** scope —
the easiest tier. The moment we collect card numbers in our own form, we
jump to SAQ A-EP and need a quarterly ASV scan.

**Stay on Checkout or Payment Element; never roll our own card form.**

### 15. Tax (`automatic_tax: true`). ⚠️

We've enabled it
([app/utils/stripe.server.ts:117](app/utils/stripe.server.ts#L117)) but
**Stripe Tax requires us to register in jurisdictions**. For a Greek-resident
seller selling digital books to EU customers, we need OSS registration.

This is a *legal* obligation, not a Stripe one — check before shipping to
live mode.

---

## Tier 4 — Worth knowing eventually

- **Customers**: create a `Customer` object per user (we currently pass
  `customer_email: undefined`). Lets us reuse cards, see purchase history
  per user in dashboard, and is required for subscriptions.
- **Subscriptions / `mode: 'subscription'`** if we ever add a "premium
  membership" tier.
- **Stripe Radar** for fraud rules.
- **`expand` parameter** — we use it correctly in
  `getCheckoutSessionDetails`
  ([app/utils/stripe.server.ts:334](app/utils/stripe.server.ts#L334)).
  Know it exists for any retrieve call.
- **Webhooks: ≤30s response time**, otherwise Stripe retries and we risk
  dupes. Push slow work to a queue.
- **Connect** — only relevant if we ever pay third parties (e.g., other
  authors). Different product entirely.

---

## Suggested reading order

1. Stripe Docs → **Fulfillment guide** (cements webhook-as-source-of-truth)
2. Stripe Docs → **Handle duplicate events** + **Idempotent requests**
3. Stripe CLI quickstart — start using it locally
4. Stripe Docs → **Disputes** and **Refunds**
5. *Patterns of Distributed Systems* by Unmesh Joshi — chapter on idempotent
   receivers (general, but Stripe-applicable)
6. Stripe blog → "Designing robust and predictable APIs with idempotency"

---

## Quick audit summary

| # | Area | Status | Priority |
|---|------|--------|----------|
| 1 | Webhook = source of truth | ✅ | — |
| 2 | Idempotency on outbound calls | ❌ | High |
| 2 | Idempotency on inbound webhooks | ⚠️ race | High |
| 3 | Event ordering assumptions | ✅ | — |
| 4 | Money as integer cents | ⚠️ float in DB | Medium |
| 5 | Reconciliation poller | ❌ | High |
| 6 | Refund / dispute handling | ❌ | High |
| 7 | Price drift | ⚠️ | Medium |
| 8 | `payment_failed` notifications | ⚠️ log only | Medium |
| 9 | Wallets enabled | ⚠️ card-only | Low (easy win) |
| 10 | Stripe CLI workflow | — | adopt |
| 11 | Test/live key separation | ✅ assumed | — |
| 12 | API version pinned | ✅ | — |
| 13 | Metadata limits | ✅ | — |
| 14 | PCI scope (SAQ A) | ✅ | — |
| 15 | EU tax / OSS registration | ⚠️ legal | check before live |
