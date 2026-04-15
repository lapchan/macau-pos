# Product Design Review — Storefront Checkout & Payment Flow

| Field | Value |
|---|---|
| **Project** | Macau POS — Storefront (checkout + intellipay integration) |
| **Scope** | Cart → Gate → Checkout → Intellipay hosted page → Confirmation → Resume/Cancel |
| **Reviewer** | Claude (Senior PM Review) |
| **Review date** | 2026-04-15 |
| **Overall verdict** | **🟡 Ship with fixes** — core flow is sound, several rough edges need a pass before we call this polished |

## Executive Summary

The checkout flow is functionally complete end-to-end: cart → login/guest gate → form → intellipay hosted page → return → polling confirmation, with a pending-payment bar and 20-min resume window gluing it together. The recent bug hunt (x-forwarded-host, cookie mutation in RSC) closed the last correctness issues in the multi-tenant path.

What remains is **polish** — the kind of rough edges a customer notices even when nothing is broken: the resume bar showing on the checkout page itself, a dead `paymentLabel` for the `simplepay`/`online` method the DB actually stores, fake fulfillment progress steps that lie about where the order really is, a 2-second flash of "Waiting for payment" on a confirmation page that could already know the answer, and the absence of an email receipt after a successful payment.

None of these block shipping to 853mask, but collectively they make the flow feel like a demo rather than a product.

## Severity Summary

| Severity | Count |
|---|---|
| 🔴 Blocker | 1 |
| 🟡 Major | 5 |
| 🔵 Minor | 6 |
| 💡 Suggestion | 4 |

---

## 🔴 Blockers

### B1 — `paymentLabel` map is out of sync with stored payment methods
**File:** `apps/storefront/src/app/[locale]/checkout/confirmation/page.tsx:71-81`

The confirmation page maps `order.paymentMethod` → display name with a hardcoded table: `mpay | alipay | wechat_pay | visa | mastercard | cash`. But `checkout-split.tsx` posts `paymentService ∈ { simplepay, mpay, alipay, wechat_pay }` to the order action, and intellipay returns raw method names on the callback. Any customer who picks "Pay with card" (simplepay) sees the literal string `simplepay` printed as their payment method on the receipt. `cash` is in the map but cash is never an online option — it's a cashier-app concept.

**Fix:** Source the label from a shared helper (`@macau-pos/database` enums + i18n) so the cashier, storefront, and emails all use the same labels. At minimum add `simplepay` → "Credit Card" and drop `cash`. Localize the labels while you're in there.

---

## 🟡 Major

### M1 — Pending-payment bar shows on the checkout and resume pages themselves
**File:** `apps/storefront/src/app/[locale]/layout.tsx:130`

`PendingPaymentBar` is mounted unconditionally in the locale layout. That means:
- On `/checkout`, a user who abandoned an earlier order sees a yellow "You have an unpaid order — Resume" bar *above* the form for their new order. Confusing: which one gets paid?
- On `/checkout/resume`, the same resume link appears twice — once in the bar, once as the page body.
- On `/checkout/confirmation?order=X`, if polling hasn't flipped status yet, the bar suggests the user still has an unpaid order... which is literally the one they're looking at.

**Fix:** Hide the bar on any path under `/checkout/*` and `/cart`. Easiest: read the pathname in a client wrapper, or pass an `hideOnCheckout` flag from each checkout route's layout. Alternative: suppress the bar when the cookie matches the current order in the URL.

### M2 — Fulfillment progress steps are fabricated
**File:** `apps/storefront/src/components/checkout/order-summary.tsx:241-246`

The confirmation page renders a 4-step progress bar: Order placed → Processing → Shipped → Delivered, with "Processing" hardcoded as the current step. This is theatre — the system does not know whether the order has been processed or shipped, and there is no fulfillment state machine backing these labels. A customer returning to their order 3 days later still sees "Processing (current)".

**Fix for now:** Drive the progress from actual order state — `pending → paid → fulfilled → delivered` mapped from `orders.status` plus whatever fulfillment data exists. If we don't have real fulfillment tracking yet, *remove* the progress bar entirely and show a simple "Order confirmed · <date>" block. Showing fake progress is worse than showing no progress.

### M3 — No email receipt on successful payment
**Scope:** entire checkout flow

Nothing in `clearCartAfterPayment`, `getOnlinePaymentStatus`, or the intellipay webhook sends an email. A guest who pays and closes the tab has no durable record of their order — no confirmation number, no itemization, no way to ask support about it. This is table stakes for any commerce site.

**Fix:** On transition to `completed` (ideally in the webhook, not the client poll), enqueue a transactional email with the order details. Needs an email provider decision (Postmark / Resend / SES) and a templated receipt layout. Treat it as a follow-up ticket, but it is a shipping gap for a real store.

### M4 — "Waiting for payment" flash on confirmation even when the answer is already known
**File:** `apps/storefront/src/components/checkout/payment-status-banner.tsx:84`, `confirmation/page.tsx:29-31`

`initialStatus` on the confirmation page is computed from the DB snapshot at page load. If the intellipay webhook hasn't fired yet (common — user returns from the hosted page faster than the server-to-server callback), `initialStatus` is `pending` and the client banner shows a 3×3px spinner saying "Waiting for payment confirmation…" for at least 2 seconds (the initial delay) + one poll round-trip. The confirmation page then re-renders green. On a slow network it's a 5-10s pending flash.

**Fix:** Do a server-side `getOnlinePaymentStatus` call in the page component (it already falls back to intellipay `queryPayment` with a 5s timeout). If that returns `completed`, pass `completed` as `initialStatus` and skip the banner entirely. Reserve polling for the genuinely ambiguous case. Also drop the 2-second `setTimeout` initial delay — poll immediately on mount.

### M5 — Hardcoded `city="Macau"` fallback leaks into every receipt
**File:** `apps/storefront/src/app/[locale]/checkout/confirmation/page.tsx:63`

```ts
city: shippingAddr.city || "Macau",
```

If the stored address has no city (delivery-zone-based addresses might not), the receipt prints "Macau" even for tenants that ship elsewhere. Same bias would hurt us the day we onboard a Hong Kong or Zhuhai tenant. The checkout form also defaults city to blank, so any address created without a city gets this fallback baked in.

**Fix:** Show the field only when present. Don't assume the tenant is in Macau — that's a per-tenant concern, not a codebase default.

---

## 🔵 Minor

### m1 — `order-summary.tsx` is `"use client"` for no reason
It renders static order data and a heroicons `<CheckIcon />`. No state, no effects, no interactivity. Makes it a client bundle on every confirmation page load. Drop the directive.

### m2 — `clearCartAfterPayment()` fire-and-forget from client on poll success
`payment-status-banner.tsx:74` does `void clearCartAfterPayment()`. If that server action throws (network flap, stale session), the cart stays populated and the next page load still shows items the user already paid for. The server-side path in `confirmation/page.tsx:34` handles the happy path but only when `initialStatus === "completed"`. Do it in `getOnlinePaymentStatus` when it observes the transition, not in the client.

### m3 — Retry link shows only for `voided`, not on poll error
When polling fails (network issue, intellipay 500), the banner sits there spinning forever. There's no user-visible error state and no retry affordance. Add an error toast with a "Refresh" button after N failed polls.

### m4 — No guest order lookup
A guest who paid and lost the tab has no way to find their order. At minimum, a `/orders/lookup?number=X&email=Y` page. Ties directly to M3 (email receipt).

### m5 — `paymentUrl` from banner can be stale
When the banner shows "retry payment" for a voided order, it uses `paymentUrl` fetched from the DB. Intellipay hosted URLs have a TTL; a click 30 minutes later likely errors on their side. Should regenerate via `resumePayment` flow rather than linking directly.

### m6 — Polling keeps running when the tab is hidden
`payment-status-banner.tsx` has no `document.visibilityState` gate. A user who backgrounds the tab keeps pinging `getOnlinePaymentStatus` every 3s, which hits intellipay every time the DB is still pending. Pause polling on `visibilitychange === "hidden"`, resume on "visible".

---

## 💡 Suggestions

### s1 — Countdown on the resume bar itself
The resume page shows a 20-min countdown, but the layout-level bar doesn't. A user who sees the bar on a product page has no idea how urgent it is. Show "13 min left" in the bar.

### s2 — Make the empty-cart-during-resume case a real page
If a user clicks "Resume payment" but their cart is now empty (they cleared it in another tab), the `resumePayment` action currently redirects to `/checkout`, which in turn redirects to `/cart` because cart is empty. That's a double-bounce with no explanation. A short interstitial page — "Your cart is empty, but your last order is still waiting. [Pay now] [Cancel it]" — would be clearer.

### s3 — Log intellipay response times to Grafana
The `getOnlinePaymentStatus` fallback has a 5s timeout. We have no visibility into how often we hit it, or how long intellipay typically takes. Add a histogram; put it next to the existing oncall latency dashboard.

### s4 — Consolidate the three order-summary variants
`order-summary.tsx` ships four visual variants (`with-progress`, `with-large-images`, `with-split-image`, `simple-full-details`). Only one is used. Delete the rest or move them to a Storybook-style gallery. Every line of dead code is a tax on the next refactor.

---

## What's Good (Worth Keeping)

- **Pending-order invariant is strong:** one `status='pending'` order per customer, enforced in `createOnlineOrder`. Clean concept.
- **Cart-vs-order comparison via `productId|variantId` map** in `resumePayment` — the right way to detect "customer changed their mind mid-pay".
- **Server action + nginx `x-forwarded-host`** handling is now correct for the multi-tenant loopback case (just fixed).
- **Two-phase loader** (payment form loading → redirect to hosted page) gives good feedback during the slow step.
- **5-locale copy is complete** on the banner and resume flows — this is ahead of most codebases at this stage.
- **Status-code mapping is centralized** (`intellipay-status.ts`) — easy to audit against intellipay docs.

---

## Recommended Fix Order

Before shipping to 853mask for real customers:
1. **B1** — fix paymentLabel (20 min) — receipts currently say "simplepay"
2. **M1** — hide pending bar on checkout routes (30 min)
3. **M2** — remove fake progress bar or wire it to real state (1 hr to remove, half a day to wire up)
4. **M4** — server-side status check before showing pending flash (1 hr)
5. **M5** — drop "Macau" city fallback (5 min)

Can follow in a second pass:
6. **M3** — email receipts (0.5–1 day incl. provider setup)
7. **m2, m3, m6** — polling hygiene
8. **s1, s2** — resume UX niceties

Everything else is backlog.
