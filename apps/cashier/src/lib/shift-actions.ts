"use server";

import {
  db,
  shifts,
  orders,
  payments,
  eq,
  and,
  sql,
  sum,
  count,
  logCashEvent,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";

type ShiftResult = {
  success: boolean;
  error?: string;
  data?: { id: string };
};

// ─── Open Shift ──────────────────────────────────────────
export async function openShift(openingFloat: number): Promise<ShiftResult> {
  try {
    const session = await getAuthSession();
    if (!session?.tenantId || !session.userId) {
      return { success: false, error: "No active session" };
    }

    // Check for existing open shift on this terminal
    const existing = await db
      .select({ id: shifts.id })
      .from(shifts)
      .where(
        and(
          eq(shifts.tenantId, session.tenantId),
          eq(shifts.cashierId, session.userId),
          eq(shifts.status, "open")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "You already have an open shift" };
    }

    const [shift] = await db
      .insert(shifts)
      .values({
        tenantId: session.tenantId,
        locationId: session.locationId!,
        cashierId: session.userId,
        terminalId: session.terminalId || null,
        openingFloat: openingFloat.toFixed(2),
        status: "open",
      })
      .returning({ id: shifts.id });

    // Log opening float to cash ledger
    await logCashEvent({
      tenantId: session.tenantId,
      locationId: session.locationId!,
      shiftId: shift.id,
      terminalId: session.terminalId || null,
      eventType: "shift_open",
      creditAmount: openingFloat,
      recordedBy: session.userId,
      reason: "Opening float",
    });

    return { success: true, data: { id: shift.id } };
  } catch (err) {
    console.error("openShift error:", err);
    return { success: false, error: "Failed to open shift" };
  }
}

// ─── Get Active Shift ────────────────────────────────────
export async function getActiveShift() {
  const session = await getAuthSession();
  if (!session?.userId) return null;

  const [shift] = await db
    .select({
      id: shifts.id,
      openedAt: shifts.openedAt,
      openingFloat: shifts.openingFloat,
      totalSales: shifts.totalSales,
      totalOrders: shifts.totalOrders,
      status: shifts.status,
    })
    .from(shifts)
    .where(
      and(
        eq(shifts.cashierId, session.userId),
        eq(shifts.status, "open")
      )
    )
    .limit(1);

  return shift || null;
}

// ─── Get Shift Summary ───────────────────────────────────
export async function getShiftSummary(shiftId: string) {
  const session = await getAuthSession();
  if (!session?.tenantId) return null;

  const [shift] = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.id, shiftId), eq(shifts.tenantId, session.tenantId)))
    .limit(1);

  if (!shift) return null;

  // Get order aggregates for this shift (exclude voided/refunded)
  const [orderStats] = await db
    .select({
      totalOrders: count(),
      totalSales: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)`,
    })
    .from(orders)
    .where(and(eq(orders.shiftId, shiftId), eq(orders.status, "completed")));

  // Get payment breakdown (exclude voided/refunded)
  const paymentRows = await db
    .select({
      method: payments.method,
      total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
      count: count(),
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(and(eq(orders.shiftId, shiftId), eq(orders.status, "completed")))
    .groupBy(payments.method);

  const paymentBreakdown: Record<string, number> = {};
  for (const row of paymentRows) {
    paymentBreakdown[row.method] = parseFloat(row.total);
  }

  const cashTotal = paymentBreakdown["cash"] || 0;
  const expectedCash = parseFloat(shift.openingFloat) + cashTotal;

  return {
    ...shift,
    liveOrders: orderStats?.totalOrders || 0,
    liveSales: parseFloat(orderStats?.totalSales || "0"),
    paymentBreakdown,
    expectedCash,
    cashTotal,
  };
}

// ─── Close Shift ─────────────────────────────────────────
const VARIANCE_TOLERANCE = 5; // MOP ±5

export async function closeShift(
  shiftId: string,
  actualCash: number,
  notes?: string
): Promise<ShiftResult> {
  try {
    const session = await getAuthSession();
    if (!session?.tenantId || !session.userId) {
      return { success: false, error: "No active session" };
    }

    // Get shift summary for calculations
    const summary = await getShiftSummary(shiftId);
    if (!summary) return { success: false, error: "Shift not found" };
    if (summary.status !== "open") return { success: false, error: "Shift is not open" };

    const expectedCash = summary.expectedCash;
    const variance = actualCash - expectedCash;
    const withinTolerance = Math.abs(variance) <= VARIANCE_TOLERANCE;
    const newStatus = withinTolerance ? "closed" : "pending_approval";

    await db
      .update(shifts)
      .set({
        closedAt: new Date(),
        expectedCash: expectedCash.toFixed(2),
        actualCash: actualCash.toFixed(2),
        variance: variance.toFixed(2),
        totalSales: summary.liveSales.toFixed(2),
        totalOrders: summary.liveOrders,
        paymentBreakdown: summary.paymentBreakdown,
        status: newStatus as "closed" | "pending_approval",
        notes: notes || null,
      })
      .where(and(eq(shifts.id, shiftId), eq(shifts.tenantId, session.tenantId)));

    // Log shift close to cash ledger
    await logCashEvent({
      tenantId: session.tenantId,
      locationId: summary.locationId,
      shiftId,
      terminalId: summary.terminalId || null,
      eventType: "shift_close",
      recordedBy: session.userId,
      reason: `Shift closed. Expected: ${expectedCash.toFixed(2)}, Actual: ${actualCash.toFixed(2)}, Variance: ${variance.toFixed(2)}`,
      notes: notes || undefined,
    });

    return { success: true };
  } catch (err) {
    console.error("closeShift error:", err);
    return { success: false, error: "Failed to close shift" };
  }
}

// ─── Fetch Cash Log for Drawer Ledger ───────────────────────
export async function fetchCashLog(shiftId: string) {
  const { getCashLogByShift } = await import("@macau-pos/database");
  const entries = await getCashLogByShift(shiftId);
  // Serialize dates for client
  return entries.map(e => ({
    ...e,
    creditAmount: String(e.creditAmount),
    debitAmount: String(e.debitAmount),
    balanceAfter: String(e.balanceAfter),
    createdAt: new Date(e.createdAt),
  }));
}
