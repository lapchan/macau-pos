"use server";

import {
  db,
  orders,
  orderItems,
  payments,
  shopSettings,
  users,
  eq,
  and,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";

export type ReceiptData = {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  showAddress: boolean;
  showPhone: boolean;
  showTax: boolean;
  taxRate: number;
  orderNumber: string;
  orderDate: Date;
  cashierName?: string;
  items: {
    name: string;
    translations?: Record<string, string>;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    discountAmount: number;
    discountNote?: string;
    variantName?: string;
  }[];
  subtotal: number;
  discountAmount: number;
  discountNote?: string;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paymentAmount: number;
  cashReceived?: number;
  changeGiven?: number;
  currency: string;
};

export async function getReceiptData(orderNumber: string): Promise<ReceiptData | null> {
  const session = await getAuthSession();
  if (!session?.tenantId) return null;

  // Fetch order
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, session.tenantId),
        eq(orders.orderNumber, orderNumber)
      )
    )
    .limit(1);

  if (!order) return null;

  // Fetch cashier name (order.cashier_id may be null on legacy rows)
  let cashierName: string | undefined;
  if (order.cashierId) {
    const [staff] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, order.cashierId))
      .limit(1);
    cashierName = staff?.name ?? undefined;
  }

  // Fetch order items
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  // Fetch payment
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .limit(1);

  // Fetch shop settings
  const [settings] = await db
    .select()
    .from(shopSettings)
    .where(eq(shopSettings.tenantId, session.tenantId))
    .limit(1);

  return {
    shopName: settings?.shopName || "Shop",
    shopAddress: settings?.address || undefined,
    shopPhone: settings?.phone || undefined,
    receiptHeader: settings?.receiptHeader || undefined,
    receiptFooter: settings?.receiptFooter || undefined,
    showAddress: settings?.receiptShowAddress ?? true,
    showPhone: settings?.receiptShowPhone ?? true,
    showTax: settings?.receiptShowTax ?? false,
    taxRate: parseFloat(settings?.taxRate || "0"),
    orderNumber: order.orderNumber,
    orderDate: order.createdAt,
    cashierName,
    items: items.map((item) => ({
      name: item.name,
      translations: (item.translations as Record<string, string> | null) ?? undefined,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice),
      lineTotal: parseFloat(item.lineTotal),
      discountAmount: parseFloat(item.discountAmount || "0"),
      discountNote: item.discountNote || undefined,
      variantName: item.variantName || undefined,
    })),
    subtotal: parseFloat(order.subtotal),
    discountAmount: parseFloat(order.discountAmount || "0"),
    discountNote: order.notes || undefined,
    taxAmount: parseFloat(order.taxAmount || "0"),
    total: parseFloat(order.total),
    paymentMethod: payment?.method || "unknown",
    paymentAmount: payment ? parseFloat(payment.amount) : parseFloat(order.total),
    cashReceived: payment?.cashReceived ? parseFloat(payment.cashReceived) : undefined,
    changeGiven: payment?.changeGiven ? parseFloat(payment.changeGiven) : undefined,
    currency: order.currency || "MOP",
  };
}
