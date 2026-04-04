"use server";

import {
  db,
  orders,
  orderItems,
  payments,
  carts,
  cartItems,
  products,
  locations,
  deliveryZones,
  eq,
  and,
  sql,
} from "@macau-pos/database";
import { resolveTenant } from "@/lib/tenant-resolver";
import { getCart } from "./cart";
import { getCurrentCustomer } from "./auth";
import { revalidatePath } from "next/cache";

type ShippingAddress = {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  district?: string;
  city: string;
  postalCode?: string;
};

type CreateOrderInput = {
  deliveryMethod: "delivery" | "pickup";
  deliveryZoneId?: string;
  pickupLocationId?: string;
  shippingAddress?: ShippingAddress;
  paymentMethod: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
};

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, ""); // e.g., "260405"
  const random = String(Math.floor(Math.random() * 1e12)).padStart(12, "0");
  return `OD${date}${random}`;
}

export async function createOrder(input: CreateOrderInput) {
  const tenant = await resolveTenant();
  if (!tenant) return { error: "Tenant not found" };

  const cart = await getCart();
  if (!cart || cart.items.length === 0) return { error: "Cart is empty" };

  const customer = await getCurrentCustomer();

  // Get location
  const [location] = await db
    .select()
    .from(locations)
    .where(eq(locations.tenantId, tenant.id))
    .limit(1);

  if (!location) return { error: "No store location configured" };

  // Calculate delivery fee
  let deliveryFee = 0;
  let estimatedDeliveryAt: Date | null = null;

  if (input.deliveryMethod === "delivery" && input.deliveryZoneId) {
    const [zone] = await db
      .select()
      .from(deliveryZones)
      .where(
        and(
          eq(deliveryZones.id, input.deliveryZoneId),
          eq(deliveryZones.tenantId, tenant.id),
        )
      )
      .limit(1);

    if (zone) {
      const fee = parseFloat(String(zone.fee));
      const freeAbove = zone.freeAbove ? parseFloat(String(zone.freeAbove)) : null;
      deliveryFee = (freeAbove && cart.subtotal >= freeAbove) ? 0 : fee;

      if (zone.estimatedMinutes) {
        estimatedDeliveryAt = new Date(Date.now() + zone.estimatedMinutes * 60 * 1000);
      }
    }
  }

  const total = cart.subtotal + deliveryFee;
  const orderNumber = generateOrderNumber();

  // Create order
  const [order] = await db
    .insert(orders)
    .values({
      tenantId: tenant.id,
      locationId: location.id,
      orderNumber,
      status: "pending",
      subtotal: String(cart.subtotal.toFixed(2)),
      discountAmount: "0",
      taxAmount: "0",
      total: String(total.toFixed(2)),
      itemCount: cart.itemCount,
      currency: "MOP",
      notes: input.notes || null,
      customerId: customer?.id || null,
      channel: "online",
      fulfillmentStatus: "pending",
      deliveryMethod: input.deliveryMethod,
      shippingAddress: input.deliveryMethod === "delivery" ? input.shippingAddress : null,
      deliveryFee: String(deliveryFee.toFixed(2)),
      estimatedDeliveryAt,
      pickupLocationId: input.deliveryMethod === "pickup" ? (input.pickupLocationId || location.id) : null,
    })
    .returning();

  // Create order items (snapshot product data at time of purchase)
  const itemValues = cart.items.map((item) => ({
    orderId: order.id,
    productId: item.productId,
    variantId: item.variantId,
    name: item.name,
    translations: item.translations || {},
    unitPrice: String(item.price.toFixed(2)),
    quantity: item.quantity,
    lineTotal: String((item.price * item.quantity).toFixed(2)),
  }));

  await db.insert(orderItems).values(itemValues);

  // Create payment record
  // Map online payment methods to existing enum values for now
  // The enum was extended with mpay, alipay, wechat_pay, visa, mastercard in migration
  await db.insert(payments).values({
    orderId: order.id,
    method: input.paymentMethod as any,
    amount: String(total.toFixed(2)),
  });

  // Decrease stock for each item
  for (const item of cart.items) {
    if (item.stock !== null) {
      await db
        .update(products)
        .set({ stock: sql`greatest(0, ${products.stock} - ${item.quantity})` })
        .where(eq(products.id, item.productId));
    }
  }

  // Clear cart
  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  await db.delete(carts).where(eq(carts.id, cart.id));

  revalidatePath("/", "layout");
  return { success: true, orderId: order.id, orderNumber };
}
