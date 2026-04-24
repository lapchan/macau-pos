import type { BridgeContext } from "./daemon.js";
import { applyCommands, type HeartbeatCommand } from "./commands/apply.js";
import { logging } from "./util/logging.js";

const DEFAULT_INTERVAL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 10_000;

export interface HeartbeatPayload {
  locationId: string;
  bridgeVersion: string;
  printerStatus: string;
  printerModel: string | null;
  lastError: string | null;
  uptimeSec: number;
  jobsServedTotal: number;
  ackedCommandId?: string;
}

export interface HeartbeatResponse {
  ok: boolean;
  nextHeartbeatIn?: number;
  serverTime?: string;
  mode?: "enabled" | "maintenance";
  commands?: HeartbeatCommand[];
  error?: string;
}

export interface HeartbeatHandle {
  stop(): void;
  triggerOnce(): Promise<void>; // test hook
}

export interface HeartbeatDeps {
  fetchFn?: typeof fetch;
  intervalMs?: number;
  onFatal?: (reason: string) => void;
}

export function startHeartbeat(
  ctx: BridgeContext,
  deps: HeartbeatDeps = {},
): HeartbeatHandle {
  if (process.env.PRINTER_BRIDGE_NO_HEARTBEAT === "1") {
    logging.info("heartbeat disabled via env");
    return { stop() {}, async triggerOnce() {} };
  }

  const f = deps.fetchFn ?? globalThis.fetch;
  let nextMs = deps.intervalMs ?? DEFAULT_INTERVAL_MS;
  let stopped = false;
  let timer: NodeJS.Timeout | null = null;
  let running = false;

  const schedule = (ms: number) => {
    if (stopped) return;
    timer = setTimeout(tick, ms);
    timer.unref();
  };

  async function tick(): Promise<void> {
    if (stopped || running) return;
    running = true;
    try {
      await doOne();
    } catch (err) {
      logging.warn("heartbeat loop error", {
        err: (err as Error).message,
      });
    } finally {
      running = false;
      schedule(nextMs);
    }
  }

  async function doOne(): Promise<void> {
    const cfg = ctx.configStore.get();
    const probe = await ctx.transport.probe();
    const payload: HeartbeatPayload = {
      locationId: cfg.locationId,
      bridgeVersion: cfg.version,
      printerStatus: probe.up
        ? "ok"
        : probe.paperOut
        ? "out_of_paper"
        : probe.coverOpen
        ? "error"
        : "offline",
      printerModel: probe.model ?? null,
      lastError: probe.lastError ?? ctx.lastHeartbeatError ?? null,
      uptimeSec: Math.floor((Date.now() - ctx.startedAt) / 1000),
      jobsServedTotal: ctx.metrics.jobsServedTotal,
      ...(ctx.pendingAck ? { ackedCommandId: ctx.pendingAck } : {}),
    };

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let res: Response;
    try {
      res = await f(cfg.heartbeatUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cfg.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (err) {
      ctx.lastHeartbeatError = (err as Error).message;
      logging.warn("heartbeat POST failed", { err: ctx.lastHeartbeatError });
      return;
    } finally {
      clearTimeout(t);
    }

    if (res.status === 410) {
      // Admin has disabled this location — exit gracefully.
      logging.error("heartbeat 410: printer disabled", {
        locationId: cfg.locationId,
      });
      ctx.mode = "disabled";
      deps.onFatal?.("printer_disabled");
      stopped = true;
      return;
    }
    if (res.status === 404) {
      logging.error("heartbeat 404: location_not_found", {
        locationId: cfg.locationId,
      });
      ctx.lastHeartbeatError = "location_not_found";
      return;
    }
    if (res.status === 401) {
      logging.error("heartbeat 401: token rejected", {
        locationId: cfg.locationId,
      });
      ctx.lastHeartbeatError = "unauthorized";
      return;
    }
    if (!res.ok) {
      ctx.lastHeartbeatError = `HTTP ${res.status}`;
      return;
    }

    let parsed: HeartbeatResponse;
    try {
      parsed = (await res.json()) as HeartbeatResponse;
    } catch (err) {
      ctx.lastHeartbeatError = `bad JSON: ${(err as Error).message}`;
      return;
    }

    ctx.lastHeartbeatAt = Date.now();
    ctx.lastHeartbeatError = undefined;

    // Server acknowledged our previous ACK — clear it so we don't re-send.
    ctx.pendingAck = undefined;

    if (parsed.mode === "enabled" || parsed.mode === "maintenance") {
      ctx.mode = parsed.mode;
    }

    if (parsed.commands && parsed.commands.length > 0) {
      try {
        const newAck = await applyCommands(ctx, parsed.commands);
        if (newAck) ctx.pendingAck = newAck;
      } catch (err) {
        // Failed command is intentionally NOT ACKed — server will re-send.
        logging.error("applyCommands failed", {
          err: (err as Error).message,
        });
      }
    }

    if (typeof parsed.nextHeartbeatIn === "number" && parsed.nextHeartbeatIn > 0) {
      nextMs = parsed.nextHeartbeatIn * 1000;
    }
  }

  logging.info("heartbeat loop started", { intervalMs: nextMs });
  schedule(nextMs);

  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
    triggerOnce: doOne,
  };
}
