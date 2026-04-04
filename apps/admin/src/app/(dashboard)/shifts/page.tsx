import { getShifts, getShiftStats } from "@/lib/shift-queries";
import ShiftsClient from "./shifts-client";

export const metadata = { title: "Shifts" };

export default async function ShiftsPage() {
  let shiftRows: Awaited<ReturnType<typeof getShifts>> = [];
  let stats: Awaited<ReturnType<typeof getShiftStats>> = { open: 0, pendingApproval: 0, closed: 0, flagged: 0 };

  try {
    [shiftRows, stats] = await Promise.all([getShifts(), getShiftStats()]);
  } catch (error) {
    console.error("Failed to fetch shifts:", error);
  }

  return <ShiftsClient shifts={shiftRows} stats={stats} />;
}
