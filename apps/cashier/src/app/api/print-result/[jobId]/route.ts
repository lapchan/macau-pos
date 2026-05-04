// In-memory print-result relay so the iOS print app can report success/failure
// of a TCP write back to the web cashier. Cashier polls after firing
// pos-print://; if the result is an error, cashier shows a banner.
//
// Storage: process-local Map with 60s TTL. Single-instance server, so this
// is fine. Multi-instance would need Redis. Each entry covers one print
// attempt keyed by jobId (UUID minted in network-printer.ts when the URL
// was built).

import { NextResponse, type NextRequest } from "next/server";

interface PrintResult {
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
  durationMs?: number;
  bytesWritten?: number;
  receivedAt: number;
}

const TTL_MS = 60_000;
// process-local store; survives across requests within the same Node process.
const store = new Map<string, PrintResult>();

// Lazy GC: walks the map every minute. Lightweight; entries are tiny.
let lastSweep = Date.now();
function maybeSweep() {
  const now = Date.now();
  if (now - lastSweep < 30_000) return;
  lastSweep = now;
  for (const [k, v] of store) {
    if (now - v.receivedAt > TTL_MS) store.delete(k);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  maybeSweep();
  const { jobId } = await params;
  if (!jobId || jobId.length < 8 || jobId.length > 64) {
    return NextResponse.json({ error: "invalid_jobId" }, { status: 400 });
  }

  let body: Partial<PrintResult>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (typeof body.ok !== "boolean") {
    return NextResponse.json({ error: "missing_ok" }, { status: 400 });
  }

  store.set(jobId, {
    ok: body.ok,
    errorCode: body.errorCode,
    errorMessage: body.errorMessage,
    durationMs: body.durationMs,
    bytesWritten: body.bytesWritten,
    receivedAt: Date.now(),
  });

  return NextResponse.json({ stored: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  maybeSweep();
  const { jobId } = await params;
  const entry = store.get(jobId);
  if (!entry) {
    return NextResponse.json({ status: "pending" });
  }
  if (Date.now() - entry.receivedAt > TTL_MS) {
    store.delete(jobId);
    return NextResponse.json({ status: "expired" });
  }
  return NextResponse.json({
    status: entry.ok ? "ok" : "error",
    errorCode: entry.errorCode,
    errorMessage: entry.errorMessage,
    durationMs: entry.durationMs,
    bytesWritten: entry.bytesWritten,
  });
}
