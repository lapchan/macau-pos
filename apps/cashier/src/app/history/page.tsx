import { getRecentOrders } from "@/lib/queries";
import HistoryClient from "./history-client";

export default async function HistoryPage() {
  const orders = await getRecentOrders();
  return <HistoryClient orders={orders} />;
}
