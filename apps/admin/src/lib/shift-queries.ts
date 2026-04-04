import "server-only";
import {
  db,
  shifts,
  users,
  terminals,
  locations,
  eq,
  and,
  desc,
  sql,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";
import { getSelectedLocationId } from "./location-actions";

async function getTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("No active session");
  return session.tenantId;
}

export type ShiftFilters = {
  status?: string;
  cashierId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
};

export async function getShifts(filters: ShiftFilters = {}) {
  const tenantId = await getTenantId();
  const locationId = await getSelectedLocationId();

  const conditions: ReturnType<typeof eq>[] = [eq(shifts.tenantId, tenantId)];
  if (locationId) conditions.push(eq(shifts.locationId, locationId));
  if (filters.status) conditions.push(eq(shifts.status, filters.status as "open" | "pending_approval" | "closed" | "flagged"));
  if (filters.cashierId) conditions.push(eq(shifts.cashierId, filters.cashierId));
  if (filters.dateFrom) conditions.push(sql`${shifts.openedAt} >= ${filters.dateFrom}`);
  if (filters.dateTo) conditions.push(sql`${shifts.openedAt} <= ${filters.dateTo}`);

  return db
    .select({
      id: shifts.id,
      openedAt: shifts.openedAt,
      closedAt: shifts.closedAt,
      openingFloat: shifts.openingFloat,
      expectedCash: shifts.expectedCash,
      actualCash: shifts.actualCash,
      variance: shifts.variance,
      totalSales: shifts.totalSales,
      totalOrders: shifts.totalOrders,
      status: shifts.status,
      notes: shifts.notes,
      cashierName: users.name,
      terminalName: terminals.name,
      terminalCode: terminals.code,
      locationName: locations.name,
    })
    .from(shifts)
    .innerJoin(users, eq(shifts.cashierId, users.id))
    .leftJoin(terminals, eq(shifts.terminalId, terminals.id))
    .leftJoin(locations, eq(shifts.locationId, locations.id))
    .where(and(...conditions))
    .orderBy(desc(shifts.openedAt))
    .limit(filters.limit ?? 100);
}

export type ShiftRow = Awaited<ReturnType<typeof getShifts>>[number];

export async function getShiftStats() {
  const tenantId = await getTenantId();
  const locationId = await getSelectedLocationId();

  const conditions: ReturnType<typeof eq>[] = [eq(shifts.tenantId, tenantId)];
  if (locationId) conditions.push(eq(shifts.locationId, locationId));

  const [result] = await db
    .select({
      open: sql<number>`COUNT(*) FILTER (WHERE ${shifts.status} = 'open')`,
      pendingApproval: sql<number>`COUNT(*) FILTER (WHERE ${shifts.status} = 'pending_approval')`,
      closed: sql<number>`COUNT(*) FILTER (WHERE ${shifts.status} = 'closed')`,
      flagged: sql<number>`COUNT(*) FILTER (WHERE ${shifts.status} = 'flagged')`,
    })
    .from(shifts)
    .where(and(...conditions));

  return {
    open: Number(result?.open ?? 0),
    pendingApproval: Number(result?.pendingApproval ?? 0),
    closed: Number(result?.closed ?? 0),
    flagged: Number(result?.flagged ?? 0),
  };
}

export type ShiftStats = Awaited<ReturnType<typeof getShiftStats>>;

// ─── Cash Ledger ─────────────────────────────────────────
export async function getCashLogForShift(shiftId: string) {
  const { getCashLogByShift } = await import("@macau-pos/database");
  return getCashLogByShift(shiftId);
}

export type CashLogEntry = Awaited<ReturnType<typeof getCashLogForShift>>[number];
