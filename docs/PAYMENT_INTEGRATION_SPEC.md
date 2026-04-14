# Retailai ↔ Simpaylicity Integration Spec (v1)

## 1. Context

**Retailai** is a multi-tenant SaaS with two payment channels that both route through simpaylicity:

- **Online (storefront)** — customer-facing web checkout. Retailai's storefront owns its own checkout page (address, shipping, line-items review). At the "Place Order" step, retailai hands off only the payment portion to simpaylicity, which shows the shopper a hosted payment page, captures funds, and redirects back. Shape is analogous to **PayPal Checkout**: our page → their payment page → our confirmation page.
- **In-person (POS / cashier terminal)** — staff-facing register. The cashier app rings up an order and asks simpaylicity to charge it in person, either by displaying a QR code for the customer to scan (Alipay / WeChat Pay / FPS / UnionPay QR) or by driving a paired physical card reader.

Both channels use the **same simpaylicity merchant account** per retailai tenant. Each retailai tenant is a separate shop with its own independent simpaylicity merchant account — no sub-merchant hierarchy; tenants sign up with simpaylicity directly.

PCI scope stays with simpaylicity. Retailai never sees card or account data.

## 2. Credentials

Per retailai tenant, issued once by simpaylicity and stored in retailai's DB (secrets encrypted at rest):
- `merchant_id`
- `access_key_id`
- `secret_key`

One credential pair covers both online and in-person payments for that tenant. Sandbox and production have independent credentials.

Physical card readers (if the tenant uses them) are registered with simpaylicity out of band and referenced by `terminal_id` in in-person requests.

## 3. Request conventions (all server → simpaylicity calls)

- `Authorization: Bearer <access_key_id>`
- `X-Timestamp: <unix ms>` — reject if skew > 5 min
- `X-Signature: hmac-sha256(timestamp + "." + raw_body, secret_key)` — hex lowercase
- `Idempotency-Key: <uuid>` on all create/refund calls — same key within 24h returns the original response
- `Content-Type: application/json`

Responses: JSON. Errors `{ error: { code, message, details? } }`. Rate-limit headers on every response.

## 4. Capabilities retailai needs simpaylicity to expose

Simpaylicity owns the endpoint URLs, request/response shapes, and error enumerations — please publish a detailed API doc covering the following. Retailai will consume whatever you define.

### 4.1 Online hosted checkout (storefront)
- **Create checkout session** — accepts retailai's order reference, amount (minor units), currency, customer info, **line items (required, must sum to amount)**, locale, `return_url`, `cancel_url`, `webhook_url`, expiry, and metadata blob. Returns a hosted `checkout_url` for retailai to redirect the browser to. Shopper does not pick a method on retailai's side — they pick on your hosted page from whatever the merchant has enabled.
- **Return URL contract** — after payment (success or cancel), redirect the shopper back to retailai with only `?session_id=...`. No status in query string (prevents tampering). Retailai calls the status endpoint for authoritative state.

### 4.2 In-person payments (POS)
- **Create in-person payment** — accepts reference, amount, currency, **line items (required)**, `method_type` = `qr` or `terminal`, optional `terminal_id`, expiry, metadata. Returns either a QR payload (image URL + string) for the cashier to display, or a processing handle when a physical reader is being driven.
- **Polling-friendly status** — the POS will poll the shared status endpoint (§4.3) every ~1s until terminal state; needs to be cheap and consistent.
- **Cancel pending in-person payment** — idempotent; 409 if already paid.

### 4.3 Shared across both channels
- **Unified status lookup** by payment id (accepts both online session ids and in-person payment ids) — returns channel, status, amount, amount_refunded, currency, method, provider transaction id, timestamps, and failure reason if any.
- **Refunds** — full and partial; retailai supplies its own `reference` for idempotency. Works for both online and in-person payments.
- **Refund status lookup**.
- **Cancel pending checkout session** (storefront abandonment).
- **Merchant info** *(optional)* — returns display name, currencies, and enabled methods split by channel (`online` / `in_person`) so retailai can render method logos on cart/checkout and the POS payment selector. Purely cosmetic.

### 4.4 Webhooks (simpaylicity → retailai)
- **Single master webhook URL per retailai environment**, shared across both channels and all retailai tenants. Each event payload carries `merchant_id` so retailai routes to the correct tenant before verifying the signature with that tenant's `secret_key`.
- **Signature header** over timestamp + raw body (HMAC-SHA256), version-tagged.
- **Event id header** for retailai-side dedupe.
- **Retries**: exponential backoff up to ~24h until `2xx`. HTTP status is the only contract — no magic strings in the body.
- **Events needed**: online checkout session (completed / failed / expired / canceled), in-person payment (completed / failed / expired / canceled), refund (succeeded / failed), merchant status changed.
- **Payload** must include the same fields as the status endpoint plus retailai's `metadata` echoed back.
- **Ordering**: status transitions are monotonic; stale events after a terminal state must be safe for retailai to ignore.

### 4.5 Environments & test harness
- **Sandbox** and **production** with independent credentials and a clearly documented base URL for each.
- Sandbox must expose a **mock provider** that can exercise every terminal state on demand (paid, failed, expired, canceled, refunded) for both channels, with documented test QR payloads, test cards, and test terminal flows.

### 4.6 Error model
- Enumerated top-level error codes retailai can map to user-facing messages, covering at minimum: auth, signature, timestamp skew, idempotency conflict, merchant not found/suspended, currency/amount/line-item validation, reference collision, session/payment not found, already paid, already refunded, refund exceeds, terminal offline/busy, method not enabled, rate limited, upstream provider error, internal error.

## 5. Out of scope for v1

- Saved cards / tokenized customers
- Subscriptions / recurring
- Payouts / settlement reporting API
- Disputes / chargebacks
- Retailai-initiated merchant provisioning (tenants sign up directly with simpaylicity)
- Physical-terminal provisioning via API (done on simpaylicity's dashboard for v1)
- Popup / embedded storefront checkout (v1 uses full redirect)
- Tip adjustment, split tender, partial captures
