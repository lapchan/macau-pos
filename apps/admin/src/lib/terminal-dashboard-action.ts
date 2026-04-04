"use server";

import { getTerminals, getTerminalSummary } from "./terminal-queries";

export async function fetchTerminalDashboardData() {
  try {
    const [terminals, summary] = await Promise.all([
      getTerminals(),
      getTerminalSummary(),
    ]);

    return {
      summary,
      terminals: terminals.slice(0, 5).map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        status: t.status,
        lastHeartbeatAt: t.lastHeartbeatAt ? t.lastHeartbeatAt.toISOString() : null,
        todayOrders: t.todayOrders,
        todayRevenue: t.todayRevenue,
      })),
    };
  } catch {
    return null;
  }
}
