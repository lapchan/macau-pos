/**
 * Cash-flow ledger helper — logs immutable cash events with running balance.
 */

import { db } from "./client";
import { terminalCashLog } from "./schema";
import { eq, and, desc, sql } from "drizzle-orm";

export type CashEventParams = {
  tenantId: string;
  locationId: string;
  shiftId: string | null;
  terminalId: string | null;
  eventType: string;
  creditAmount?: number;
  debitAmount?: number;
  orderId?: string | null;
  paymentId?: string | null;
  recordedBy: string;
  authorizedBy?: string | null;
  reason?: string;
  notes?: string;
};

/**
 * Log a cash event and compute running balance.
 * Balance = previous balance + credit - debit.
 */
export async function logCashEvent(params: CashEventParams) {
  const credit = params.creditAmount || 0;
  const debit = params.debitAmount || 0;

  // Get last balance for this shift (or terminal if no shift)
  let prevBalance = 0;
  if (params.shiftId) {
    const [last] = await db
      .select({ balanceAfter: terminalCashLog.balanceAfter })
      .from(terminalCashLog)
      .where(eq(terminalCashLog.shiftId, params.shiftId))
      .orderBy(desc(terminalCashLog.createdAt))
      .limit(1);
    if (last) prevBalance = parseFloat(last.balanceAfter);
  }

  const balanceAfter = prevBalance + credit - debit;

  await db.insert(terminalCashLog).values({
    tenantId: params.tenantId,
    locationId: params.locationId,
    shiftId: params.shiftId,
    terminalId: params.terminalId,
    eventType: params.eventType,
    creditAmount: credit.toFixed(2),
    debitAmount: debit.toFixed(2),
    balanceAfter: balanceAfter.toFixed(2),
    orderId: params.orderId || null,
    paymentId: params.paymentId || null,
    recordedBy: params.recordedBy,
    authorizedBy: params.authorizedBy || null,
    reason: params.reason || null,
    notes: params.notes || null,
  });

  return { balanceAfter };
}

/**
 * Get all cash log entries for a shift.
 */
export async function getCashLogByShift(shiftId: string) {
  return db
    .select()
    .from(terminalCashLog)
    .where(eq(terminalCashLog.shiftId, shiftId))
    .orderBy(terminalCashLog.createdAt);
}
