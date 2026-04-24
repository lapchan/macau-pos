import { createServer, type Server } from "node:http";
import {
  ConfigStore,
  devConfig,
  loadConfig,
  type LoadedConfig,
} from "./config.js";
import type { BridgeConfig, Metrics } from "./types.js";
import { detectBestAdapter } from "./transport/detect.js";
import type { TransportAdapter } from "./transport/adapter.js";
import { Semaphore } from "./util/semaphore.js";
import { IdempotencyCache } from "./middleware/idempotency.js";
import { RateLimiter, makeRateLimit } from "./middleware/rate-limit.js";
import { makeBearerAuth } from "./middleware/bearer-auth.js";
import { accessStart, accessEnd } from "./middleware/logging.js";
import { handlePrint } from "./handlers/print.js";
import { handleTest } from "./handlers/test.js";
import { handleHealth } from "./handlers/health.js";
import { handleVersion } from "./handlers/version.js";
import { startHeartbeat, type HeartbeatHandle } from "./heartbeat.js";
import { startUpdateCheck, type UpdateCheckHandle } from "./update-check.js";
import { logging, setLogLevel } from "./util/logging.js";

export type BridgeMode = "enabled" | "maintenance" | "disabled";

export interface BridgeContext {
  configStore: ConfigStore;
  transport: TransportAdapter;
  writeLock: Semaphore;
  idempotency: IdempotencyCache;
  rateLimiter: RateLimiter;
  metrics: Metrics;
  startedAt: number;
  pendingAck?: string | undefined;
  mode: BridgeMode;
  lastHeartbeatAt?: number | undefined;
  lastHeartbeatError?: string | undefined;
}

export interface DaemonHandle {
  server: Server;
  ctx: BridgeContext;
  shutdown(): Promise<void>;
}

async function loadOrDevConfig(): Promise<LoadedConfig | { config: BridgeConfig; path: string }> {
  if (process.env.PRINTER_BRIDGE_DEV === "1") {
    logging.warn("PRINTER_BRIDGE_DEV=1 — using in-memory dev config");
    return { config: devConfig(), path: "<dev>" };
  }
  return loadConfig();
}

export async function startDaemon(): Promise<DaemonHandle> {
  const { config, path } = await loadOrDevConfig();
  setLogLevel(config.logLevel);
  logging.info("bridge starting", {
    version: config.version,
    configPath: path,
    tenantSlug: config.tenantSlug,
  });

  const transport = await detectBestAdapter(config);
  const configStore = new ConfigStore(config);

  const ctx: BridgeContext = {
    configStore,
    transport,
    writeLock: new Semaphore(1),
    idempotency: new IdempotencyCache({ ttlMs: 5 * 60 * 1000 }),
    rateLimiter: new RateLimiter({ rps: 10, burst: 20 }),
    metrics: { jobsServedTotal: 0, startedAt: Date.now() },
    startedAt: Date.now(),
    pendingAck: undefined,
    mode: "enabled",
  };

  const rateLimit = makeRateLimit(ctx.rateLimiter);
  const bearerAuth = makeBearerAuth(ctx);

  const server = createServer(async (req, res) => {
    accessStart(req);
    try {
      const host = req.headers.host ?? "127.0.0.1";
      const url = new URL(req.url ?? "/", `http://${host}`);

      if (req.method === "GET" && url.pathname === "/version") {
        handleVersion(req, res, ctx);
        return;
      }

      if (!(await bearerAuth(req, res))) return;

      if (req.method === "GET" && url.pathname === "/health") {
        await handleHealth(req, res, ctx);
        return;
      }
      if (req.method === "POST" && url.pathname === "/print") {
        if (!rateLimit(req, res)) return;
        await handlePrint(req, res, ctx);
        return;
      }
      if (req.method === "POST" && url.pathname === "/test") {
        await handleTest(req, res, ctx);
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "not_found" }));
    } catch (err) {
      logging.error("unhandled request error", {
        err: (err as Error).message,
      });
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "internal" }));
      }
    } finally {
      accessEnd(req, res);
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(config.listenPort, "127.0.0.1", () => {
      logging.info("bridge listening", {
        host: "127.0.0.1",
        port: config.listenPort,
      });
      resolve();
    });
  });

  const heartbeatHandle: HeartbeatHandle = startHeartbeat(ctx);
  const updateHandle: UpdateCheckHandle = startUpdateCheck(ctx);

  const shutdown = async (): Promise<void> => {
    logging.info("bridge shutting down");
    heartbeatHandle.stop();
    updateHandle.stop();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (ctx.transport.close) await ctx.transport.close();
  };

  return { server, ctx, shutdown };
}

export function setupGracefulShutdown(handle: DaemonHandle): void {
  const onSignal = async (sig: NodeJS.Signals) => {
    logging.info("received signal", { sig });
    try {
      await handle.shutdown();
    } finally {
      process.exit(0);
    }
  };
  process.on("SIGTERM", onSignal);
  process.on("SIGINT", onSignal);
}
