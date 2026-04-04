"use server";

import {
  db,
  orders,
  orderItems,
  payments,
  eq,
  sql,
  logCashEvent,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";
import { getActiveShift } from "./shift-actions";

type CartItemInput = {
  productId?: string;
  name: string;
  translations?: Record<string, string>;
  unitPrice: number;
  quantity: number;
  // Variant info (optional)
  variantId?: string;
  variantName?: string;
  optionCombo?: Record<string, string>;
};

type CreateOrderInput = {
  cart: CartItemInput[];
  paymentMethod: "tap" | "insert" | "qr" | "cash";
  subtotal: number;
  total: number;
  cashReceived?: number;
  changeGiven?: number;
};

type CreateOrderResult =
  | { success: true; orderNumber: string }
  | { success: false; error: string };

function buildDatePrefix(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `CS-${yy}${mm}${dd}`;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  try {
    const session = await getAuthSession();
    if (!session?.tenantId) {
      return { success: false, error: "No active session. Please log in." };
    }
    const tenantId = session.tenantId;
    const locationId = session.locationId;
    const datePrefix = buildDatePrefix();
    const itemCount = input.cart.reduce((sum, item) => sum + item.quantity, 0);

    // Get active shift for order tagging
    const activeShift = await getActiveShift();

    const result = await db.transaction(async (tx) => {
      // Generate order number: CS-YYMMDD-XXXX
      const [lastOrder] = await tx
        .select({ orderNumber: orders.orderNumber })
        .from(orders)
        .where(
          sql`${orders.tenantId} = ${tenantId} AND ${orders.orderNumber} LIKE ${datePrefix + "-%"}`
        )
        .orderBy(sql`${orders.orderNumber} DESC`)
        .limit(1);

      let seq = 1;
      if (lastOrder) {
        const lastSeq = parseInt(lastOrder.orderNumber.split("-").pop() || "0");
        seq = lastSeq + 1;
      }
      const orderNumber = `${datePrefix}-${String(seq).padStart(4, "0")}`;

      // Insert order (with location from session)
      const [order] = await tx
        .insert(orders)
        .values({
          tenantId,
          locationId: locationId!,
          orderNumber,
          status: "completed",
          subtotal: input.subtotal.toFixed(2),
          total: input.total.toFixed(2),
          itemCount,
          currency: "MOP",
          cashierId: session.userId,
          terminalId: session.terminalId || null,
          shiftId: activeShift?.id || null,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      // Insert order items (with variant info if present)
      await tx.insert(orderItems).values(
        input.cart.map((item) => ({
          orderId: order.id,
          productId: item.productId || null,
          name: item.name,
          translations: item.translations || {},
          unitPrice: item.unitPrice.toFixed(2),
          quantity: item.quantity,
          lineTotal: (item.unitPrice * item.quantity).toFixed(2),
          variantId: item.variantId || null,
          variantName: item.variantName || null,
          optionCombo: item.optionCombo || null,
        }))
      );

      // Insert payment
      const [payment] = await tx.insert(payments).values({
        orderId: order.id,
        method: input.paymentMethod,
        amount: input.total.toFixed(2),
        cashReceived: input.cashReceived?.toFixed(2) ?? null,
        changeGiven: input.changeGiven?.toFixed(2) ?? null,
      }).returning({ id: payments.id });

      return { orderNumber: order.orderNumber, orderId: order.id, paymentId: payment.id };
    });

    // Log cash events outside transaction (non-blocking)
    if (input.paymentMethod === "cash" && activeShift) {
      const cashIn = input.cashReceived || input.total;
      const changeOut = input.changeGiven || 0;

      await logCashEvent({
        tenantId,
        locationId: locationId!,
        shiftId: activeShift.id,
        terminalId: session.terminalId || null,
        eventType: "cash_sale",
        creditAmount: cashIn,
        orderId: result.orderId,
        paymentId: result.paymentId,
        recordedBy: session.userId,
        reason: `Order ${result.orderNumber}`,
      });

      if (changeOut > 0) {
        await logCashEvent({
          tenantId,
          locationId: locationId!,
          shiftId: activeShift.id,
          terminalId: session.terminalId || null,
          eventType: "cash_change",
          debitAmount: changeOut,
          orderId: result.orderId,
          paymentId: result.paymentId,
          recordedBy: session.userId,
          reason: `Change for ${result.orderNumber}`,
        });
      }
    }

    return { success: true, orderNumber: result.orderNumber };
  } catch (error) {
    console.error("Failed to create order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─── Get Product Variants (for cashier variant picker) ─────
export async function fetchProductVariants(productId: string) {
  const { getProductVariantsForCashier } = await import("./queries");
  return getProductVariantsForCashier(productId);
}
