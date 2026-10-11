# Greg AI Credit Packs — Implementation Plan

**Status:** Backlog (not yet a roadmap phase). Promote via `/gsd-review-backlog` or `/gsd-phase` when ready.
**Depends on:** the uncommitted cost-accounting work (`GregDailyUsage.spend`, `costUnits()`, `CHAT_DAILY_SPEND_BUDGET`, `recordTokenUsage()`) being committed and the backfill run.
**Goal:** When a student exhausts the free daily allowance, they (or a parent) can buy a one-time pack of extra Greg AI usage through the existing Stripe Checkout flow. Purchased credits roll over across days.

## Design summary

- Free tier unchanged: 50 msgs **and** 300k spend units per UTC day (`CHAT_DAILY_LIMIT`, `CHAT_DAILY_SPEND_BUDGET`).
- Paid credits stored in **spend units** (same unit as `costUnits()`; 1,000,000 units = $1 of Haiku 4.5 cost) so margin is fixed regardless of message length. UI shows an approximate message count.
- Order of consumption: free daily budget first, then paid balance.
- Paid users bypass the 50-msg cap but hit a hard ceiling (`CHAT_PAID_HARD_DAILY_LIMIT = 300`) to bound abuse/runaway scripts.
- One-time `mode: 'payment'` Checkout — no subscriptions.

## 1. Schema (`prisma/schema.prisma`)

```prisma
model GregCreditBalance {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  userId    String   @unique @db.ObjectId
  balance   Int      @default(0)   // spend units; may go negative after a refund claw-back
  updatedAt DateTime @db.Date
}

model GregCreditPurchase {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  userId          String   @db.ObjectId
  packId          String                  // key into GREG_CREDIT_PACKS
  units           Int                     // spend units granted
  amount          Float                   // price charged
  currency        String
  status          String   @default("pending") // pending | completed | failed | refunded | disputed
  stripeSessionId String   @unique        // idempotency anchor for crediting
  stripePaymentId String?
  createdAt       DateTime @db.Date
  updatedAt       DateTime @db.Date
  @@index([userId])
  @@index([stripePaymentId])
}
```

Notes:
- Separate balance collection (not a field on `User`) keeps the hot conditional-update path off the User document and avoids touching auth code.
- `Purchase` stays book-only; do **not** make `bookId` optional — it would ripple through download-token code.
- Run `npm run prisma:generate && npm run prisma:push` (creates unique indexes). No backfill needed — new collections.

## 2. Pack definitions (`app/utils/gregCredits.server.ts`, new)

```ts
export const GREG_CREDIT_PACKS = {
  small: { units: 1_500_000, price: 2.99, currency: "eur", approxMessages: 250 },
  large: { units: 4_000_000, price: 6.99, currency: "eur", approxMessages: 700 },
} as const;
export type GregCreditPackId = keyof typeof GREG_CREDIT_PACKS;
export function isGregCreditPackId(v: unknown): v is GregCreditPackId;
```

- Prices are server constants; client sends only `packId`. Never trust a client amount.
- `approxMessages` derived from observed average `spend`/message — verify against real `GregDailyUsage` data before launch (`totalSpend / totalCount` over the last 2 weeks) and adjust.
- Margin check: €2.99 − Stripe fee (~€0.30) − ~$1.50 model cost ≈ 40%. Revisit if Phase 9 model tiering routes to a pricier model (cost units must then be weighted per model in `costUnits()`).
- Use inline `price_data` in Checkout (no stored Stripe Price IDs needed); `automatic_tax: { enabled: true }` like books, with a digital-services tax code.

## 3. Checkout (`app/utils/stripe.server.ts` + new route)

**`createGregCreditCheckoutSession({ userId, packId, successUrl, cancelUrl })`** in `stripe.server.ts`:
1. Look up pack; throw on unknown id.
2. Reuse an open session for the same user+pack created in the last 5 min (mirror the book double-click guard).
3. Create Stripe session with `idempotencyKey = greg-credits:${userId}:${packId}:${minuteBucket}`.
4. Metadata on session **and** `payment_intent_data.metadata`: `{ kind: "greg_credits", userId, packId }`.
5. Create `GregCreditPurchase` (status `pending`, `stripeSessionId = session.id`). Create the row *after* the session so `stripeSessionId` is non-null for the unique index.

**Route `app/routes/greg-credits.tsx`** (page + action):
- Loader: `requireUserId`, return packs, current balance, CSRF token. `handle = { i18n: ["common"] }`.
- Action: `requireCSRFToken` → `applyRateLimit(request, "api", userId)` → `isGregCreditPackId` → `logAuditEvent({ action: "purchase", resource: "greg_credits" })` → redirect to `session.url`.
- Gate on `isGregAiEnabled()` and `isStripeConfigured()`.

**Route `app/routes/greg-credits.success.tsx`**: mirror `books.checkout-success.tsx` — call `reconcileGregCreditPurchase(sessionId)` so the balance appears even if the webhook is late.

## 4. Webhook discrimination (`app/routes/api.stripe-webhook.tsx`)

Branch on `metadata.kind` before calling book handlers:

```ts
case "checkout.session.completed": {
  const s = event.data.object;
  if (s.payment_status !== "paid") break;
  if (s.metadata?.kind === "greg_credits") await handleGregCreditSuccess(s.id);
  else await handlePaymentSuccess(s.id);
  break;
}
```

Same for `checkout.session.expired` (→ mark `failed`), `payment_intent.payment_failed` (PI metadata `kind`). Also handle `checkout.session.async_payment_succeeded` for SEPA if enabled in the dashboard.
Existing book handlers stay untouched; books keep working because their metadata has no `kind`.

## 5. Idempotent crediting (`gregCredits.server.ts`)

`handleGregCreditSuccess(sessionId)`:
1. Retrieve session from Stripe; require `payment_status === "paid"`.
2. Atomic transition: `gregCreditPurchase.updateMany({ where: { stripeSessionId, status: "pending" }, data: { status: "completed", stripePaymentId, updatedAt } })`.
3. If `count === 0` → already credited (retry / reconcile race) → return.
4. Otherwise `gregCreditBalance.upsert({ where: { userId }, create: { balance: units }, update: { balance: { increment: units } } })`.
5. `logAuditEvent` with `{ event: "greg_credits.granted", packId, units, sessionId }`.

Crash window between steps 2 and 4: wrap both in `prisma.$transaction([...])` (Atlas is a replica set, so Mongo transactions work). If a transaction can't be used, add a `credited: Boolean` flag and a reconcile sweep.

## 6. Spending credits (`gregChat.prisma.ts` + `api.greg-ai.tsx`)

Extend `incrementDailyUsage` result with `paidBalance` and change the gate:

```
count > CHAT_PAID_HARD_DAILY_LIMIT            → blocked, reason "hard_cap"
free allowance remaining (count ≤ 50 && spend < budget) → allowed, billing: "free"
else paid balance > 0                          → allowed, billing: "paid"
else                                           → blocked, reason "messages" | "spend", canBuy: true
```

`recordTokenUsage(userId, usage, billing)`:
- Always increments the daily row (reporting).
- If `billing === "paid"` — or the free budget was crossed during this exchange — debit the paid portion:
  `gregCreditBalance.updateMany({ where: { userId, balance: { gte: 1 } }, data: { balance: { decrement: units } } })`.
  Conditional on positive balance so two tabs can't both start on the last credit; the final exchange may overshoot to slightly negative (bounded by `MAX_OUTPUT_TOKENS`) — acceptable, same rationale as the existing free-budget overshoot.
- Split the bill when an exchange straddles the free budget: `paidPortion = max(0, spendAfter − CHAT_DAILY_SPEND_BUDGET) − max(0, spendBefore − CHAT_DAILY_SPEND_BUDGET)`.
- 429 body becomes `{ error: "daily_limit_reached", reason, canBuy }`. `hard_cap` → `canBuy: false`.

## 7. Refunds & disputes

- `handleChargeRefunded`: after the existing book lookup misses, look up `GregCreditPurchase` by `stripePaymentId`. Set `status: "refunded"` (only from `completed`) and `decrement` balance by `units` (allowed to go negative — a negative balance simply blocks paid usage until topped up). Partial refunds: claw back proportionally `units * amount_refunded / amount`.
- `handleDisputeCreated`: same lookup; set `status: "disputed"`, claw back units, write `AuditLog` (`resource: "greg_credits"`).
- Both must be idempotent: guard with `where: { status: "completed" }` on the status transition and only decrement when `count === 1`.

## 8. Audit logging (`app/utils/audit.server.ts`)

- Add `"greg_credits"` to `AuditResource`.
- Events: checkout started (route action), granted (webhook), refunded, disputed. Store `packId`, `units`, `sessionId`, amount.

## 9. Widget upsell (`components/gregAi/gregAiWidget.tsx`)

- On 429 with `canBuy: true`: replace the "come back tomorrow" text with the limit message plus a **"Get more messages"** link to `/greg-credits` (opens in same tab; the chat session persists server-side).
- Show a small balance chip in the header when `paidBalance > 0` ("≈ 120 extra messages left"), from the `done` event payload (add `paidBalance` to it) or a loader value.
- `hard_cap` keeps the current copy with no buy link.

i18n keys (both `public/locales/el/common.json` and `en/common.json`, symmetric):
```
gregAi.limitReachedCanBuy   "You've used today's free messages. Get more to keep going, or come back tomorrow."
gregAi.buyMoreCta           "Get more messages"
gregAi.creditsLeft          "≈ {{count}} extra messages left"
gregAi.hardCapReached       "That's a lot of maths for one day! Take a break and come back tomorrow."
gregCredits.title / .subtitle / .packSmall / .packLarge / .approxMessages / .buy
gregCredits.success / .pending / .balance / .parentNotice / .errors.*
```

## 10. Open question — minors & parental consent (decide before build)

Most users are Gymnasio/Lykeio students. Options:
1. **Any logged-in user can buy** (simplest; Stripe Checkout requires a card, which in practice means a parent). Add `gregCredits.parentNotice` copy: "Ask a parent or guardian before buying."
2. **Parent-email confirmation**: purchase link emailed to a parent address; only the parent completes Checkout.
3. **Adults-only checkout**: age gate on `UserProfile` (no DOB stored today → schema change).

Recommendation: option 1 for v1 with explicit parent notice + clear refund policy, then check with an accountant/lawyer on Greek/EU rules (digital content, consumer withdrawal right — Checkout should capture consent to immediate delivery to waive the 14-day withdrawal right via `consent_collection` / custom text).

## 11. Testing

Local:
1. `stripe login` then `stripe listen --forward-to localhost:3000/api/stripe-webhook`; put the printed `whsec_…` in `STRIPE_WEBHOOK_SECRET`.
2. Buy each pack with test card `4242 4242 4242 4242` → balance increases exactly once.
3. `stripe events resend <evt_id>` for the completed event → balance unchanged (idempotency).
4. Hit success page before the webhook (stop `stripe listen`) → reconcile path credits; restart listener → no double credit.
5. Exhaust free budget (temporarily set `CHAT_DAILY_SPEND_BUDGET = 1000`) → next message billed to balance; verify straddle split.
6. Two tabs on last credits → at most one bounded overshoot.
7. Refund from Stripe dashboard (full and partial) → balance clawed back; dispute via test card `4000 0000 0000 0259`.
8. Buy a book afterwards → book flow unaffected (no `kind` metadata).
9. `npm run typecheck && npm run lint`.

## 12. Ordered tasks / rollout

1. Commit cost-accounting work; run `prisma:push` + `prisma:backfill-greg-usage` in prod.
2. Collect 1–2 weeks of real `spend` data → finalize pack sizes and `approxMessages`.
3. Resolve the minors/consent question (§10).
4. Schema + `gregCredits.server.ts` (packs, balance helpers, success/reconcile/refund handlers). `prisma:push`.
5. Webhook discrimination + refund/dispute branches; deploy **before** the UI so no session can be created without a handler.
6. Checkout + success routes, audit resource.
7. Quota gate + split billing in `incrementDailyUsage` / `recordTokenUsage`.
8. Widget upsell + balance chip + i18n keys.
9. Feature-flag the buy link (`featureFlags.server.ts`, e.g. `GREG_CREDITS_ENABLED`) — ship dark, test in prod with Stripe test mode keys on a preview deploy, then enable.
10. Add `checkout.session.async_payment_succeeded` to the webhook endpoint's subscribed events in the Stripe dashboard if SEPA is on.
