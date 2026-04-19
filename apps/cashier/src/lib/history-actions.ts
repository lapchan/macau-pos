"use server";

import {
  db,
  orders,
  orderItems,
  payments,
  products,
  productVariants,
  tenantPaymentConfigs,
  eq,
  and,
  desc,
  inArray,
  ne,
  sql,
  logCashEvent,
  refundPayment,
} from "@macau-pos/database";
import { randomUUID } from "node:crypto";
import { getAuthSession } from "./auth-actions";
import { getActiveShift } from "./shift-actions";

export type FilterParams = {
  dateRange: "all" | "today" | "yesterday" | "last7days" | "thisShift" | "custom";
  status: string[];
  paymentMethod: string[];
  search: string;
  shiftId?: string | null;
  customFrom?: string;
  customTo?: string;
};

export type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  notes: string | null;
  itemCount: number;
  currency: string;
  createdAt: string;
  paymentMethod: string | null;
};

export type OrderItemRow = {
  id: string;
  orderId: string;
  name: string;
  translations: Record<string, string> | null;
  unitPrice: string;
  discountAmount: string;
  discountNote: string | null;
  quantity: number;
  lineTotal: string;
};

export async function fetchFilteredOrders(
  filters: FilterParams
): Promise<{ orders: OrderRow[]; items: Record<string, OrderItemRow[]> }> {
  const session = await getAuthSession();
  if (!session?.tenantId) {
    return { orders: [], items: {} };
  }
  const tenantId = session.tenantId;

  // Build conditions — only show orders from this terminal
  const conditions: ReturnType<typeof eq>[] = [eq(orders.tenantId, tenantId)];
  if (session.terminalId) {
    conditions.push(eq(orders.terminalId, session.terminalId));
  }
  // Pre-payment orders ("new") are ephemeral — they live only while the
  // cashier has the checkout modal open and get voided on close.
  conditions.push(ne(orders.status, "new"));

  // Shift filter
  if (filters.dateRange === "thisShift" && filters.shiftId) {
    conditions.push(eq(orders.shiftId, filters.shiftId));
  }

  // Date range filter (Macau timezone = Asia/Macau = UTC+8)
  // Cast date back to timestamptz in Macau TZ so midnight = 16:00 UTC, not 00:00 UTC
  if (filters.dateRange === "today") {
    conditions.push(sql`${orders.createdAt} >= ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Macau')::date)::timestamp AT TIME ZONE 'Asia/Macau'`);
  } else if (filters.dateRange === "yesterday") {
    conditions.push(sql`${orders.createdAt} >= (((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Macau')::date - INTERVAL '1 day'))::timestamp AT TIME ZONE 'Asia/Macau'`);
    conditions.push(sql`${orders.createdAt} < ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Macau')::date)::timestamp AT TIME ZONE 'Asia/Macau'`);
  } else if (filters.dateRange === "last7days") {
    conditions.push(sql`${orders.createdAt} >= (((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Macau')::date - INTERVAL '7 days'))::timestamp AT TIME ZONE 'Asia/Macau'`);
  } else if (filters.dateRange === "custom" && filters.customFrom && filters.customTo) {
    conditions.push(sql`${orders.createdAt} >= (${filters.customFrom}::date)::timestamp AT TIME ZONE 'Asia/Macau'`);
    conditions.push(sql`${orders.createdAt} < (${filters.customTo}::date + INTERVAL '1 day')::timestamp AT TIME ZONE 'Asia/Macau'`);
  }

  // Status filter
  if (filters.status.length > 0) {
    conditions.push(inArray(orders.status, filters.status));
  }

  // Search by order number
  if (filters.search.trim()) {
    conditions.push(
      sql`${orders.orderNumber} ILIKE ${"%" + filters.search.trim() + "%"}`
    );
  }

  // Base query
  let query = db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      subtotal: orders.subtotal,
      discountAmount: orders.discountAmount,
      taxAmount: orders.taxAmount,
      total: orders.total,
      notes: orders.notes,
      itemCount: orders.itemCount,
      currency: orders.currency,
      createdAt: orders.createdAt,
      paymentMethod: payments.method,
    })
    .from(orders)
    .leftJoin(payments, eq(orders.id, payments.orderId))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(100);

  // Payment method filter (post-join)
  if (filters.paymentMethod.length > 0) {
    conditions.push(inArray(payments.method, filters.paymentMethod));
    query = db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        subtotal: orders.subtotal,
        total: orders.total,
        itemCount: orders.itemCount,
        currency: orders.currency,
        createdAt: orders.createdAt,
        paymentMethod: payments.method,
      })
      .from(orders)
      .leftJoin(payments, eq(orders.id, payments.orderId))
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt))
      .limit(100);
  }

  const rows = await query;

  // Serialize dates
  const serializedOrders: OrderRow[] = rows.map((r) => ({
    ...r,
    subtotal: String(r.subtotal),
    discountAmount: String(r.discountAmount || "0"),
    taxAmount: String(r.taxAmount || "0"),
    total: String(r.total),
    notes: r.notes || null,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
  }));

  // Fetch items for all orders
  const orderIds = serializedOrders.map((o) => o.id);
  const allItems =
    orderIds.length > 0
      ? await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            name: orderItems.name,
            translations: orderItems.translations,
            unitPrice: orderItems.unitPrice,
            quantity: orderItems.quantity,
            discountAmount: orderItems.discountAmount,
            discountNote: orderItems.discountNote,
            lineTotal: orderItems.lineTotal,
          })
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
      : [];

  // Group items by orderId
  const items: Record<string, OrderItemRow[]> = {};
  for (const item of allItems) {
    const serialized: OrderItemRow = {
      ...item,
      translations: item.translations as Record<string, string> | null,
      unitPrice: String(item.unitPrice),
      discountAmount: String(item.discountAmount || "0"),
      discountNote: item.discountNote || null,
      lineTotal: String(item.lineTotal),
    };
    if (!items[item.orderId]) items[item.orderId] = [];
    items[item.orderId].push(serialized);
  }

  return { orders: serializedOrders, items };
}

// ─── Void or Refund an Order ─────────────────────────────────
type VoidRefundResult =
  | { success: true; refundAmount: number; paymentMethod: string }
  | { success: false; error: string };

export async function voidOrRefundOrder(
  orderId: string,
  action: "void" | "refund"
): Promise<VoidRefundResult> {
  try {
    const session = await getAuthSession();
    if (!session?.tenantId || !session.userId) {
      return { success: false, error: "No active session" };
    }

    // Load order
    const [order] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, session.tenantId)))
      .limit(1);

    if (!order) return { success: false, error: "Order not found" };
    if (order.status !== "completed") {
      return { success: false, error: `Order is already ${order.status}` };
    }

    // Load items + payment
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const [payment] = await db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1);

    const newStatus = action === "void" ? "voided" : "refunded";

    // If this is a refund of an Intellipay-routed payment, hit the gateway
    // first — we won't mark the order refunded locally unless the gateway
    // confirms. Void (no money moved, e.g. pending) doesn't need this.
    let refundStatus: number | null = null;
    let refundStatusDesc: string | null = null;
    if (
      action === "refund" &&
      payment?.provider === "intellipay" &&
      payment.intellipayPaymentId
    ) {
      const [paymentConfig] = await db
        .select()
        .from(tenantPaymentConfigs)
        .where(eq(tenantPaymentConfigs.tenantId, session.tenantId))
        .limit(1);

      if (
        !paymentConfig?.accessKeyId ||
        !paymentConfig.privateKeyPemEncrypted
      ) {
        return {
          success: false,
          error: "Intellipay credentials not configured for this tenant",
        };
      }

      const refundAmountCents = Math.round(parseFloat(order.total) * 100);
      const res = await refundPayment(
        {
          accessKeyId: paymentConfig.accessKeyId,
          privateKeyPemEncrypted: paymentConfig.privateKeyPemEncrypted,
        },
        payment.intellipayPaymentId,
        {
          refund_amount: refundAmountCents,
          reason: `Refund ${order.orderNumber}`,
          ...(paymentConfig.merchantId ? { merchant_id: paymentConfig.merchantId } : {}),
          ...(paymentConfig.operatorId ? { operator_id: paymentConfig.operatorId } : {}),
        },
        { idempotencyKey: randomUUID() },
      );

      if (!res.ok) {
        console.error("[voidOrRefundOrder] intellipay refund failed", {
          orderId,
          code: res.errorCode,
          type: res.errorType,
          message: res.message,
          requestId: res.requestId,
        });
        return {
          success: false,
          error: `Payment gateway refund failed: ${res.message}`,
        };
      }
      refundStatus = res.data.status ?? null;
      refundStatusDesc = res.data.status_desc ?? null;
    }

    await db.transaction(async (tx) => {
      // Update order status
      await tx
        .update(orders)
        .set({ status: newStatus as "voided" | "refunded" })
        .where(eq(orders.id, orderId));

      // Stamp refund result on the payment row so history queries can see it.
      if (payment && refundStatus !== null) {
        await tx
          .update(payments)
          .set({
            intellipayStatus: refundStatus,
            intellipayStatusDesc: refundStatusDesc,
          })
          .where(eq(payments.id, payment.id));
      }

      // Reverse stock for each item
      for (const item of items) {
        if (item.variantId) {
          await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
            .where(
              and(
                eq(productVariants.id, item.variantId),
                sql`${productVariants.stock} IS NOT NULL`
              )
            );
        } else if (item.productId) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${item.quantity}` })
            .where(
              and(
                eq(products.id, item.productId),
                sql`${products.stock} IS NOT NULL`
              )
            );
        }
      }
    });

    // Log cash event (outside tx, non-blocking)
    if (payment?.method === "cash") {
      const activeShift = await getActiveShift();
      if (activeShift) {
        await logCashEvent({
          tenantId: session.tenantId,
          locationId: order.locationId,
          shiftId: activeShift.id,
          terminalId: session.terminalId || null,
          eventType: "refund",
          debitAmount: parseFloat(order.total),
          orderId: order.id,
          paymentId: payment.id,
          recordedBy: session.userId,
          reason: `${action === "void" ? "Void" : "Refund"} ${order.orderNumber}`,
        });
      }
    }

    return {
      success: true,
      refundAmount: parseFloat(order.total),
      paymentMethod: payment?.method || "unknown",
    };
  } catch (error) {
    console.error("voidOrRefundOrder error:", error);
    return { success: false, error: "Failed to process" };
  }
}
