import { notFound } from "next/navigation";
import { getDisplayName } from "@macau-pos/database";
import OrderSummary from "@/components/checkout/order-summary";
import { resolveTenant } from "@/lib/tenant-resolver";
import { getOrderByNumber } from "@/lib/storefront-queries";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
};

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const orderNumber = sp.order;

  if (!orderNumber) notFound();

  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const order = await getOrderByNumber(tenant.id, orderNumber);
  if (!order) notFound();

  const shippingAddr = order.shippingAddress as { recipientName?: string; addressLine1?: string; city?: string } | null;

  return (
    <OrderSummary
      variant="with-progress"
      orderNumber={order.orderNumber}
      orderDate={order.createdAt.toISOString().slice(0, 10)}
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
      paymentMethod={order.paymentMethod ? paymentLabel(order.paymentMethod) : undefined}
      shippingAddress={shippingAddr ? {
        name: shippingAddr.recipientName || "",
        address: shippingAddr.addressLine1 || "",
        city: shippingAddr.city || "Macau",
      } : undefined}
      locale={locale}
    />
  );
}

function paymentLabel(method: string): string {
  const labels: Record<string, string> = {
    mpay: "MPay",
    alipay: "Alipay",
    wechat_pay: "WeChat Pay",
    visa: "Visa",
    mastercard: "Mastercard",
    cash: "Cash",
  };
  return labels[method] || method;
}
