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
import { getActiveShift } from "./shift-actions";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
import type { OrderDiscount } from "./actions";

type CartItemInput = {
  productId?: string;
  name: string;
  translations?: Record<string, string>;
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  discountNote?: string;
  variantId?: string;
  variantName?: string;
  optionCombo?: Record<string, string>;
};

type CreateMpmPaymentInput = {
  cart: CartItemInput[];
  // Intellipay payment_service: simplepay | mpay | alipay | wechat_pay
  paymentService: string;
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  total: number;
  customerId?: string;
  discountMeta?: OrderDiscount;
};

export type CreateMpmPaymentResult =
  | {
      success: true;
      orderId: string;
      orderNumber: string;
      paymentId: string;
      intellipayPaymentId: string;
      qrCodeDataUrl: string;
      qrCodeContent: string;
      expiresAt: string | null;
    }
  | { success: false; error: string };

function buildDatePrefix(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `CS-${yy}${mm}${dd}`;
}

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

export async function createMpmPayment(
  input: CreateMpmPaymentInput,
): Promise<CreateMpmPaymentResult> {
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
    const locationId = session.locationId;
    const terminalId = session.terminalId;

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

    const activeShift = await getActiveShift();
    const itemCount = input.cart.reduce((sum, item) => sum + item.quantity, 0);
    const datePrefix = buildDatePrefix();

    // Create order (pending) + items in a single transaction, but do NOT
    // insert the payment row yet — that has to wait for Intellipay's response.
    const dbResult = await db.transaction(async (tx) => {
      const [lastOrder] = await tx
        .select({ orderNumber: orders.orderNumber })
        .from(orders)
        .where(
          sql`${orders.tenantId} = ${tenantId} AND ${orders.orderNumber} LIKE ${datePrefix + "-%"}`,
        )
        .orderBy(sql`${orders.orderNumber} DESC`)
        .limit(1);

      let seq = 1;
      if (lastOrder) {
        const lastSeq = parseInt(lastOrder.orderNumber.split("-").pop() || "0");
        seq = lastSeq + 1;
      }
      const orderNumber = `${datePrefix}-${String(seq).padStart(4, "0")}`;

      const [order] = await tx
        .insert(orders)
        .values({
          tenantId,
          locationId,
          orderNumber,
          status: "pending",
          subtotal: input.subtotal.toFixed(2),
          discountAmount: (input.discountAmount ?? 0).toFixed(2),
          taxAmount: (input.taxAmount ?? 0).toFixed(2),
          total: input.total.toFixed(2),
          notes: input.discountMeta
            ? `Discount: ${input.discountMeta.type === "percent" ? `${input.discountMeta.value}%` : `${session.tenantCurrency || "MOP"} ${input.discountMeta.value}`}`
            : null,
          itemCount,
          currency: session.tenantCurrency || "MOP",
          cashierId: session.userId,
          terminalId,
          shiftId: activeShift?.id || null,
          customerId: input.customerId || null,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      await tx.insert(orderItems).values(
        input.cart.map((item) => {
          const rawTotal = item.unitPrice * item.quantity;
          const itemDiscount = item.discountAmount ?? 0;
          return {
            orderId: order.id,
            productId: item.productId || null,
            name: item.name,
            translations: item.translations || {},
            unitPrice: item.unitPrice.toFixed(2),
            quantity: item.quantity,
            discountAmount: itemDiscount.toFixed(2),
            discountNote: item.discountNote || null,
            lineTotal: (rawTotal - itemDiscount).toFixed(2),
            variantId: item.variantId || null,
            variantName: item.variantName || null,
            optionCombo: item.optionCombo || null,
          };
        }),
      );

      // Optimistically decrement stock so the same SKU can't oversell while
      // the customer is paying. If the payment times out we'll need to refund
      // stock on cancel.
      for (const item of input.cart) {
        if (item.variantId) {
          await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
            .where(
              and(
                eq(productVariants.id, item.variantId),
                sql`${productVariants.stock} IS NOT NULL`,
              ),
            );
        } else if (item.productId) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(
              and(
                eq(products.id, item.productId),
                sql`${products.stock} IS NOT NULL`,
              ),
            );
        }
      }

      return { orderNumber: order.orderNumber, orderId: order.id };
    });

    // Call Intellipay. If this fails we void the order below.
    const webhookUrl = buildWebhookUrl(tenantSlug, paymentConfig.webhookSlug);
    const amountCents = Math.round(input.total * 100);
    const ipResult = await createMpqrPayment(
      {
        accessKeyId: paymentConfig.accessKeyId,
        privateKeyPemEncrypted: paymentConfig.privateKeyPemEncrypted,
      },
      {
        order_id: dbResult.orderNumber,
        order_amount: amountCents,
        order_currency: session.tenantCurrency || "MOP",
        subject: `Order ${dbResult.orderNumber}`,
        payment_service: input.paymentService || "simplepay",
        terminal_id: terminalRow.code,
        webhook_url: webhookUrl,
        ...(paymentConfig.merchantId ? { merchant_id: paymentConfig.merchantId } : {}),
        ...(paymentConfig.operatorId ? { operator_id: paymentConfig.operatorId } : {}),
      },
      { idempotencyKey: randomUUID() },
    );

    if (!ipResult.ok) {
      console.error("[createMpmPayment] intellipay failed", {
        code: ipResult.errorCode,
        type: ipResult.errorType,
        message: ipResult.message,
        requestId: ipResult.requestId,
      });
      // Roll back: void the order and restore stock.
      await voidOrderAndRestoreStock(dbResult.orderId, input.cart);
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
      await voidOrderAndRestoreStock(dbResult.orderId, input.cart);
      return { success: false, error: "Intellipay returned no QR content." };
    }
    const qrCodeDataUrl = await QRCode.toDataURL(qrContent, { width: 384, margin: 1 });

    const [payment] = await db
      .insert(payments)
      .values({
        orderId: dbResult.orderId,
        method: "qr",
        amount: input.total.toFixed(2),
        provider: "intellipay",
        intellipayPaymentId: ipResult.data.payment_id,
        intellipayOrderId: ipResult.data.order_id ?? dbResult.orderNumber,
        intellipayPaymentService:
          ipResult.data.payment_service ?? input.paymentService ?? null,
        intellipayTerminalId: ipResult.data.terminal_id ?? terminalRow.code,
        intellipayStatus: ipResult.data.status ?? null,
        intellipayStatusDesc: ipResult.data.status_desc ?? null,
        intellipayQrCodeUrl: ipResult.data.qr_code_url ?? null,
        intellipayProviderCode: ipResult.data.provider_code ?? null,
        intellipayWebhookUrl: webhookUrl,
        intellipayRequestId: ipResult.requestId,
      })
      .returning({ id: payments.id });

    return {
      success: true,
      orderId: dbResult.orderId,
      orderNumber: dbResult.orderNumber,
      paymentId: payment.id,
      intellipayPaymentId: ipResult.data.payment_id,
      qrCodeDataUrl,
      qrCodeContent: qrContent,
      expiresAt: ipResult.data.expires_at ?? null,
    };
  } catch (error) {
    console.error("Failed to create MPM payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function voidOrderAndRestoreStock(
  orderId: string,
  cart: CartItemInput[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status: "voided" }).where(eq(orders.id, orderId));
    for (const item of cart) {
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

type CreateCpmPaymentInput = {
  cart: CartItemInput[];
  // Raw QR content scanned from the customer's wallet app.
  authCode: string;
  paymentService?: string;
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  total: number;
  customerId?: string;
  discountMeta?: OrderDiscount;
};

export type CreateCpmPaymentResult =
  | {
      success: true;
      orderId: string;
      orderNumber: string;
      paymentId: string;
      intellipayPaymentId: string;
      // true = gateway confirmed paid synchronously, UI can jump to success.
      // false = still pending, caller should fall back to polling.
      immediate: boolean;
      intellipayStatus: number | null;
      intellipayStatusDesc: string | null;
    }
  | { success: false; error: string };

export async function createCpmPayment(
  input: CreateCpmPaymentInput,
): Promise<CreateCpmPaymentResult> {
  try {
    const session = await getAuthSession();
    if (!session?.tenantId || !session.locationId) {
      return { success: false, error: "No active session. Please log in." };
    }
    if (!session.terminalId || !session.tenantSlug) {
      return { success: false, error: "Terminal not activated." };
    }
    if (!input.authCode || input.authCode.trim().length === 0) {
      return { success: false, error: "No QR code scanned." };
    }
    const tenantId = session.tenantId;
    const tenantSlug = session.tenantSlug;
    const locationId = session.locationId;
    const terminalId = session.terminalId;

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

    const activeShift = await getActiveShift();
    const itemCount = input.cart.reduce((sum, item) => sum + item.quantity, 0);
    const datePrefix = buildDatePrefix();

    const dbResult = await db.transaction(async (tx) => {
      const [lastOrder] = await tx
        .select({ orderNumber: orders.orderNumber })
        .from(orders)
        .where(
          sql`${orders.tenantId} = ${tenantId} AND ${orders.orderNumber} LIKE ${datePrefix + "-%"}`,
        )
        .orderBy(sql`${orders.orderNumber} DESC`)
        .limit(1);

      let seq = 1;
      if (lastOrder) {
        const lastSeq = parseInt(lastOrder.orderNumber.split("-").pop() || "0");
        seq = lastSeq + 1;
      }
      const orderNumber = `${datePrefix}-${String(seq).padStart(4, "0")}`;

      const [order] = await tx
        .insert(orders)
        .values({
          tenantId,
          locationId,
          orderNumber,
          status: "pending",
          subtotal: input.subtotal.toFixed(2),
          discountAmount: (input.discountAmount ?? 0).toFixed(2),
          taxAmount: (input.taxAmount ?? 0).toFixed(2),
          total: input.total.toFixed(2),
          notes: input.discountMeta
            ? `Discount: ${input.discountMeta.type === "percent" ? `${input.discountMeta.value}%` : `${session.tenantCurrency || "MOP"} ${input.discountMeta.value}`}`
            : null,
          itemCount,
          currency: session.tenantCurrency || "MOP",
          cashierId: session.userId,
          terminalId,
          shiftId: activeShift?.id || null,
          customerId: input.customerId || null,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      await tx.insert(orderItems).values(
        input.cart.map((item) => {
          const rawTotal = item.unitPrice * item.quantity;
          const itemDiscount = item.discountAmount ?? 0;
          return {
            orderId: order.id,
            productId: item.productId || null,
            name: item.name,
            translations: item.translations || {},
            unitPrice: item.unitPrice.toFixed(2),
            quantity: item.quantity,
            discountAmount: itemDiscount.toFixed(2),
            discountNote: item.discountNote || null,
            lineTotal: (rawTotal - itemDiscount).toFixed(2),
            variantId: item.variantId || null,
            variantName: item.variantName || null,
            optionCombo: item.optionCombo || null,
          };
        }),
      );

      for (const item of input.cart) {
        if (item.variantId) {
          await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
            .where(
              and(
                eq(productVariants.id, item.variantId),
                sql`${productVariants.stock} IS NOT NULL`,
              ),
            );
        } else if (item.productId) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(
              and(
                eq(products.id, item.productId),
                sql`${products.stock} IS NOT NULL`,
              ),
            );
        }
      }

      return { orderNumber: order.orderNumber, orderId: order.id };
    });

    const webhookUrl = buildWebhookUrl(tenantSlug, paymentConfig.webhookSlug);
    const amountCents = Math.round(input.total * 100);
    const ipResult = await ipCreateCpmPayment(
      {
        accessKeyId: paymentConfig.accessKeyId,
        privateKeyPemEncrypted: paymentConfig.privateKeyPemEncrypted,
      },
      {
        order_id: dbResult.orderNumber,
        order_amount: amountCents,
        order_currency: session.tenantCurrency || "MOP",
        subject: `Order ${dbResult.orderNumber}`,
        payment_service: input.paymentService || "simplepay",
        auth_code: input.authCode.trim(),
        terminal_id: terminalRow.code,
        webhook_url: webhookUrl,
        ...(paymentConfig.merchantId ? { merchant_id: paymentConfig.merchantId } : {}),
        ...(paymentConfig.operatorId ? { operator_id: paymentConfig.operatorId } : {}),
      },
      { idempotencyKey: randomUUID() },
    );

    if (!ipResult.ok) {
      console.error("[createCpmPayment] intellipay failed", {
        code: ipResult.errorCode,
        type: ipResult.errorType,
        message: ipResult.message,
        requestId: ipResult.requestId,
      });
      await voidOrderAndRestoreStock(dbResult.orderId, input.cart);
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
        orderId: dbResult.orderId,
        method: "qr",
        amount: input.total.toFixed(2),
        provider: "intellipay",
        intellipayPaymentId: ipResult.data.payment_id,
        intellipayOrderId: ipResult.data.order_id ?? dbResult.orderNumber,
        intellipayPaymentService:
          ipResult.data.payment_service ?? input.paymentService ?? null,
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
        .where(eq(orders.id, dbResult.orderId));
    } else if (isFailed) {
      await voidOrderAndRestoreStock(dbResult.orderId, input.cart);
      return {
        success: false,
        error: ipResult.data.status_desc || `Payment declined (status ${ipStatus})`,
      };
    }

    return {
      success: true,
      orderId: dbResult.orderId,
      orderNumber: dbResult.orderNumber,
      paymentId: payment.id,
      intellipayPaymentId: ipResult.data.payment_id,
      immediate: isPaid,
      intellipayStatus: ipStatus,
      intellipayStatusDesc: ipResult.data.status_desc ?? null,
    };
  } catch (error) {
    console.error("Failed to create CPM payment:", error);
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

    // Fetch cart items to restore stock.
    const items = await db
      .select({
        productId: orderItems.productId,
        variantId: orderItems.variantId,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, row.orderId));

    await voidOrderAndRestoreStock(
      row.orderId,
      items.map((i) => ({
        productId: i.productId ?? undefined,
        variantId: i.variantId ?? undefined,
        name: "",
        unitPrice: 0,
        quantity: i.quantity,
      })),
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel MPM payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
