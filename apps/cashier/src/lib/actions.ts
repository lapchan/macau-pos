"use server";

import {
  db,
  orders,
  orderItems,
  payments,
  products,
  productVariants,
  customers,
  eq,
  and,
  or,
  sql,
  isNull,
  logCashEvent,
  phoneSearchCandidates,
  normalizePhone,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";
import { getActiveShift } from "./shift-actions";

type CartItemInput = {
  productId?: string;
  name: string;
  translations?: Record<string, string>;
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  discountNote?: string;
  // Variant info (optional)
  variantId?: string;
  variantName?: string;
  optionCombo?: Record<string, string>;
};

export type OrderDiscount = { type: "percent" | "fixed"; value: number } | null;

type CreateOrderInput = {
  cart: CartItemInput[];
  paymentMethod: "tap" | "insert" | "qr" | "cash";
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  total: number;
  cashReceived?: number;
  changeGiven?: number;
  customerId?: string;
  discountMeta?: OrderDiscount;
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
          discountAmount: (input.discountAmount ?? 0).toFixed(2),
          taxAmount: (input.taxAmount ?? 0).toFixed(2),
          total: input.total.toFixed(2),
          notes: input.discountMeta
            ? `Discount: ${input.discountMeta.type === "percent" ? `${input.discountMeta.value}%` : `MOP ${input.discountMeta.value}`}`
            : null,
          itemCount,
          currency: "MOP",
          cashierId: session.userId,
          terminalId: session.terminalId || null,
          shiftId: activeShift?.id || null,
          customerId: input.customerId || null,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      // Insert order items (with variant info if present)
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
        })
      );

      // Deduct stock for each item (skip items with null stock = unlimited)
      for (const item of input.cart) {
        if (item.variantId) {
          // Variant stock deduction
          await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
            .where(
              and(
                eq(productVariants.id, item.variantId),
                sql`${productVariants.stock} IS NOT NULL`
              )
            );
        } else if (item.productId) {
          // Product stock deduction (only if not a variant product)
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(
              and(
                eq(products.id, item.productId),
                sql`${products.stock} IS NOT NULL`
              )
            );
        }
      }

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

// ─── Barcode Lookup ──────────────────────────────────────────
export type BarcodeLookupResult =
  | { found: true; type: "product"; productId: string; name: string; price: number; image?: string; hasVariants: boolean; translations?: Record<string, string> }
  | { found: true; type: "variant"; productId: string; variantId: string; productName: string; variantName: string; price: number; image?: string; optionCombo: Record<string, string>; translations?: Record<string, string> }
  | { found: true; type: "customer"; customer: { id: string; name: string; phone: string | null; email: string | null } }
  | { found: false };

export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const session = await getAuthSession();
  if (!session?.tenantId || !barcode.trim()) return { found: false };

  const code = barcode.trim();

  // Check product variants first (more specific)
  const [variant] = await db
    .select({
      id: productVariants.id,
      name: productVariants.name,
      sellingPrice: productVariants.sellingPrice,
      image: productVariants.image,
      optionCombo: productVariants.optionCombo,
      productId: productVariants.productId,
    })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.barcode, code),
        eq(productVariants.isActive, true)
      )
    )
    .limit(1);

  if (variant) {
    // Get parent product name
    const [parent] = await db
      .select({ name: products.name, translations: products.translations })
      .from(products)
      .where(and(eq(products.id, variant.productId), eq(products.tenantId, session.tenantId)))
      .limit(1);

    return {
      found: true,
      type: "variant",
      productId: variant.productId,
      variantId: variant.id,
      productName: parent?.name || variant.name,
      variantName: variant.name,
      price: parseFloat(variant.sellingPrice),
      image: variant.image || undefined,
      optionCombo: (variant.optionCombo as Record<string, string>) || {},
      translations: (parent?.translations as Record<string, string>) || undefined,
    };
  }

  // Check products
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      sellingPrice: products.sellingPrice,
      image: products.image,
      hasVariants: products.hasVariants,
      translations: products.translations,
    })
    .from(products)
    .where(
      and(
        eq(products.tenantId, session.tenantId),
        eq(products.barcode, code),
        isNull(products.deletedAt)
      )
    )
    .limit(1);

  if (product) {
    return {
      found: true,
      type: "product",
      productId: product.id,
      name: product.name,
      price: parseFloat(product.sellingPrice),
      image: product.image || undefined,
      hasVariants: product.hasVariants,
      translations: (product.translations as Record<string, string>) || undefined,
    };
  }

  // Check customers by phone (membership card scan)
  // Generates candidates: raw, with/without country code, with/without +
  const phoneCandidates = phoneSearchCandidates(code);

  const [customer] = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
    })
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, session.tenantId),
        isNull(customers.deletedAt),
        sql`${customers.phone} IN (${sql.join(phoneCandidates.map(p => sql`${p}`), sql`, `)})`
      )
    )
    .limit(1);

  if (customer) {
    return {
      found: true,
      type: "customer",
      customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email },
    };
  }

  return { found: false };
}

// ─── Get Product Variants (for cashier variant picker) ─────
export async function fetchProductVariants(productId: string) {
  const { getProductVariantsForCashier } = await import("./queries");
  return getProductVariantsForCashier(productId);
}

// ─── Search Customers by Phone ─────────────────────────────
export type CustomerSearchResult = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  isVerified: boolean;
};

export async function searchCustomersByPhone(
  query: string
): Promise<CustomerSearchResult[]> {
  const session = await getAuthSession();
  if (!session?.tenantId || !query.trim()) return [];

  // Search by all candidate phone forms (handles area codes)
  const candidates = phoneSearchCandidates(query.trim());
  const likeConditions = candidates.map(c => sql`${customers.phone} ILIKE ${"%" + c + "%"}`);

  const results = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      avatar: customers.avatar,
      isVerified: customers.isVerified,
    })
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, session.tenantId),
        isNull(customers.deletedAt),
        or(...likeConditions)
      )
    )
    .limit(10);

  return results;
}
