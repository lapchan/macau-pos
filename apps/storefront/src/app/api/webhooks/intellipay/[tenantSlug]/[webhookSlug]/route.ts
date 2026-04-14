import { NextResponse } from "next/server";
import {
  db,
  tenants,
  tenantPaymentConfigs,
  payments,
  orders,
  intellipayWebhookEvents,
  verifyOutboundWebhook,
  eq,
  and,
} from "@macau-pos/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WebhookEnvelope = {
  event_id: string;
  event_type: string;
  created_at?: string;
  data?: {
    payment_id?: string;
    order_id?: string;
    status?: number;
    status_desc?: string;
    order_amount?: number;
    order_currency?: string;
  };
};

type RouteContext = {
  params: Promise<{ tenantSlug: string; webhookSlug: string }>;
};

function ok(body: string, status = 200) {
  return new NextResponse(body, { status });
}

export async function POST(req: Request, ctx: RouteContext) {
  const { tenantSlug, webhookSlug } = await ctx.params;

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);
  if (!tenant) return ok("not_found", 404);

  const [config] = await db
    .select()
    .from(tenantPaymentConfigs)
    .where(eq(tenantPaymentConfigs.tenantId, tenant.id))
    .limit(1);
  if (!config || config.webhookSlug !== webhookSlug) {
    return ok("not_found", 404);
  }

  // Read raw body once and hash as-is — must not re-serialize.
  const rawBody = await req.text();

  const rawKey = process.env.INTELLIPAY_OUTBOUND_PUBLIC_KEY;
  if (!rawKey) {
    console.error("[intellipay webhook] INTELLIPAY_OUTBOUND_PUBLIC_KEY not set");
    return ok("config_missing", 500);
  }
  // Some env loaders pass literal \n sequences — normalize to real newlines.
  const publicKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;

  const signatureHeader = req.headers.get("x-signature") ?? "";
  const timestamp = req.headers.get("x-timestamp") ?? "";
  const eventIdHeader = req.headers.get("x-event-id") ?? "";

  const verdict = verifyOutboundWebhook({
    rawBody,
    timestamp,
    eventId: eventIdHeader,
    signatureHeader,
    publicKeyPem: publicKey,
  });
  if (!verdict.ok) {
    console.warn(`[intellipay webhook] ${tenantSlug} rejected: ${verdict.reason}`);
    return ok(verdict.reason, 401);
  }

  let envelope: WebhookEnvelope;
  try {
    envelope = JSON.parse(rawBody);
  } catch {
    return ok("bad_json", 400);
  }

  const eventId = envelope.event_id ?? eventIdHeader;
  if (!eventId || !envelope.event_type) {
    return ok("missing_fields", 400);
  }

  // Dedupe on (tenant_id, event_id). Insert the audit row first; a unique
  // violation means we've already processed this event and can short-circuit
  // with 200 so intellipay stops retrying.
  try {
    await db.insert(intellipayWebhookEvents).values({
      tenantId: tenant.id,
      eventId,
      eventType: envelope.event_type,
      rawBody,
      status: "ok",
      receivedAt: new Date(),
    });
  } catch (err) {
    const pgCode =
      (err as { code?: string } | null)?.code ??
      (err as { cause?: { code?: string } } | null)?.cause?.code;
    if (pgCode === "23505") {
      return ok("duplicate_ok", 200);
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[intellipay webhook] ${tenantSlug} insert audit failed:`, msg);
    return ok("internal_error", 500);
  }

  // Project the event onto the payment row. Unknown event types are accepted
  // (2xx) and logged per spec §7.3.
  const orderId = envelope.data?.order_id;
  const status = envelope.data?.status;
  const statusDesc = envelope.data?.status_desc ?? null;

  if (!orderId) {
    await markEvent(eventId, tenant.id, "ok", "no order_id in envelope", null);
    return ok("ok", 200);
  }

  const [paymentRow] = await db
    .select({ id: payments.id, dbOrderId: payments.orderId })
    .from(payments)
    .where(eq(payments.intellipayOrderId, orderId))
    .limit(1);

  if (!paymentRow) {
    await markEvent(eventId, tenant.id, "ok", `payment not found for order_id=${orderId}`, null);
    return ok("ok", 200);
  }

  await db
    .update(payments)
    .set({
      intellipayStatus: status ?? null,
      intellipayStatusDesc: statusDesc,
      intellipayLastEventId: eventId,
      intellipayLastEventAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentRow.id));

  if (status !== undefined && status !== null) {
    const orderStatus = mapPaymentStatusToOrderStatus(status);
    if (orderStatus) {
      await db
        .update(orders)
        .set({ status: orderStatus })
        .where(and(eq(orders.id, paymentRow.dbOrderId), eq(orders.tenantId, tenant.id)));
    }
  }

  await markEvent(eventId, tenant.id, "ok", null, paymentRow.id);
  return ok("ok", 200);
}

async function markEvent(
  eventId: string,
  tenantId: string,
  status: "ok" | "error",
  errorMessage: string | null,
  paymentId: string | null,
) {
  await db
    .update(intellipayWebhookEvents)
    .set({
      status,
      errorMessage,
      paymentId,
      processedAt: new Date(),
    })
    .where(
      and(
        eq(intellipayWebhookEvents.tenantId, tenantId),
        eq(intellipayWebhookEvents.eventId, eventId),
      ),
    );
}

// Per spec §5.10 — terminal states only.
function mapPaymentStatusToOrderStatus(
  status: number,
): "completed" | "refunded" | "voided" | null {
  switch (status) {
    case 2: // paid (money captured)
    case 3: // notified
    case 4: // completed
      return "completed";
    case 10: // refunded
    case 11: // partially refunded
      return "refunded";
    case 5: // canceled
    case 6: // expired
    case 8: // failed
    case 13: // closed
      return "voided";
    default:
      return null;
  }
}
