import { getAnalyticsOverview, getSalesTrend, getTopProducts, getPaymentStats } from "@/lib/queries";
import InsightsClient from "./insights-client";

export const metadata = { title: "AI Insights" };

export default async function AIInsightsPage() {
  let overview = { totalRevenue: "0", totalOrders: 0, avgOrderValue: "0", totalProducts: 0 };
  let salesTrend: { date: string; revenue: string | null; orderCount: number }[] = [];
  let topProducts: { name: string; totalRevenue: string | null; totalQuantity: string | null }[] = [];
  let paymentStats = { todayAmount: "0", todayCount: 0, methodBreakdown: [] as { method: string; total: string; count: number }[] };
  try {
    [overview, salesTrend, topProducts, paymentStats] = await Promise.all([
      getAnalyticsOverview(),
      getSalesTrend(30),
      getTopProducts(10),
      getPaymentStats(),
    ]);
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
  }
  return <InsightsClient overview={overview} salesTrend={salesTrend} topProducts={topProducts} paymentStats={paymentStats} />;
}
