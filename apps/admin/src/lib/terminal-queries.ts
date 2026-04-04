import "server-only";
import {
  db,
  terminals,
  users,
  orders,
  shifts,
  eq,
  and,
  sql,
  count,
  asc,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";
import { getSelectedLocationId } from "./location-actions";

async function getTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("No active session");
  return session.tenantId;
}

// ─── Get Terminals with current user and today's sales ────
export async function getTerminals() {
  const tenantId = await getTenantId();
  const locationId = await getSelectedLocationId();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Query 1: terminals with current user name
  const terminalRows = await db
    .select({
      id: terminals.id,
      name: terminals.name,
      code: terminals.code,
      location: terminals.location,
      status: terminals.status,
      lastHeartbeatAt: terminals.lastHeartbeatAt,
      activatedAt: terminals.activatedAt,
      currentUserId: terminals.currentUserId,
      currentUserName: users.name,
      notes: terminals.notes,
      activationCode: terminals.activationCode,
      deviceInfo: terminals.deviceInfo,
      createdAt: terminals.createdAt,
    })
    .from(terminals)
    .leftJoin(users, eq(terminals.currentUserId, users.id))
    .where(
      locationId
        ? and(eq(terminals.tenantId, tenantId), eq(terminals.locationId, locationId))
        : eq(terminals.tenantId, tenantId)
    )
    .orderBy(asc(terminals.code));

  // Query 2: today's order aggregates per terminal
  const salesRows = await db
    .select({
      terminalId: orders.terminalId,
      todayOrders: count(),
      todayRevenue: sql<string>`COALESCE(SUM(${orders.total}::numeric), 0)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, tenantId),
        sql`${orders.terminalId} IS NOT NULL`,
        sql`${orders.createdAt} >= ${todayStart.toISOString()}`
      )
    )
    .groupBy(orders.terminalId);

  // Build lookup map
  const salesMap = new Map(
    salesRows.map((r) => [r.terminalId, { todayOrders: r.todayOrders, todayRevenue: parseFloat(r.todayRevenue || "0") }])
  );

  // Query 3: active shifts per terminal
  const shiftRows = await db
    .select({
      terminalId: shifts.terminalId,
      shiftId: shifts.id,
      cashierName: users.name,
      openedAt: shifts.openedAt,
      totalOrders: shifts.totalOrders,
      totalSales: shifts.totalSales,
    })
    .from(shifts)
    .innerJoin(users, eq(shifts.cashierId, users.id))
    .where(
      and(
        eq(shifts.tenantId, tenantId),
        eq(shifts.status, "open")
      )
    );

  const shiftMap = new Map(
    shiftRows.map((r) => [r.terminalId, {
      shiftId: r.shiftId,
      shiftCashier: r.cashierName,
      shiftOpenedAt: r.openedAt,
      shiftOrders: r.totalOrders,
      shiftSales: parseFloat(r.totalSales),
    }])
  );

  // Merge
  return terminalRows.map((t) => {
    const sales = salesMap.get(t.id);
    const shift = shiftMap.get(t.id);
    return {
      ...t,
      todayOrders: sales?.todayOrders ?? 0,
      todayRevenue: sales?.todayRevenue ?? 0,
      activeShift: shift || null,
    };
  });
}

// ─── Terminal Summary Counts ──────────────────────────────
export async function getTerminalSummary() {
  const tenantId = await getTenantId();
  const locationId = await getSelectedLocationId();

  const now = new Date();
  const threeMinAgo = new Date(now.getTime() - 3 * 60 * 1000);

  const [result] = await db
    .select({
      total: count(),
      online: sql<number>`COUNT(*) FILTER (WHERE ${terminals.status} = 'active' AND ${terminals.lastHeartbeatAt} >= ${threeMinAgo.toISOString()})`,
      offline: sql<number>`COUNT(*) FILTER (WHERE ${terminals.status} = 'active' AND (${terminals.lastHeartbeatAt} IS NULL OR ${terminals.lastHeartbeatAt} < ${threeMinAgo.toISOString()}))`,
      disabled: sql<number>`COUNT(*) FILTER (WHERE ${terminals.status} = 'disabled')`,
      maintenance: sql<number>`COUNT(*) FILTER (WHERE ${terminals.status} = 'maintenance')`,
    })
    .from(terminals)
    .where(
      locationId
        ? and(eq(terminals.tenantId, tenantId), eq(terminals.locationId, locationId))
        : eq(terminals.tenantId, tenantId)
    );

  return {
    total: result?.total ?? 0,
    online: Number(result?.online ?? 0),
    offline: Number(result?.offline ?? 0),
    disabled: Number(result?.disabled ?? 0),
    maintenance: Number(result?.maintenance ?? 0),
  };
}

// ─── Type exports ─────────────────────────────────────────
export type TerminalRow = Awaited<ReturnType<typeof getTerminals>>[number];
export type TerminalSummary = Awaited<ReturnType<typeof getTerminalSummary>>;
