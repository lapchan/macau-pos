import OrderConfirmation from "@/components/checkout/order-confirmation";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // TODO: Load actual order from query param or session
  // For now, show a demo confirmation
  return (
    <OrderConfirmation
      receiptNo="OD260405000000000000"
      items={[]}
      subtotal={0}
      deliveryFee={0}
      total={0}
      deliveryMethod="delivery"
      locale={locale}
    />
  );
}
