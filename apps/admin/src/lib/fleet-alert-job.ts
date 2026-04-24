import "server-only";

import { listStaleLocationPrinters } from "./printer-actions";

const WARNING_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4h
const ERROR_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h

export type FleetAlert = {
  locationId: string;
  tenantId: string;
  severity: "warning" | "error";
  gapHours: number | null;
  message: string;
};

// Scans enabled printers that have gone silent ≥ WARNING_THRESHOLD_MS. Returns
// the alert payloads rather than dispatching so callers (Vercel Cron / admin
// dashboard / Sentry) can decide where to ship them. Sentry forwarding wires
// up in sub-phase N alongside the rest of the observability stack.
export async function runFleetAlertCheck(): Promise<FleetAlert[]> {
  const stale = await listStaleLocationPrinters(WARNING_THRESHOLD_MS);
  const alerts: FleetAlert[] = [];

  for (const row of stale) {
    const gapHours = row.ageMs !== null ? row.ageMs / 3_600_000 : null;
    const severity: "warning" | "error" =
      row.ageMs === null || row.ageMs >= ERROR_THRESHOLD_MS ? "error" : "warning";
    const gapLabel =
      gapHours === null ? "never" : `${gapHours.toFixed(1)}h`;
    alerts.push({
      locationId: row.locationId,
      tenantId: row.tenantId,
      severity,
      gapHours,
      message: `Printer offline: location=${row.locationId} gap=${gapLabel}`,
    });
  }

  if (alerts.length > 0) {
    console.warn("[fleet-alert]", JSON.stringify({ count: alerts.length, alerts }));
  }
  return alerts;
}
