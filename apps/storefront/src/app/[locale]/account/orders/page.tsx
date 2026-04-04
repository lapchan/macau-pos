import OrderHistoryList from "@/components/account/order-history-list";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const t = (tc: string, en: string) => locale === "en" ? en : tc;

  // TODO: Load orders from DB via customer session
  const orders: [] = [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        {t("我的訂單", "My Orders")}
      </h1>
      <div className="mt-8">
        <OrderHistoryList orders={orders} locale={locale} />
      </div>
    </div>
  );
}
