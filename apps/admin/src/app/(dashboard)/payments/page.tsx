import { getPaymentTransactions, getPaymentStats } from "@/lib/queries";
import PaymentsClient from "./payments-client";

export const metadata = { title: "Payments & invoices" };

export default async function PaymentsPage() {
  let transactions = [];
  let stats = { todayAmount: "0", todayCount: 0, methodBreakdown: [] };
  try {
    [transactions, stats] = await Promise.all([
      getPaymentTransactions(),
      getPaymentStats(),
    ]);
  } catch (error) {
    console.error("Failed to fetch payments:", error);
  }
  return <PaymentsClient transactions={transactions} stats={stats} />;
}
