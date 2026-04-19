"use server";

import {
  db,
  orders,
  orderItems,
  payments,
  products,
  productVariants,
  tenantPaymentConfigs,
  terminals,
  createMpqrPayment,
  createCpmPayment as ipCreateCpmPayment,
  cancelPayment,
  queryPayment,
  eq,
  and,
  sql,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";

// Webhook URL the cashier tells Intellipay to call. Webhook handler lives in
// the storefront app, so we need a public URL that routes there. Prefer an
// explicit env var; fall back to constructing the tenant subdomain.
function buildWebhookUrl(tenantSlug: string, webhookSlug: string): string {
  const base = process.env.INTELLIPAY_WEBHOOK_BASE_URL?.replace(/\/+$/, "");
  if (base) {
    return `${base}/api/webhooks/intellipay/${tenantSlug}/${webhookSlug}`;
  }
  const platform = process.env.PLATFORM_DOMAIN || "hkretailai.com";
  return `https://${tenantSlug}.store.${platform}/api/webhooks/intellipay/${tenantSlug}/${webhookSlug}`;
}

type PrePaymentOrder = {
  id: string;
  orderNumber: string;
  total: string;
  currency: string;
  status: string;
  terminalId: string | null;
};

// Load a pre-payment order and confirm it's still in "new" status. Callers
// that have just received an intellipay error want to keep the order at "new"
// so the cashier can pick another method without reopening the modal.
async function loadPrePaymentOrder(
  orderId: string,
  tenantId: string,
): Promise<
  | { ok: true; order: PrePaymentOrder }
  | { ok: false; error: string }
> {
  const [row] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      currency: orders.currency,
      status: orders.status,
      terminalId: orders.terminalId,
    })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
    .limit(1);
  if (!row) return { ok: false, error: "Order not found." };
  if (row.status !== "new") {
    return { ok: false, error: `Order is ${row.status}, cannot start payment.` };
  }
  return { ok: true, order: row };
}

export type InitiateMpmPaymentResult =
  | {
      success: true;
      paymentId: string;
      intellipayPaymentId: string;
      qrCodeDataUrl: string;
      qrCodeContent: string;
      expiresAt: string | null;
    }
  | { success: false; error: string };

export async function initiateMpmPayment(
  orderId: string,
  paymentService: string,
): Promise<InitiateMpmPaymentResult> {
  try {
    const session = await getAuthSession();
    if (!session?.tenantId || !session.locationId) {
      return { success: false, error: "No active session. Please log in." };
    }
    if (!session.terminalId || !session.tenantSlug) {
      return { success: false, error: "Terminal not activated." };
    }
    const tenantId = session.tenantId;
    const tenantSlug = session.tenantSlug;
    const terminalId = session.terminalId;

    const loaded = await loadPrePaymentOrder(orderId, tenantId);
    if (!loaded.ok) return { success: false, error: loaded.error };
    const order = loaded.order;

    const [paymentConfig] = await db
      .select()
      .from(tenantPaymentConfigs)
      .where(eq(tenantPaymentConfigs.tenantId, tenantId))
      .limit(1);

    if (
      !paymentConfig ||
      !paymentConfig.intellipayEnabled ||
      !paymentConfig.accessKeyId ||
      !paymentConfig.privateKeyPemEncrypted ||
      !paymentConfig.webhookSlug
    ) {
      return {
        success: false,
        error: "Intellipay is not configured for this tenant.",
      };
    }

    // Intellipay's terminal_id is the merchant-side terminal code. We use the
    // local terminal.code, which must match what's registered with Intellipay
    // during provisioning.
    const [terminalRow] = await db
      .select({ code: terminals.code })
      .from(terminals)
      .where(eq(terminals.id, terminalId))
      .limit(1);
    if (!terminalRow) {
      return { success: false, error: "Terminal record not found." };
    }

    const webhookUrl = buildWebhookUrl(tenantSlug, paymentConfig.webhookSlug);
    const totalNum = Number(order.total);
    const amountCents = Math.round(totalNum * 100);

    const ipResult = await createMpqrPayment(
      {
        accessKeyId: paymentConfig.accessKeyId,
        privateKeyPemEncrypted: paymentConfig.privateKeyPemEncrypted,
      },
      {
        order_id: order.orderNumber,
        order_amount: amountCents,
        order_currency: order.currency,
        subject: `Order ${order.orderNumber}`,
        payment_service: paymentService || "simplepay",
        terminal_id: terminalRow.code,
        webhook_url: webhookUrl,
        ...(paymentConfig.merchantId ? { merchant_id: paymentConfig.merchantId } : {}),
        ...(paymentConfig.operatorId ? { operator_id: paymentConfig.operatorId } : {}),
      },
      { idempotencyKey: randomUUID() },
    );

    if (!ipResult.ok) {
      console.error("[initiateMpmPayment] intellipay failed", {
        code: ipResult.errorCode,
        type: ipResult.errorType,
        message: ipResult.message,
        requestId: ipResult.requestId,
      });
      // Order stays at "new" so the cashier can pick another method.
      return {
        success: false,
        error: `Payment gateway error: ${ipResult.message}`,
      };
    }

    // Intellipay returns either qr_code_content (EMVCo raw string) or
    // qr_code_url (a deep-link URL like https://aas.bocmacau.com/w/d?q=...).
    // Both are data to be encoded *into* a QR image — never an image URL —
    // so always render server-side via the qrcode lib into a data URL the
    // client can drop into <img src={}>.
    const qrContent = ipResult.data.qr_code_content ?? ipResult.data.qr_code_url ?? "";
    if (!qrContent) {
      return { success: false, error: "Intellipay returned no QR content." };
    }
    const qrCodeDataUrl = await QRCode.toDataURL(qrContent, { width: 384, margin: 1 });

    // Gateway has the order under control now — flip to "pending" and attach
    // the payment row in one transaction.
    const payment = await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({ status: "pending" })
        .where(eq(orders.id, order.id));

      const [row] = await tx
        .insert(payments)
        .values({
          orderId: order.id,
          method: "qr",
          amount: totalNum.toFixed(2),
          provider: "intellipay",
          intellipayPaymentId: ipResult.data.payment_id,
          intellipayOrderId: ipResult.data.order_id ?? order.orderNumber,
          intellipayPaymentService:
            ipResult.data.payment_service ?? paymentService ?? null,
          intellipayTerminalId: ipResult.data.terminal_id ?? terminalRow.code,
          intellipayStatus: ipResult.data.status ?? null,
          intellipayStatusDesc: ipResult.data.status_desc ?? null,
          intellipayQrCodeUrl: ipResult.data.qr_code_url ?? null,
          intellipayProviderCode: ipResult.data.provider_code ?? null,
          intellipayWebhookUrl: webhookUrl,
          intellipayRequestId: ipResult.requestId,
        })
        .returning({ id: payments.id });
      return row;
    });

    return {
      success: true,
      paymentId: payment.id,
      intellipayPaymentId: ipResult.data.payment_id,
      qrCodeDataUrl,
      qrCodeContent: qrContent,
      expiresAt: ipResult.data.expires_at ?? null,
    };
  } catch (error) {
    console.error("Failed to initiate MPM payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Void an order (from any non-terminal status) and restore stock for every
// line item. Used when the cashier cancels an MPM payment that has already
// been handed to the gateway, and when a CPM attempt is declined synchronously
// — the order was momentarily "pending" and must be unwound cleanly.
async function voidOrderAndRestoreStockById(orderId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status: "voided" }).where(eq(orders.id, orderId));

    const items = await tx
      .select({
        productId: orderItems.productId,
        variantId: orderItems.variantId,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      if (item.variantId) {
        await tx
          .update(productVariants)
          .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
          .where(
            and(
              eq(productVariants.id, item.variantId),
              sql`${productVariants.stock} IS NOT NULL`,
            ),
          );
      } else if (item.productId) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(
            and(
              eq(products.id, item.productId),
              sql`${products.stock} IS NOT NULL`,
            ),
          );
      }
    }
  });
}

// ─── CPM (Consumer-Presented Mode) ───────────────────────────

export type InitiateCpmPaymentResult =
  | {
      success: true;
      paymentId: string;
      intellipayPaymentId: string;
      // true = gateway confirmed paid synchronously, UI can jump to success.
      // false = still pending, caller should fall back to polling.
      immediate: boolean;
      intellipayStatus: number | null;
      intellipayStatusDesc: string | null;
    }
  | { success: false; error: string };

export async function initiateCpmPayment(
  orderId: string,
  authCode: string,
  paymentService: string,
): Promise<InitiateCpmPaymentResult> {
  try {
    const session = await getAuthSession();
    if (!session?.tenantId || !session.locationId) {
      return { success: false, error: "No active session. Please log in." };
    }
    if (!session.terminalId || !session.tenantSlug) {
      return { success: false, error: "Terminal not activated." };
    }
    if (!authCode || authCode.trim().length === 0) {
      return { success: false, error: "No QR code scanned." };
    }
    const tenantId = session.tenantId;
    const tenantSlug = session.tenantSlug;
    const terminalId = session.terminalId;

    const loaded = await loadPrePaymentOrder(orderId, tenantId);
    if (!loaded.ok) return { success: false, error: loaded.error };
    const order = loaded.order;

    const [paymentConfig] = await db
      .select()
      .from(tenantPaymentConfigs)
      .where(eq(tenantPaymentConfigs.tenantId, tenantId))
      .limit(1);

    if (
      !paymentConfig ||
      !paymentConfig.intellipayEnabled ||
      !paymentConfig.accessKeyId ||
      !paymentConfig.privateKeyPemEncrypted ||
      !paymentConfig.webhookSlug
    ) {
      return {
        success: false,
        error: "Intellipay is not configured for this tenant.",
      };
    }

    const [terminalRow] = await db
      .select({ code: terminals.code })
      .from(terminals)
      .where(eq(terminals.id, terminalId))
      .limit(1);
    if (!terminalRow) {
      return { success: false, error: "Terminal record not found." };
    }

    // Flip "new" → "pending" before we call the gateway. If the gateway
    // declines synchronously we void+restore below; network failures get
    // rolled back to "new" in the catch block so the cashier can retry.
    await db
      .update(orders)
      .set({ status: "pending" })
      .where(eq(orders.id, order.id));

    const webhookUrl = buildWebhookUrl(tenantSlug, paymentConfig.webhookSlug);
    const totalNum = Number(order.total);
    const amountCents = Math.round(totalNum * 100);
    const ipResult = await ipCreateCpmPayment(
      {
        accessKeyId: paymentConfig.accessKeyId,
        privateKeyPemEncrypted: paymentConfig.privateKeyPemEncrypted,
      },
      {
        order_id: order.orderNumber,
        order_amount: amountCents,
        order_currency: order.currency,
        subject: `Order ${order.orderNumber}`,
        payment_service: paymentService || "simplepay",
        auth_code: authCode.trim(),
        terminal_id: terminalRow.code,
        webhook_url: webhookUrl,
        ...(paymentConfig.merchantId ? { merchant_id: paymentConfig.merchantId } : {}),
        ...(paymentConfig.operatorId ? { operator_id: paymentConfig.operatorId } : {}),
      },
      { idempotencyKey: randomUUID() },
    );

    if (!ipResult.ok) {
      console.error("[initiateCpmPayment] intellipay failed", {
        code: ipResult.errorCode,
        type: ipResult.errorType,
        message: ipResult.message,
        requestId: ipResult.requestId,
        raw: ipResult.raw,
      });
      // Network/gateway-level failure — roll status back to "new" so the
      // cashier can try another method or rescan the customer's wallet.
      await db
        .update(orders)
        .set({ status: "new" })
        .where(eq(orders.id, order.id));
      return {
        success: false,
        error: `Payment gateway error: ${ipResult.message}`,
      };
    }

    // CPM typically returns status 2 (paid) synchronously, but can also come
    // back as pending (status 1) when the wallet needs extra confirmation.
    // Status 2 = success; higher codes (>=10) are failures in our mapping.
    const ipStatus = ipResult.data.status ?? null;
    const isPaid = ipStatus === 2;
    const isFailed = ipStatus !== null && ipStatus >= 10;

    const [payment] = await db
      .insert(payments)
      .values({
        orderId: order.id,
        method: "qr",
        amount: totalNum.toFixed(2),
        provider: "intellipay",
        intellipayPaymentId: ipResult.data.payment_id,
        intellipayOrderId: ipResult.data.order_id ?? order.orderNumber,
        intellipayPaymentService:
          ipResult.data.payment_service ?? paymentService ?? null,
        intellipayTerminalId: ipResult.data.terminal_id ?? terminalRow.code,
        intellipayStatus: ipStatus,
        intellipayStatusDesc: ipResult.data.status_desc ?? null,
        intellipayProviderCode: ipResult.data.provider_code ?? null,
        intellipayWebhookUrl: webhookUrl,
        intellipayRequestId: ipResult.requestId,
      })
      .returning({ id: payments.id });

    if (isPaid) {
      await db
        .update(orders)
        .set({ status: "completed" })
        .where(eq(orders.id, order.id));
    } else if (isFailed) {
      // Wallet-level decline — the payment attempt is burned, so void the
      // order and restore stock. Retrying requires a fresh pre-payment order.
      await voidOrderAndRestoreStockById(order.id);
      return {
        success: false,
        error: ipResult.data.status_desc || `Payment declined (status ${ipStatus})`,
      };
    }

    return {
      success: true,
      paymentId: payment.id,
      intellipayPaymentId: ipResult.data.payment_id,
      immediate: isPaid,
      intellipayStatus: ipStatus,
      intellipayStatusDesc: ipResult.data.status_desc ?? null,
    };
  } catch (error) {
    console.error("Failed to initiate CPM payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─── Polling + cancel ────────────────────────────────────────

export type MpmPaymentStatus = {
  orderStatus: "pending" | "completed" | "refunded" | "voided";
  intellipayStatus: number | null;
  intellipayStatusDesc: string | null;
  lastEventId: string | null;
};

// Map intellipay status codes → local order status. Same table as the webhook
// route (spec §5.10) — kept in sync manually because they live in different
// packages.
function mapIpStatusToOrderStatus(
  status: number | null | undefined,
): "completed" | "refunded" | "voided" | null {
  if (status == null) return null;
  switch (status) {
    case 2:
    case 3:
    case 4:
      return "completed";
    case 10:
    case 11:
      return "refunded";
    case 5:
    case 6:
    case 8:
    case 13:
      return "voided";
    default:
      return null;
  }
}

export async function getMpmPaymentStatus(
  paymentId: string,
): Promise<{ success: true; data: MpmPaymentStatus } | { success: false; error: string }> {
  const session = await getAuthSession();
  if (!session?.tenantId) {
    return { success: false, error: "No active session." };
  }
  const tenantId = session.tenantId;

  const [row] = await db
    .select({
      orderId: payments.orderId,
      intellipayPaymentId: payments.intellipayPaymentId,
      orderStatus: orders.status,
      intellipayStatus: payments.intellipayStatus,
      intellipayStatusDesc: payments.intellipayStatusDesc,
      lastEventId: payments.intellipayLastEventId,
      tenantId: orders.tenantId,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(eq(payments.id, paymentId))
    .limit(1);

  if (!row) return { success: false, error: "Payment not found." };
  if (row.tenantId !== tenantId) {
    return { success: false, error: "Payment not found." };
  }

  // Fast path: terminal order status means the webhook already landed (or a
  // prior poll already synced). Nothing to do upstream.
  if (row.orderStatus !== "pending" || !row.intellipayPaymentId) {
    return {
      success: true,
      data: {
        orderStatus: row.orderStatus as MpmPaymentStatus["orderStatus"],
        intellipayStatus: row.intellipayStatus,
        intellipayStatusDesc: row.intellipayStatusDesc,
        lastEventId: row.lastEventId,
      },
    };
  }

  // Fallback path: order is still pending. Poll intellipay directly in case
  // the webhook never fires (sandbox delivery queue issues, network blips,
  // etc.). Webhook remains the fast path; this is an at-most-every-2s belt-
  // and-suspenders so the cashier never hangs.
  const [paymentConfig] = await db
    .select()
    .from(tenantPaymentConfigs)
    .where(eq(tenantPaymentConfigs.tenantId, tenantId))
    .limit(1);
  if (!paymentConfig?.accessKeyId || !paymentConfig.privateKeyPemEncrypted) {
    return {
      success: true,
      data: {
        orderStatus: row.orderStatus as MpmPaymentStatus["orderStatus"],
        intellipayStatus: row.intellipayStatus,
        intellipayStatusDesc: row.intellipayStatusDesc,
        lastEventId: row.lastEventId,
      },
    };
  }

  const ipRes = await queryPayment(
    {
      accessKeyId: paymentConfig.accessKeyId,
      privateKeyPemEncrypted: paymentConfig.privateKeyPemEncrypted,
    },
    row.intellipayPaymentId,
    { timeoutMs: 5_000 },
  );

  if (!ipRes.ok) {
    // Network/upstream blip — keep polling, don't surface an error.
    console.warn(
      `[getMpmPaymentStatus] query failed: ${ipRes.errorCode} ${ipRes.message}`,
    );
    return {
      success: true,
      data: {
        orderStatus: row.orderStatus as MpmPaymentStatus["orderStatus"],
        intellipayStatus: row.intellipayStatus,
        intellipayStatusDesc: row.intellipayStatusDesc,
        lastEventId: row.lastEventId,
      },
    };
  }

  const ipStatus = ipRes.data.status ?? null;
  const mapped = mapIpStatusToOrderStatus(ipStatus);
  if (!mapped) {
    // Still pending upstream (status 1) or unknown status — return as-is.
    return {
      success: true,
      data: {
        orderStatus: row.orderStatus as MpmPaymentStatus["orderStatus"],
        intellipayStatus: ipStatus,
        intellipayStatusDesc: ipRes.data.status_desc ?? row.intellipayStatusDesc,
        lastEventId: row.lastEventId,
      },
    };
  }

  // Terminal upstream status — mirror onto the local rows so the next poll
  // (and any other reader) sees it, then return the fresh state.
  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        intellipayStatus: ipStatus,
        intellipayStatusDesc: ipRes.data.status_desc ?? null,
        intellipayLastEventAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentId));
    await tx
      .update(orders)
      .set({ status: mapped })
      .where(and(eq(orders.id, row.orderId), eq(orders.tenantId, tenantId)));
  });

  return {
    success: true,
    data: {
      orderStatus: mapped,
      intellipayStatus: ipStatus,
      intellipayStatusDesc: ipRes.data.status_desc ?? null,
      lastEventId: row.lastEventId,
    },
  };
}

export async function cancelMpmPayment(
  paymentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getAuthSession();
    if (!session?.tenantId) {
      return { success: false, error: "No active session." };
    }

    const [row] = await db
      .select({
        orderId: payments.orderId,
        intellipayPaymentId: payments.intellipayPaymentId,
        orderStatus: orders.status,
        tenantId: orders.tenantId,
      })
      .from(payments)
      .innerJoin(orders, eq(payments.orderId, orders.id))
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!row || row.tenantId !== session.tenantId) {
      return { success: false, error: "Payment not found." };
    }
    if (row.orderStatus !== "pending") {
      // Already terminal — nothing to cancel.
      return { success: true };
    }

    // Best-effort cancel on Intellipay side. If it fails we still void locally.
    if (row.intellipayPaymentId) {
      const [paymentConfig] = await db
        .select()
        .from(tenantPaymentConfigs)
        .where(eq(tenantPaymentConfigs.tenantId, session.tenantId))
        .limit(1);
      if (
        paymentConfig?.accessKeyId &&
        paymentConfig.privateKeyPemEncrypted
      ) {
        const res = await cancelPayment(
          {
            accessKeyId: paymentConfig.accessKeyId,
            privateKeyPemEncrypted: paymentConfig.privateKeyPemEncrypted,
          },
          row.intellipayPaymentId,
        );
        if (!res.ok) {
          console.warn(
            `[cancelMpmPayment] intellipay cancel failed: ${res.errorCode} ${res.message}`,
          );
        }
      }
    }

    await voidOrderAndRestoreStockById(row.orderId);

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel MPM payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
