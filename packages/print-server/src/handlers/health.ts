import type { IncomingMessage, ServerResponse } from "node:http";
import type { BridgeContext } from "../daemon.js";
import { sendJson } from "../util/http.js";

// §5.2.4 contract. Admin uses this on updateLocationPrinter save to pre-verify
// reachability. Also consumed by the fleet dashboard via the CF tunnel.
export async function handleHealth(
  _req: IncomingMessage,
  res: ServerResponse,
  ctx: BridgeContext,
): Promise<void> {
  const cfg = ctx.configStore.get();
  const probe = await ctx.transport.probe();

  const printerStatus = probe.up
    ? "ok"
    : probe.paperOut
    ? "out_of_paper"
    : probe.coverOpen
    ? "error"
    : "offline";

  sendJson(res, 200, {
    ok: true,
    bridgeUp: true,
    printerUp: probe.up,
    printerStatus,
    printerModel: probe.model ?? null,
    lastError: probe.lastError ?? null,
    uptimeSec: Math.floor((Date.now() - ctx.startedAt) / 1000),
    version: cfg.version,
    jobsServedTotal: ctx.metrics.jobsServedTotal,
    transport: ctx.transport.name,
  });
}
