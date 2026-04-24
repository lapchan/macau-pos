import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

import {
  db,
  locationPrinterSettings,
  eq,
  type LocationPrinterSettings,
  type PrinterStatus,
  type PrinterPendingCommandType,
} from "@macau-pos/database";

import { hashToken, verifyHashConstantTime } from "@/lib/printer-hash";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_NEXT_HEARTBEAT_SEC = 60;
const MAX_BODY_BYTES = 64 * 1024;

const PRINTER_STATUSES: readonly PrinterStatus[] = [
  "ok",
  "offline",
  "out_of_paper",
  "error",
  "unknown",
];

type HeartbeatBody = {
  locationId: string;
  bridgeVersion: string;
  printerStatus: PrinterStatus;
  printerModel: string | null;
  lastError: string | null;
  uptimeSec: number;
  jobsServedTotal: number;
  ackedCommandId?: string;
};

type HeartbeatCommand = {
  id: string;
  type: PrinterPendingCommandType;
  payload: Record<string, unknown>;
};

type HeartbeatResponse = {
  ok: true;
  nextHeartbeatIn: number;
  serverTime: string;
  mode: "enabled" | "maintenance";
  commands: HeartbeatCommand[];
};

function problem(status: number, error: string, message?: string) {
  return NextResponse.json({ error, ...(message ? { message } : {}) }, { status });
}

function readBearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/);
  return m ? m[1].trim() : null;
}

function parseBody(raw: unknown): HeartbeatBody | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "body must be object" };
  const b = raw as Record<string, unknown>;

  const locationId = b.locationId;
  if (typeof locationId !== "string" || locationId.length === 0) {
    return { error: "locationId required" };
  }
  const bridgeVersion = b.bridgeVersion;
  if (typeof bridgeVersion !== "string") return { error: "bridgeVersion required" };

  const printerStatus = b.printerStatus;
  if (typeof printerStatus !== "string" || !PRINTER_STATUSES.includes(printerStatus as PrinterStatus)) {
    return { error: `printerStatus must be one of ${PRINTER_STATUSES.join(",")}` };
  }

  const uptimeSec = b.uptimeSec;
  if (typeof uptimeSec !== "number" || !Number.isFinite(uptimeSec) || uptimeSec < 0) {
    return { error: "uptimeSec must be non-negative number" };
  }
  const jobsServedTotal = b.jobsServedTotal;
  if (typeof jobsServedTotal !== "number" || !Number.isFinite(jobsServedTotal) || jobsServedTotal < 0) {
    return { error: "jobsServedTotal must be non-negative number" };
  }

  const printerModel =
    b.printerModel === null || b.printerModel === undefined
      ? null
      : typeof b.printerModel === "string"
        ? b.printerModel
        : null;
  const lastError =
    b.lastError === null || b.lastError === undefined
      ? null
      : typeof b.lastError === "string"
        ? b.lastError
        : null;

  const ackedCommandId =
    typeof b.ackedCommandId === "string" && b.ackedCommandId.length > 0
      ? b.ackedCommandId
      : undefined;

  return {
    locationId,
    bridgeVersion,
    printerStatus: printerStatus as PrinterStatus,
    printerModel,
    lastError,
    uptimeSec,
    jobsServedTotal,
    ackedCommandId,
  };
}

// Deterministic id so the bridge can ACK the same logical command across
// heartbeats until the server clears it. Different payloads produce different
// ids so a re-issued command (e.g. a second rotate) is not mistaken for the
// prior one.
function computeCommandId(
  type: PrinterPendingCommandType,
  payload: Record<string, unknown>,
): string {
  const digest = createHash("sha1")
    .update(type)
    .update("\x00")
    .update(JSON.stringify(payload ?? {}))
    .digest("hex")
    .slice(0, 12);
  return `cmd_${type}_${digest}`;
}

async function applyCommandAck(
  row: LocationPrinterSettings,
  ackedCommandId: string,
): Promise<void> {
  const expectedId =
    row.pendingCommandType
      ? computeCommandId(
          row.pendingCommandType as PrinterPendingCommandType,
          (row.pendingCommandPayload as Record<string, unknown>) ?? {},
        )
      : null;
  if (!expectedId || ackedCommandId !== expectedId) return;

  if (row.pendingCommandType === "rotate_token") {
    if (!row.pendingTokenHash) return;
    await db
      .update(locationPrinterSettings)
      .set({
        tokenHash: row.pendingTokenHash,
        pendingTokenHash: null,
        rotationOverlapUntil: null,
        pendingCommandType: null,
        pendingCommandPayload: null,
        tokenRotatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(locationPrinterSettings.locationId, row.locationId));
    return;
  }

  // reload_config | force_update — just clear the pending slot.
  await db
    .update(locationPrinterSettings)
    .set({
      pendingCommandType: null,
      pendingCommandPayload: null,
      updatedAt: new Date(),
    })
    .where(eq(locationPrinterSettings.locationId, row.locationId));
}

export async function POST(req: NextRequest) {
  const token = readBearerToken(req);
  const headerLocationId = req.headers.get("x-location-id");
  if (!token) return problem(401, "unauthorized");

  // Parse body first so we can fall back to locationId from the body (the
  // bridge sends it in both places; the header is a belt-and-braces hint).
  const rawText = await req.text();
  if (rawText.length > MAX_BODY_BYTES) return problem(413, "body_too_large");
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    return problem(400, "invalid_json");
  }
  const parsed = parseBody(parsedJson);
  if ("error" in parsed) return problem(400, "validation", parsed.error);

  const locationId = headerLocationId ?? parsed.locationId;
  if (headerLocationId && headerLocationId !== parsed.locationId) {
    return problem(400, "location_mismatch");
  }

  const [row] = await db
    .select()
    .from(locationPrinterSettings)
    .where(eq(locationPrinterSettings.locationId, locationId))
    .limit(1);
  if (!row) return problem(404, "location_not_found");
  if (row.status === "disabled") return problem(410, "printer_disabled");

  // Constant-time auth check: primary, then pending (if within overlap).
  const candidateHash = hashToken(token);
  const primaryOk = verifyHashConstantTime(candidateHash, row.tokenHash);
  const overlapOk =
    !primaryOk &&
    row.pendingTokenHash !== null &&
    row.rotationOverlapUntil !== null &&
    row.rotationOverlapUntil.getTime() > Date.now() &&
    verifyHashConstantTime(candidateHash, row.pendingTokenHash);
  if (!primaryOk && !overlapOk) return problem(401, "unauthorized");

  // Process command ACK before writing new heartbeat state, so a downstream
  // read sees the cleared command slot.
  if (parsed.ackedCommandId) {
    await applyCommandAck(row, parsed.ackedCommandId);
  }

  await db
    .update(locationPrinterSettings)
    .set({
      lastSeenAt: new Date(),
      bridgeVersion: parsed.bridgeVersion,
      printerStatus: parsed.printerStatus,
      lastError: parsed.lastError,
      lastPrinterModel: parsed.printerModel,
      jobsServedTotal: parsed.jobsServedTotal,
      updatedAt: new Date(),
    })
    .where(eq(locationPrinterSettings.locationId, locationId));

  // Re-fetch to see the current pending command (may have been cleared above).
  const [current] = await db
    .select()
    .from(locationPrinterSettings)
    .where(eq(locationPrinterSettings.locationId, locationId))
    .limit(1);

  const commands: HeartbeatCommand[] = [];
  if (current?.pendingCommandType && current.pendingCommandPayload) {
    const type = current.pendingCommandType as PrinterPendingCommandType;
    const payload = (current.pendingCommandPayload as Record<string, unknown>) ?? {};
    commands.push({ id: computeCommandId(type, payload), type, payload });
  }

  const response: HeartbeatResponse = {
    ok: true,
    nextHeartbeatIn: DEFAULT_NEXT_HEARTBEAT_SEC,
    serverTime: new Date().toISOString(),
    mode: current?.status === "maintenance" ? "maintenance" : "enabled",
    commands,
  };

  return NextResponse.json(response, { status: 200 });
}
