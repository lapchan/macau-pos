"use server";

import {
  db,
  orders,
  orderItems,
  products,
  eq,
  and,
  sql,
} from "@macau-pos/database";
import { resolveTenant } from "@/lib/tenant-resolver";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const PENDING_COOKIE = "pending_payment_order";

export async function voidPendingOrder(formData: FormData): Promise<void> {
  const orderNumber = formData.get("orderNumber") as string | null;
  const redirectTo = (formData.get("redirectTo") as string | null) || "/";
  if (!orderNumber) redirect(redirectTo);

  const tenant = await resolveTenant();
  if (!tenant) redirect(redirectTo);

  const [order] = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, tenant.id),
        eq(orders.orderNumber, orderNumber!),
        eq(orders.channel, "online"),
      ),
    )
    .limit(1);

  if (order && order.status === "pending") {
    const items = await db
      .select({ productId: orderItems.productId, quantity: orderItems.quantity })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    await db.transaction(async (tx) => {
      await tx
        .update(orders)
        .set({ status: "voided" })
        .where(eq(orders.id, order.id));
      for (const item of items) {
        if (item.productId) {
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${item.quantity}` })
            .where(eq(products.id, item.productId));
        }
      }
    });
  }

  const store = await cookies();
  store.delete(PENDING_COOKIE);
  redirect(redirectTo);
}
