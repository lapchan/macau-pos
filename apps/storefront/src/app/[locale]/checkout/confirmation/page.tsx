import { notFound } from "next/navigation";
import { getDisplayName } from "@macau-pos/database";
import OrderSummary from "@/components/checkout/order-summary";
import PaymentStatusBanner from "@/components/checkout/payment-status-banner";
import { resolveTenant } from "@/lib/tenant-resolver";
import { getOrderByNumber } from "@/lib/storefront-queries";
import { getOnlinePaymentStatus } from "@/lib/actions/intellipay-status";
import { getPaymentLabel } from "@/lib/payment-labels";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
};

type ResolvedStatus = "pending" | "completed" | "refunded" | "voided";

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const orderNumber = sp.order;

  if (!orderNumber) notFound();

  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const order = await getOrderByNumber(tenant.id, orderNumber);
  if (!order) notFound();

  // Server-side status resolution: if the DB still shows pending, ask
  // intellipay directly (5s timeout, falls back to DB on error). This
  // eliminates the "Waiting for payment" flash when the user returns from
  // the hosted page faster than the webhook fires.
  let initialStatus: ResolvedStatus =
    order.status === "completed" || order.status === "refunded" || order.status === "voided"
      ? order.status
      : "pending";

  if (initialStatus === "pending") {
    const live = await getOnlinePaymentStatus(order.orderNumber);
    if (live.success) {
      initialStatus = live.data.orderStatus;
    }
  }

  const shippingAddr = order.shippingAddress as
    | { recipientName?: string; addressLine1?: string; city?: string }
    | null;

  const paymentMethod = order.paymentMethod || order.paymentService
    ? getPaymentLabel(locale, order.paymentService, order.paymentMethod)
    : undefined;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <PaymentStatusBanner
        orderNumber={order.orderNumber}
        initialStatus={initialStatus}
        locale={locale}
      />
      <OrderSummary
        orderNumber={order.orderNumber}
        orderDate={order.createdAt.toISOString().slice(0, 10)}
        status={initialStatus}
        items={order.items.map((item) => ({
          name: getDisplayName(item.name, item.translations as Record<string, string>, locale),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          image: item.image,
        }))}
        subtotal={parseFloat(String(order.subtotal))}
        deliveryFee={parseFloat(String(order.deliveryFee || "0"))}
        discount={parseFloat(String(order.discountAmount || "0"))}
        tax={parseFloat(String(order.taxAmount || "0"))}
        total={parseFloat(String(order.total))}
        paymentMethod={paymentMethod}
        shippingAddress={shippingAddr ? {
          name: shippingAddr.recipientName || "",
          address: shippingAddr.addressLine1 || "",
          city: shippingAddr.city || undefined,
        } : undefined}
        locale={locale}
      />
    </div>
  );
}
