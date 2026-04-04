"use server";

import {
  db,
  orders,
  orderItems,
  payments,
  eq,
  and,
  desc,
  inArray,
  sql,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";

export type FilterParams = {
  dateRange: "all" | "today" | "yesterday" | "last7days" | "thisShift";
  status: string[];
  paymentMethod: string[];
  search: string;
  shiftId?: string | null;
};

export type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  total: string;
  itemCount: number;
  currency: string;
  createdAt: string; // ISO string for serialization
  paymentMethod: string | null;
};

export type OrderItemRow = {
  id: string;
  orderId: string;
  name: string;
  translations: Record<string, string> | null;
  unitPrice: string;
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

  // Build conditions
  const conditions: ReturnType<typeof eq>[] = [eq(orders.tenantId, tenantId)];

  // Shift filter
  if (filters.dateRange === "thisShift" && filters.shiftId) {
    conditions.push(eq(orders.shiftId, filters.shiftId));
  }

  // Date range filter (Macau timezone = Asia/Macau = UTC+8)
  const tz = "Asia/Macau";
  if (filters.dateRange === "today") {
    conditions.push(sql`${orders.createdAt} >= (CURRENT_TIMESTAMP AT TIME ZONE ${tz})::date`);
  } else if (filters.dateRange === "yesterday") {
    conditions.push(sql`${orders.createdAt} >= ((CURRENT_TIMESTAMP AT TIME ZONE ${tz})::date - INTERVAL '1 day')`);
    conditions.push(sql`${orders.createdAt} < (CURRENT_TIMESTAMP AT TIME ZONE ${tz})::date`);
  } else if (filters.dateRange === "last7days") {
    conditions.push(sql`${orders.createdAt} >= ((CURRENT_TIMESTAMP AT TIME ZONE ${tz})::date - INTERVAL '7 days')`);
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
    total: String(r.total),
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
      lineTotal: String(item.lineTotal),
    };
    if (!items[item.orderId]) items[item.orderId] = [];
    items[item.orderId].push(serialized);
  }

  return { orders: serializedOrders, items };
}
