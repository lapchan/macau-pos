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
  tenantPaymentConfigs,
  createOnlinePayment,
  eq,
  and,
  sql,
} from "@macau-pos/database";
import { resolveTenant } from "@/lib/tenant-resolver";
import { getCart } from "./cart";
import { getCurrentCustomer } from "./auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";

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
  // Intellipay payment_service: simplepay | mpay | alipay | wechat_pay
  paymentService: string;
  locale: string;
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

  // Look up tenant's Intellipay config. Online checkout requires it — we call
  // the gateway BEFORE writing any order rows so a gateway failure leaves no
  // orphaned pending orders behind.
  const [paymentConfig] = await db
    .select()
    .from(tenantPaymentConfigs)
    .where(eq(tenantPaymentConfigs.tenantId, tenant.id))
    .limit(1);

  if (
    !paymentConfig ||
    !paymentConfig.intellipayEnabled ||
    !paymentConfig.accessKeyId ||
    !paymentConfig.privateKeyPemEncrypted ||
    !paymentConfig.webhookSlug
  ) {
    return { error: "Online payment is not configured for this store." };
  }

  // Build callback (browser return) and webhook (server-to-server) URLs from
  // the current request host so dev/prod/custom-domain all resolve correctly.
  const h = await headers();
  const host = h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = `${proto}://${host}`;
  const callbackUrl = `${baseUrl}/${input.locale}/checkout/confirmation?order=${orderNumber}`;
  const webhookUrl = `${baseUrl}/api/webhooks/intellipay/${tenant.slug}/${paymentConfig.webhookSlug}`;

  const amountCents = Math.round(total * 100);
  const result = await createOnlinePayment(
    {
      accessKeyId: paymentConfig.accessKeyId,
      privateKeyPemEncrypted: paymentConfig.privateKeyPemEncrypted,
    },
    {
      order_id: orderNumber,
      order_amount: amountCents,
      order_currency: "MOP",
      subject: `Order ${orderNumber}`,
      payment_service: input.paymentService || "simplepay",
      callback_url: callbackUrl,
      webhook_url: webhookUrl,
      ...(paymentConfig.merchantId ? { merchant_id: paymentConfig.merchantId } : {}),
      ...(paymentConfig.operatorId ? { operator_id: paymentConfig.operatorId } : {}),
    },
    { idempotencyKey: randomUUID() },
  );

  if (!result.ok) {
    console.error("[createOrder] intellipay create failed", {
      code: result.errorCode,
      type: result.errorType,
      message: result.message,
      requestId: result.requestId,
    });
    return { error: `Payment gateway error: ${result.message}` };
  }

  // Gateway accepted the payment. Now persist the order, items, and payment.
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

  await db.insert(payments).values({
    orderId: order.id,
    method: "online",
    amount: String(total.toFixed(2)),
    provider: "intellipay",
    intellipayPaymentId: result.data.payment_id,
    intellipayOrderId: result.data.order_id ?? orderNumber,
    intellipayPaymentService: result.data.payment_service ?? input.paymentService ?? null,
    intellipayTerminalId: result.data.terminal_id ?? null,
    intellipayStatus: result.data.status ?? null,
    intellipayStatusDesc: result.data.status_desc ?? null,
    intellipayPaymentUrl: result.data.payment_url,
    intellipayQrCodeUrl: result.data.qr_code_url ?? null,
    intellipayProviderCode: result.data.provider_code ?? null,
    intellipayWebhookUrl: webhookUrl,
    intellipayRequestId: result.requestId,
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
  return {
    success: true,
    orderId: order.id,
    orderNumber,
    paymentUrl: result.data.payment_url,
  };
}
