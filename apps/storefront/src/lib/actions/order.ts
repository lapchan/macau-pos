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
import { cookies } from "next/headers";
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
  // Intellipay payment_service radio value: simplepay | mpay | alipay | wechat_pay
  paymentService: string;
  locale: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
};

type CreateOrderResult =
  | {
      success: true;
      orderId: string;
      orderNumber: string;
      paymentUrl?: string;
    }
  | { success: false; error: string };

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(2, 10).replace(/-/g, ""); // e.g., "260405"
  const random = String(Math.floor(Math.random() * 1e12)).padStart(12, "0");
  return `OD${date}${random}`;
}

// Webhook URL simpaylicity calls on paid/failed/etc. Handler lives in the
// storefront app (/api/webhooks/intellipay/[tenantSlug]/[webhookSlug]), so
// we route it back to the tenant's own subdomain — same pattern as POS.
function buildWebhookUrl(tenantSlug: string, webhookSlug: string): string {
  const base = process.env.INTELLIPAY_WEBHOOK_BASE_URL?.replace(/\/+$/, "");
  if (base) {
    return `${base}/api/webhooks/intellipay/${tenantSlug}/${webhookSlug}`;
  }
  const platform = process.env.PLATFORM_DOMAIN || "hkretailai.com";
  return `https://${tenantSlug}.store.${platform}/api/webhooks/intellipay/${tenantSlug}/${webhookSlug}`;
}

function buildCallbackUrl(
  tenantSlug: string,
  locale: string,
  orderNumber: string,
): string {
  const base = process.env.STOREFRONT_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (base) {
    return `${base}/${locale}/checkout/confirmation?order=${orderNumber}`;
  }
  const platform = process.env.PLATFORM_DOMAIN || "hkretailai.com";
  return `https://${tenantSlug}.store.${platform}/${locale}/checkout/confirmation?order=${orderNumber}`;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const tenant = await resolveTenant();
  if (!tenant) return { success: false, error: "Tenant not found" };

  const cart = await getCart();
  if (!cart || cart.items.length === 0) return { success: false, error: "Cart is empty" };

  const customer = await getCurrentCustomer();

  const [location] = await db
    .select()
    .from(locations)
    .where(eq(locations.tenantId, tenant.id))
    .limit(1);

  if (!location) return { success: false, error: "No store location configured" };

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
    return { success: false, error: "Payment gateway is not configured for this store." };
  }

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
  const currency = tenant.currency || "MOP";

  // Create order + items + stock decrement inside a tx. Intellipay is called
  // outside the tx so the network roundtrip doesn't hold a DB connection.
  const dbResult = await db.transaction(async (tx) => {
    const [order] = await tx
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
        currency,
        notes: input.notes || null,
        customerId: customer?.id || null,
        channel: "online",
        fulfillmentStatus: "pending",
        deliveryMethod: input.deliveryMethod,
        shippingAddress: input.deliveryMethod === "delivery" ? input.shippingAddress : null,
        deliveryFee: String(deliveryFee.toFixed(2)),
        estimatedDeliveryAt,
        pickupLocationId:
          input.deliveryMethod === "pickup" ? input.pickupLocationId || location.id : null,
      })
      .returning();

    await tx.insert(orderItems).values(
      cart.items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        translations: item.translations || {},
        unitPrice: String(item.price.toFixed(2)),
        quantity: item.quantity,
        lineTotal: String((item.price * item.quantity).toFixed(2)),
      })),
    );

    // Optimistic stock decrement so the same SKU can't oversell while the
    // customer is on the hosted checkout page. Restored on failure/void.
    for (const item of cart.items) {
      if (item.stock !== null) {
        await tx
          .update(products)
          .set({ stock: sql`greatest(0, ${products.stock} - ${item.quantity})` })
          .where(eq(products.id, item.productId));
      }
    }

    return { orderId: order.id, orderNumber: order.orderNumber };
  });

  const webhookUrl = buildWebhookUrl(tenant.slug, paymentConfig.webhookSlug);
  const callbackUrl = buildCallbackUrl(tenant.slug, input.locale, dbResult.orderNumber);
  const amountCents = Math.round(total * 100);

  const ipResult = await createOnlinePayment(
    {
      accessKeyId: paymentConfig.accessKeyId,
      privateKeyPemEncrypted: paymentConfig.privateKeyPemEncrypted,
    },
    {
      order_id: dbResult.orderNumber,
      order_amount: amountCents,
      order_currency: currency,
      subject: `Order ${dbResult.orderNumber}`,
      payment_service: input.paymentService || "simplepay",
      callback_url: callbackUrl,
      webhook_url: webhookUrl,
      ...(paymentConfig.merchantId ? { merchant_id: paymentConfig.merchantId } : {}),
      ...(paymentConfig.operatorId ? { operator_id: paymentConfig.operatorId } : {}),
    },
    { idempotencyKey: randomUUID() },
  );

  if (!ipResult.ok) {
    console.error("[storefront createOrder] intellipay failed", {
      code: ipResult.errorCode,
      type: ipResult.errorType,
      message: ipResult.message,
      requestId: ipResult.requestId,
      raw: ipResult.raw,
    });
    await voidOrderAndRestoreStock(dbResult.orderId, cart.items);
    return { success: false, error: `Payment gateway error: ${ipResult.message}` };
  }

  if (!ipResult.data.payment_url) {
    console.error("[storefront createOrder] intellipay returned no payment_url", ipResult.data);
    await voidOrderAndRestoreStock(dbResult.orderId, cart.items);
    return { success: false, error: "Payment gateway did not return a checkout URL." };
  }

  await db.insert(payments).values({
    orderId: dbResult.orderId,
    method: "online",
    amount: String(total.toFixed(2)),
    provider: "intellipay",
    intellipayPaymentId: ipResult.data.payment_id,
    intellipayOrderId: ipResult.data.order_id ?? dbResult.orderNumber,
    intellipayPaymentService:
      ipResult.data.payment_service ?? input.paymentService ?? null,
    intellipayStatus: ipResult.data.status ?? null,
    intellipayStatusDesc: ipResult.data.status_desc ?? null,
    intellipayPaymentUrl: ipResult.data.payment_url,
    intellipayProviderCode: ipResult.data.provider_code ?? null,
    intellipayWebhookUrl: webhookUrl,
    intellipayRequestId: ipResult.requestId,
  });

  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  await db.delete(carts).where(eq(carts.id, cart.id));

  const cookieStore = await cookies();
  cookieStore.set("pending_payment_order", dbResult.orderNumber, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 20,
  });

  return {
    success: true,
    orderId: dbResult.orderId,
    orderNumber: dbResult.orderNumber,
    paymentUrl: ipResult.data.payment_url,
  };
}

type CartItemForRestore = {
  productId: string;
  quantity: number;
  stock: number | null;
};

async function voidOrderAndRestoreStock(
  orderId: string,
  items: CartItemForRestore[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(orders).set({ status: "voided" }).where(eq(orders.id, orderId));
    for (const item of items) {
      if (item.stock !== null) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }
    }
  });
}
