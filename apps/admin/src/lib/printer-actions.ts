"use server";

import { revalidatePath } from "next/cache";
import {
  db,
  locations,
  locationPrinterSettings,
  eq,
  and,
  or,
  isNull,
  lt,
  type LocationPrinterSettings,
  type PrinterDriver,
  type PrinterCodePage,
  type PrinterLocationStatus,
  type PrinterPendingCommandType,
} from "@macau-pos/database";

import { getAuthSession } from "./auth-actions";
import { generateRawToken, hashToken } from "./printer-hash";

type Ok<T> = { ok: true } & T;
type Err<E extends string = string> = { ok: false; error: E; message?: string };

async function requireTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("No active session");
  return session.tenantId;
}

// Verifies the location belongs to the caller's tenant. Returns the row if ok.
async function requireTenantLocation(
  locationId: string,
): Promise<{ tenantId: string; locationId: string }> {
  const tenantId = await requireTenantId();
  const [row] = await db
    .select({ id: locations.id, tenantId: locations.tenantId })
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.tenantId, tenantId)))
    .limit(1);
  if (!row) throw new Error("Location not found or forbidden");
  return { tenantId, locationId: row.id };
}

function revalidateLocationPaths(locationId: string) {
  revalidatePath(`/locations/${locationId}/printer`);
  revalidatePath("/printers");
}

// ─── B1: Read printer settings ────────────────────────────

export async function getLocationPrinterSettings(
  locationId: string,
): Promise<LocationPrinterSettings | null> {
  await requireTenantLocation(locationId);
  const [row] = await db
    .select()
    .from(locationPrinterSettings)
    .where(eq(locationPrinterSettings.locationId, locationId))
    .limit(1);
  return row ?? null;
}

// ─── B2: Update non-sensitive config ──────────────────────

const DRIVERS = ["generic", "star", "epson", "custom"] as const;
const CODE_PAGES = ["cp437", "gb18030", "big5", "shift_jis"] as const;

export type PrinterConfigPatch = {
  driver?: PrinterDriver;
  paperWidth?: 58 | 80;
  codePage?: PrinterCodePage;
  defaultCopies?: number;
  cashDrawerEnabled?: boolean;
};

function validatePatch(patch: PrinterConfigPatch): string | null {
  if (patch.driver !== undefined && !DRIVERS.includes(patch.driver)) {
    return "invalid driver";
  }
  if (patch.paperWidth !== undefined && patch.paperWidth !== 58 && patch.paperWidth !== 80) {
    return "paperWidth must be 58 or 80";
  }
  if (patch.codePage !== undefined && !CODE_PAGES.includes(patch.codePage)) {
    return "invalid codePage";
  }
  if (patch.defaultCopies !== undefined) {
    if (!Number.isInteger(patch.defaultCopies) || patch.defaultCopies < 1 || patch.defaultCopies > 10) {
      return "defaultCopies must be 1..10";
    }
  }
  if (patch.cashDrawerEnabled !== undefined && typeof patch.cashDrawerEnabled !== "boolean") {
    return "cashDrawerEnabled must be boolean";
  }
  return null;
}

export async function updateLocationPrinterSettings(
  locationId: string,
  patch: PrinterConfigPatch,
): Promise<Ok<{}> | Err> {
  try {
    await requireTenantLocation(locationId);
    const err = validatePatch(patch);
    if (err) return { ok: false, error: "validation", message: err };
    if (Object.keys(patch).length === 0) return { ok: true };

    const updated = await db
      .update(locationPrinterSettings)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(locationPrinterSettings.locationId, locationId))
      .returning({ locationId: locationPrinterSettings.locationId });
    if (updated.length === 0) return { ok: false, error: "not_found" };

    // Kick the bridge to pull fresh config on next heartbeat.
    await enqueuePendingCommand(locationId, "reload_config", {
      requestedAt: new Date().toISOString(),
    });

    revalidateLocationPaths(locationId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "internal", message: (e as Error).message };
  }
}

// ─── B3: Rotate bearer token (primary ↔ pending overlap) ──

const ROTATION_OVERLAP_MS = 10 * 60 * 1000; // 10 minutes

export type RotateTokenResult =
  | Ok<{
      rawToken: string;
      rotatedAt: Date;
      overlapUntil: Date;
      bridgeWillUpdateWithin: number; // seconds
    }>
  | Err<"not_found" | "command_pending" | "unauthorized" | "internal">;

export async function rotateLocationPrinterToken(
  locationId: string,
): Promise<RotateTokenResult> {
  try {
    await requireTenantLocation(locationId);

    const [row] = await db
      .select()
      .from(locationPrinterSettings)
      .where(eq(locationPrinterSettings.locationId, locationId))
      .limit(1);
    if (!row) return { ok: false, error: "not_found" };
    if (row.pendingCommandType && row.pendingCommandType !== "rotate_token") {
      return { ok: false, error: "command_pending" };
    }

    const rawToken = generateRawToken();
    const pendingTokenHash = hashToken(rawToken);
    const now = new Date();
    const overlapUntil = new Date(now.getTime() + ROTATION_OVERLAP_MS);

    await db
      .update(locationPrinterSettings)
      .set({
        pendingTokenHash,
        rotationOverlapUntil: overlapUntil,
        pendingCommandType: "rotate_token",
        pendingCommandPayload: {
          newToken: rawToken,
          effectiveAt: now.toISOString(),
          overlapUntil: overlapUntil.toISOString(),
        },
        updatedAt: now,
      })
      .where(eq(locationPrinterSettings.locationId, locationId));

    revalidateLocationPaths(locationId);
    return {
      ok: true,
      rawToken,
      rotatedAt: now,
      overlapUntil,
      bridgeWillUpdateWithin: 60,
    };
  } catch (e) {
    return { ok: false, error: "internal", message: (e as Error).message };
  }
}

// ─── B4: Provision (sub-phase I — CF tunnel + DNS) ────────

export async function provisionLocationPrinter(
  _locationId: string,
  _shopSlug: string,
): Promise<
  | Ok<{ endpointUrl: string; tunnelId: string; bootstrapToken: string }>
  | Err<"not_implemented" | "already_provisioned" | "cf_api_error" | "unauthorized">
> {
  return {
    ok: false,
    error: "not_implemented",
    message:
      "Provisioning is delivered in sub-phase I (Cloudflare Tunnel + bootstrap endpoint).",
  };
}

// ─── B5: Connection check (lightweight) ───────────────────

// Real admin-driven /test RPC requires the raw token, which is hashed-at-rest
// only. Full test-print from admin is deferred to sub-phase M (cashier wires
// the raw token it already holds). For sub-phase H we surface freshness-based
// health so the operator can see "Connected ✓" after the bridge heartbeats in.

const FRESH_THRESHOLD_MS = 90 * 1000;

export async function testLocationPrinter(
  locationId: string,
): Promise<
  | Ok<{ connected: true; lastSeenAt: Date; printerStatus: string }>
  | Err<"not_found" | "never_seen" | "stale" | "printer_error" | "internal">
> {
  try {
    await requireTenantLocation(locationId);
    const [row] = await db
      .select()
      .from(locationPrinterSettings)
      .where(eq(locationPrinterSettings.locationId, locationId))
      .limit(1);
    if (!row) return { ok: false, error: "not_found" };
    if (!row.lastSeenAt) {
      return { ok: false, error: "never_seen", message: "Bridge has not connected yet." };
    }
    const ageMs = Date.now() - row.lastSeenAt.getTime();
    if (ageMs > FRESH_THRESHOLD_MS) {
      return {
        ok: false,
        error: "stale",
        message: `Last heartbeat ${Math.round(ageMs / 1000)}s ago.`,
      };
    }
    if (row.printerStatus !== "ok") {
      return {
        ok: false,
        error: "printer_error",
        message: `Printer reports: ${row.printerStatus}${row.lastError ? ` — ${row.lastError}` : ""}`,
      };
    }
    return {
      ok: true,
      connected: true,
      lastSeenAt: row.lastSeenAt,
      printerStatus: row.printerStatus,
    };
  } catch (e) {
    return { ok: false, error: "internal", message: (e as Error).message };
  }
}

// ─── B6: Status summary (row + derived health) ───────────

export type PrinterHealthSummary = {
  online: boolean;
  lastSeenAt: Date | null;
  lastSeenAgeSec: number | null;
  bridgeVersion: string | null;
  printerStatus: LocationPrinterSettings["printerStatus"];
  lastError: string | null;
  alertLevel: "ok" | "warning" | "error";
};

const WARNING_STALE_MS = 4 * 60 * 60 * 1000; // 4 hours
const ERROR_STALE_MS = 24 * 60 * 60 * 1000; // 24 hours


export async function getLocationPrinterStatus(
  locationId: string,
): Promise<
  | Ok<{ row: LocationPrinterSettings; health: PrinterHealthSummary }>
  | Err<"not_found">
> {
  await requireTenantLocation(locationId);
  const [row] = await db
    .select()
    .from(locationPrinterSettings)
    .where(eq(locationPrinterSettings.locationId, locationId))
    .limit(1);
  if (!row) return { ok: false, error: "not_found" };

  const ageMs = row.lastSeenAt ? Date.now() - row.lastSeenAt.getTime() : null;
  const health: PrinterHealthSummary = {
    online: ageMs !== null && ageMs < FRESH_THRESHOLD_MS,
    lastSeenAt: row.lastSeenAt,
    lastSeenAgeSec: ageMs !== null ? Math.floor(ageMs / 1000) : null,
    bridgeVersion: row.bridgeVersion,
    printerStatus: row.printerStatus,
    lastError: row.lastError,
    alertLevel: computeAlertLevel({
      status: row.status,
      printerStatus: row.printerStatus,
      lastSeenAt: row.lastSeenAt,
    }),
  };
  return { ok: true, row, health };
}

// ─── B7: Set status (enabled/disabled/maintenance) ────────

const STATUSES: PrinterLocationStatus[] = ["enabled", "disabled", "maintenance"];

export async function setLocationPrinterStatus(
  locationId: string,
  nextStatus: PrinterLocationStatus,
  _opts?: { destroyTunnelOnDisable?: boolean },
): Promise<Ok<{}> | Err<"invalid_status" | "not_found" | "internal">> {
  try {
    await requireTenantLocation(locationId);
    if (!STATUSES.includes(nextStatus)) {
      return { ok: false, error: "invalid_status" };
    }
    const updated = await db
      .update(locationPrinterSettings)
      .set({ status: nextStatus, updatedAt: new Date() })
      .where(eq(locationPrinterSettings.locationId, locationId))
      .returning({ locationId: locationPrinterSettings.locationId });
    if (updated.length === 0) return { ok: false, error: "not_found" };

    // CF tunnel destroy on disable is wired up in sub-phase I alongside
    // provisionLocationPrinter. For now, the 410 response from the heartbeat
    // endpoint (see /api/printers/heartbeat) tells the bridge to stop.

    revalidateLocationPaths(locationId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "internal", message: (e as Error).message };
  }
}

// ─── B8: Migrate bridge device (sub-phase I) ──────────────

export async function migrateLocationPrinterBridge(
  _locationId: string,
): Promise<Ok<{ bootstrapToken: string; instructions: string }> | Err> {
  return {
    ok: false,
    error: "not_implemented",
    message: "Bridge migration is delivered in sub-phase I (bootstrap JWT).",
  };
}

// ─── B9: Fleet status across tenant ───────────────────────

export type FleetPrinterRow = {
  locationId: string;
  locationName: string;
  status: PrinterLocationStatus;
  printerStatus: LocationPrinterSettings["printerStatus"];
  lastSeenAt: Date | null;
  lastSeenAgeSec: number | null;
  bridgeVersion: string | null;
  alertLevel: "ok" | "warning" | "error";
};

export async function getFleetPrinterStatus(): Promise<FleetPrinterRow[]> {
  const tenantId = await requireTenantId();
  const rows = await db
    .select({
      locationId: locationPrinterSettings.locationId,
      locationName: locations.name,
      status: locationPrinterSettings.status,
      printerStatus: locationPrinterSettings.printerStatus,
      lastSeenAt: locationPrinterSettings.lastSeenAt,
      bridgeVersion: locationPrinterSettings.bridgeVersion,
      lastError: locationPrinterSettings.lastError,
    })
    .from(locationPrinterSettings)
    .innerJoin(locations, eq(locations.id, locationPrinterSettings.locationId))
    .where(eq(locations.tenantId, tenantId));

  return rows.map((r) => {
    const ageMs = r.lastSeenAt ? Date.now() - r.lastSeenAt.getTime() : null;
    const alertLevel = computeAlertLevel({
      status: r.status,
      printerStatus: r.printerStatus,
      lastSeenAt: r.lastSeenAt,
    });
    return {
      locationId: r.locationId,
      locationName: r.locationName,
      status: r.status,
      printerStatus: r.printerStatus,
      lastSeenAt: r.lastSeenAt,
      lastSeenAgeSec: ageMs !== null ? Math.floor(ageMs / 1000) : null,
      bridgeVersion: r.bridgeVersion,
      alertLevel,
    };
  });
}

function computeAlertLevel(r: {
  status: PrinterLocationStatus;
  printerStatus: LocationPrinterSettings["printerStatus"];
  lastSeenAt: Date | null;
}): "ok" | "warning" | "error" {
  if (r.status === "disabled") return "ok";
  if (!r.lastSeenAt) return "error";
  const age = Date.now() - r.lastSeenAt.getTime();
  if (age >= ERROR_STALE_MS) return "error";
  if (age >= WARNING_STALE_MS) return "warning";
  if (r.printerStatus === "error" || r.printerStatus === "offline") return "error";
  if (r.printerStatus === "out_of_paper") return "warning";
  return "ok";
}

// ─── Dev-only: seed a stub row for local testing ──────────

// Bootstraps a minimal printer row without calling Cloudflare so sub-phase H
// can be exercised end-to-end on localhost. Full provisioning (CF tunnel +
// DNS + JWT) lands in sub-phase I. Returns the raw token ONCE.
export async function devSeedLocationPrinter(
  locationId: string,
): Promise<
  | Ok<{ rawToken: string; endpointUrl: string; tunnelId: string }>
  | Err<"already_exists" | "internal">
> {
  if (process.env.NODE_ENV === "production") {
    return {
      ok: false,
      error: "internal",
      message: "devSeedLocationPrinter is dev-only",
    };
  }
  try {
    await requireTenantLocation(locationId);
    const [existing] = await db
      .select({ locationId: locationPrinterSettings.locationId })
      .from(locationPrinterSettings)
      .where(eq(locationPrinterSettings.locationId, locationId))
      .limit(1);
    if (existing) return { ok: false, error: "already_exists" };

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const tunnelId = `dev-tunnel-${locationId.slice(0, 8)}`;
    const endpointUrl = `http://127.0.0.1:${process.env.PRINTER_BRIDGE_PORT ?? "9321"}/print`;

    await db.insert(locationPrinterSettings).values({
      locationId,
      status: "enabled",
      endpointUrl,
      tunnelId,
      tokenHash,
      bootstrapUsed: true,
    });

    revalidateLocationPaths(locationId);
    return { ok: true, rawToken, endpointUrl, tunnelId };
  } catch (e) {
    return { ok: false, error: "internal", message: (e as Error).message };
  }
}

// ─── Shared: enqueue a pending command ────────────────────

async function enqueuePendingCommand(
  locationId: string,
  type: PrinterPendingCommandType,
  payload: Record<string, unknown>,
): Promise<void> {
  // Only overwrite when nothing is pending, or when re-issuing the SAME type.
  // Anything else surfaces as `command_pending` to callers (see B3).
  const [row] = await db
    .select({ pendingCommandType: locationPrinterSettings.pendingCommandType })
    .from(locationPrinterSettings)
    .where(eq(locationPrinterSettings.locationId, locationId))
    .limit(1);
  if (row?.pendingCommandType && row.pendingCommandType !== type) return;

  await db
    .update(locationPrinterSettings)
    .set({
      pendingCommandType: type,
      pendingCommandPayload: payload,
      updatedAt: new Date(),
    })
    .where(eq(locationPrinterSettings.locationId, locationId));
}

// ─── Helpers used by heartbeat route + fleet-alert-job ────

export async function listStaleLocationPrinters(thresholdMs: number): Promise<
  Array<{
    locationId: string;
    tenantId: string;
    lastSeenAt: Date | null;
    ageMs: number | null;
  }>
> {
  const cutoff = new Date(Date.now() - thresholdMs);
  const rows = await db
    .select({
      locationId: locationPrinterSettings.locationId,
      tenantId: locations.tenantId,
      lastSeenAt: locationPrinterSettings.lastSeenAt,
    })
    .from(locationPrinterSettings)
    .innerJoin(locations, eq(locations.id, locationPrinterSettings.locationId))
    .where(
      and(
        eq(locationPrinterSettings.status, "enabled"),
        or(
          isNull(locationPrinterSettings.lastSeenAt),
          lt(locationPrinterSettings.lastSeenAt, cutoff),
        ),
      ),
    );
  return rows.map((r) => ({
    locationId: r.locationId,
    tenantId: r.tenantId,
    lastSeenAt: r.lastSeenAt,
    ageMs: r.lastSeenAt ? Date.now() - r.lastSeenAt.getTime() : null,
  }));
}

