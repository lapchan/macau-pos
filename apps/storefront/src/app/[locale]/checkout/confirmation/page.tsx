import OrderSummary from "@/components/checkout/order-summary";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ variant?: string }>;
};

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const variant = (sp.variant as "with-progress" | "with-large-images" | "with-split-image" | "simple-full-details") || "with-progress";

  // TODO: Load actual order from query param or session
  // For now, show demo data
  const demoItems = [
    { name: "寶礦力水特", description: "Pocari Sweat 500ml", quantity: 2, unitPrice: 12, image: null },
    { name: "維他檸檬茶", description: "Vita Lemon Tea 250ml", quantity: 1, unitPrice: 6.5, image: null },
    { name: "品客原味", description: "Pringles Original 70g", quantity: 1, unitPrice: 22, image: null },
  ];

  return (
    <OrderSummary
      variant={variant}
      orderNumber="OD260405001234567890"
      orderDate="2026-04-05"
      items={demoItems}
      subtotal={52.5}
      deliveryFee={15}
      total={67.5}
      paymentMethod="MPay"
      shippingAddress={{
        name: "陳大文",
        address: "澳門南灣大馬路123號",
        city: "澳門",
      }}
      locale={locale}
      heroImage="https://tailwindcss.com/plus-assets/img/ecommerce-images/confirmation-page-06-hero.jpg"
    />
  );
}
