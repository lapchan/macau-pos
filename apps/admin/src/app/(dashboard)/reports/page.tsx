import {
  getReportSummary,
  getSalesByDate,
  getTopProductsByRevenue,
  getSalesByCategory,
  getPaymentMethodBreakdown,
} from "@/lib/queries";
import ReportsClient from "./reports-client";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  let summary = { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 };
  let salesByDate: { date: string; orders: number; revenue: string }[] = [];
  let topProducts: { name: string; quantity: string; revenue: string }[] = [];
  let salesByCategory: { category: string; categoryEn: string; orders: number; revenue: string }[] = [];
  let paymentBreakdown: { method: string; count: number; total: string }[] = [];

  try {
    [summary, salesByDate, topProducts, salesByCategory, paymentBreakdown] = await Promise.all([
      getReportSummary(),
      getSalesByDate(30),
      getTopProductsByRevenue(10),
      getSalesByCategory(),
      getPaymentMethodBreakdown(),
    ]);
  } catch (error) {
    console.error("Failed to fetch report data:", error);
  }

  return (
    <ReportsClient
      summary={summary}
      salesByDate={salesByDate.map((d) => ({
        date: String(d.date),
        orders: Number(d.orders),
        revenue: parseFloat(d.revenue),
      }))}
      topProducts={topProducts.map((p) => ({
        name: p.name,
        quantity: Number(p.quantity),
        revenue: parseFloat(p.revenue),
      }))}
      salesByCategory={salesByCategory.map((c) => ({
        category: c.categoryEn || c.category,
        orders: Number(c.orders),
        revenue: parseFloat(c.revenue),
      }))}
      paymentBreakdown={paymentBreakdown.map((p) => ({
        method: p.method,
        count: Number(p.count),
        total: parseFloat(p.total),
      }))}
    />
  );
}
