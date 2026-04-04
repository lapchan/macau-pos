"use server";

import {
  getReportSummary,
  getSalesByDate,
  getTopProductsByRevenue,
  getSalesByCategory,
  getPaymentMethodBreakdown,
} from "./queries";

export async function fetchReportData(days: number) {
  const [summary, salesByDate, topProducts, salesByCategory, paymentBreakdown] = await Promise.all([
    getReportSummary(),
    getSalesByDate(days),
    getTopProductsByRevenue(10),
    getSalesByCategory(),
    getPaymentMethodBreakdown(),
  ]);

  return {
    summary,
    salesByDate: salesByDate.map((d) => ({
      date: String(d.date),
      orders: Number(d.orders),
      revenue: parseFloat(d.revenue),
    })),
    topProducts: topProducts.map((p) => ({
      name: p.name,
      quantity: Number(p.quantity),
      revenue: parseFloat(p.revenue),
    })),
    salesByCategory: salesByCategory.map((c) => ({
      category: c.categoryEn || c.category,
      orders: Number(c.orders),
      revenue: parseFloat(c.revenue),
    })),
    paymentBreakdown: paymentBreakdown.map((p) => ({
      method: p.method,
      count: Number(p.count),
      total: parseFloat(p.total),
    })),
  };
}
