"use server";

import {
  db,
  orders,
  orderItems,
  payments,
  tenants,
  eq,
  sql,
  DEMO_TENANT_SLUG,
} from "@macau-pos/database";

type CartItemInput = {
  productId: string;
  name: string;
  nameCn: string;
  unitPrice: number;
  quantity: number;
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

async function getTenantId(): Promise<string> {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, DEMO_TENANT_SLUG))
    .limit(1);
  if (!tenant) throw new Error(`Tenant '${DEMO_TENANT_SLUG}' not found`);
  return tenant.id;
}

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
    const tenantId = await getTenantId();
    const datePrefix = buildDatePrefix();
    const itemCount = input.cart.reduce((sum, item) => sum + item.quantity, 0);

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

      // Insert order
      const [order] = await tx
        .insert(orders)
        .values({
          tenantId,
          orderNumber,
          status: "completed",
          subtotal: input.subtotal.toFixed(2),
          total: input.total.toFixed(2),
          itemCount,
          currency: "MOP",
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      // Insert order items
      await tx.insert(orderItems).values(
        input.cart.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          name: item.name,
          nameCn: item.nameCn,
          unitPrice: item.unitPrice.toFixed(2),
          quantity: item.quantity,
          lineTotal: (item.unitPrice * item.quantity).toFixed(2),
        }))
      );

      // Insert payment
      await tx.insert(payments).values({
        orderId: order.id,
        method: input.paymentMethod,
        amount: input.total.toFixed(2),
        cashReceived: input.cashReceived?.toFixed(2) ?? null,
        changeGiven: input.changeGiven?.toFixed(2) ?? null,
      });

      return order.orderNumber;
    });

    return { success: true, orderNumber: result };
  } catch (error) {
    console.error("Failed to create order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
