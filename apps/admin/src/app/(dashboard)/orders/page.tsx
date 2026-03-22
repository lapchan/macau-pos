import { getOrders, getOrderStats } from "@/lib/queries";
import OrdersClient from "./orders-client";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  let orderRows: Awaited<ReturnType<typeof getOrders>> = [];
  let stats: Awaited<ReturnType<typeof getOrderStats>> = {
    todayOrders: 0,
    todayRevenue: 0,
    weekOrders: 0,
    weekRevenue: 0,
  };

  try {
    [orderRows, stats] = await Promise.all([getOrders(), getOrderStats()]);
  } catch (error) {
    console.error("Failed to fetch orders from DB, using empty state:", error);
  }

  return <OrdersClient orders={orderRows} stats={stats} />;
}
