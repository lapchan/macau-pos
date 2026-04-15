"use server";

import {
  db,
  orders,
  orderItems,
  carts,
  cartItems,
  products,
  payments,
  eq,
  and,
  sql,
} from "@macau-pos/database";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveTenant } from "@/lib/tenant-resolver";
import { getCurrentCustomer } from "./auth";

const PENDING_COOKIE = "pending_payment_order";

async function findSessionCart(tenantId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sf_cart_session")?.value;
  const customer = await getCurrentCustomer();

  if (customer) {
    const [cart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(and(eq(carts.tenantId, tenantId), eq(carts.customerId, customer.id)))
      .limit(1);
    if (cart) return cart.id;
  }
  if (sessionToken) {
    const [cart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(and(eq(carts.tenantId, tenantId), eq(carts.sessionToken, sessionToken)))
      .limit(1);
    if (cart) return cart.id;
  }
  return null;
}

export async function clearCartAfterPayment(): Promise<void> {
  const tenant = await resolveTenant();
  if (!tenant) return;
  const cartId = await findSessionCart(tenant.id);
  if (!cartId) return;
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await db.delete(carts).where(eq(carts.id, cartId));
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_COOKIE);
}

// Compares the current session cart to the items on a pending order.
// If they match line-for-line (productId, variantId, quantity), the
// intellipay payment_url is still valid for the customer's cart and we
// send them straight back to the hosted page. If anything changed, the
// old order is voided (stock restored) and the customer is sent to
// /checkout to re-confirm with their edited cart.
export async function resumePayment(formData: FormData): Promise<void> {
  const orderNumber = formData.get("orderNumber") as string | null;
  const locale = (formData.get("locale") as string | null) || "en";
  if (!orderNumber) redirect(`/${locale}`);

  const tenant = await resolveTenant();
  if (!tenant) redirect(`/${locale}`);

  const [order] = await db
    .select({
      id: orders.id,
      status: orders.status,
      paymentUrl: payments.intellipayPaymentUrl,
    })
    .from(orders)
    .leftJoin(payments, eq(payments.orderId, orders.id))
    .where(
      and(
        eq(orders.tenantId, tenant.id),
        eq(orders.orderNumber, orderNumber!),
        eq(orders.channel, "online"),
      ),
    )
    .limit(1);

  if (!order || order.status !== "pending" || !order.paymentUrl) {
    const cookieStore = await cookies();
    cookieStore.delete(PENDING_COOKIE);
    redirect(`/${locale}`);
  }

  const orderLines = await db
    .select({
      productId: orderItems.productId,
      variantId: orderItems.variantId,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order!.id));

  const cartId = await findSessionCart(tenant.id);
  const cartLines = cartId
    ? await db
        .select({
          productId: cartItems.productId,
          variantId: cartItems.variantId,
          quantity: cartItems.quantity,
        })
        .from(cartItems)
        .where(eq(cartItems.cartId, cartId))
    : [];

  const key = (p: string | null, v: string | null) => `${p ?? ""}|${v ?? ""}`;
  const orderMap = new Map<string, number>();
  for (const l of orderLines) orderMap.set(key(l.productId, l.variantId), l.quantity);
  const cartMap = new Map<string, number>();
  for (const l of cartLines) cartMap.set(key(l.productId, l.variantId), l.quantity);

  let unchanged = orderMap.size === cartMap.size;
  if (unchanged) {
    for (const [k, qty] of orderMap) {
      if (cartMap.get(k) !== qty) {
        unchanged = false;
        break;
      }
    }
  }

  if (unchanged) {
    redirect(order!.paymentUrl!);
  }

  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status: "voided" }).where(eq(orders.id, order!.id));
    for (const l of orderLines) {
      if (l.productId) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${l.quantity}` })
          .where(eq(products.id, l.productId));
      }
    }
  });
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_COOKIE);
  redirect(`/${locale}/checkout`);
}
