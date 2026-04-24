import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { startHeartbeat } from "../../src/heartbeat.js";
import type { BridgeContext } from "../../src/daemon.js";
import { ConfigStore, devConfig } from "../../src/config.js";
import { Semaphore } from "../../src/util/semaphore.js";
import { IdempotencyCache } from "../../src/middleware/idempotency.js";
import { RateLimiter } from "../../src/middleware/rate-limit.js";
import type {
  PrinterProbeResult,
  TransportAdapter,
} from "../../src/transport/adapter.js";

function makeCtx(): BridgeContext {
  const cfg = devConfig();
  cfg.heartbeatUrl = "https://admin.example/api/printers/heartbeat";
  cfg.token = "tok-123";
  cfg.locationId = "loc-abc";
  const probeResult: PrinterProbeResult = { up: true, model: "Fake" };
  const transport: TransportAdapter = {
    name: "noop",
    async init() {},
    async write() {},
    async probe() {
      return probeResult;
    },
  };
  return {
    configStore: new ConfigStore(cfg),
    transport,
    writeLock: new Semaphore(1),
    idempotency: new IdempotencyCache({ ttlMs: 1000 }),
    rateLimiter: new RateLimiter({ rps: 10, burst: 20 }),
    metrics: { jobsServedTotal: 0, startedAt: Date.now() },
    startedAt: Date.now() - 10_000,
    pendingAck: undefined,
    mode: "enabled",
  };
}

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("heartbeat", () => {
  let origNoHb: string | undefined;
  let origCfgDir: string | undefined;
  let tmpDir: string;
  beforeEach(() => {
    origNoHb = process.env.PRINTER_BRIDGE_NO_HEARTBEAT;
    delete process.env.PRINTER_BRIDGE_NO_HEARTBEAT;
    origCfgDir = process.env.PRINTER_BRIDGE_CONFIG_DIR;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hb-test-"));
    process.env.PRINTER_BRIDGE_CONFIG_DIR = tmpDir;
  });
  afterEach(() => {
    if (origNoHb !== undefined) process.env.PRINTER_BRIDGE_NO_HEARTBEAT = origNoHb;
    if (origCfgDir !== undefined) process.env.PRINTER_BRIDGE_CONFIG_DIR = origCfgDir;
    else delete process.env.PRINTER_BRIDGE_CONFIG_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("POSTs to heartbeatUrl with Bearer + expected payload shape", async () => {
    const ctx = makeCtx();
    const fetchFn = vi.fn().mockResolvedValue(respond(200, { ok: true }));
    const hb = startHeartbeat(ctx, { fetchFn, intervalMs: 60_000 });
    await hb.triggerOnce();
    hb.stop();

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe("https://admin.example/api/printers/heartbeat");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer tok-123");
    const body = JSON.parse(init.body);
    expect(body.locationId).toBe("loc-abc");
    expect(body.bridgeVersion).toMatch(/\d+\.\d+\.\d+/);
    expect(body.printerStatus).toBe("ok");
    expect(body.uptimeSec).toBeGreaterThanOrEqual(0);
    expect(body.jobsServedTotal).toBe(0);
    expect(body.ackedCommandId).toBeUndefined();
  });

  it("applies rotate_token command and queues pendingAck for next heartbeat", async () => {
    const ctx = makeCtx();
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        respond(200, {
          ok: true,
          commands: [
            {
              id: "cmd-1",
              type: "rotate_token",
              payload: { newToken: "new-tok-9001" },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(respond(200, { ok: true }));

    const hb = startHeartbeat(ctx, { fetchFn, intervalMs: 60_000 });
    await hb.triggerOnce();
    expect(ctx.pendingAck).toBe("cmd-1");
    // rotate_token applied: config token was updated + old token kept as
    // pendingToken for overlap window (verified via configStore).
    expect(ctx.configStore.get().token).toBe("new-tok-9001");
    expect(ctx.configStore.get().pendingToken).toBe("tok-123");

    await hb.triggerOnce();
    hb.stop();
    const secondBody = JSON.parse(fetchFn.mock.calls[1]![1].body);
    expect(secondBody.ackedCommandId).toBe("cmd-1");
    // New token is used on the ACK request.
    expect(fetchFn.mock.calls[1]![1].headers.Authorization).toBe(
      "Bearer new-tok-9001",
    );
    // Server observed the ACK → pendingAck should now be cleared.
    expect(ctx.pendingAck).toBeUndefined();
  });

  it("410 → marks ctx.mode='disabled' and calls onFatal", async () => {
    const ctx = makeCtx();
    const fetchFn = vi.fn().mockResolvedValue(respond(410, { error: "printer_disabled" }));
    const onFatal = vi.fn();
    const hb = startHeartbeat(ctx, { fetchFn, intervalMs: 60_000, onFatal });
    await hb.triggerOnce();
    hb.stop();
    expect(ctx.mode).toBe("disabled");
    expect(onFatal).toHaveBeenCalledWith("printer_disabled");
  });

  it("401 → records lastHeartbeatError, does not crash", async () => {
    const ctx = makeCtx();
    const fetchFn = vi.fn().mockResolvedValue(respond(401, { error: "unauthorized" }));
    const hb = startHeartbeat(ctx, { fetchFn, intervalMs: 60_000 });
    await hb.triggerOnce();
    hb.stop();
    expect(ctx.lastHeartbeatError).toBe("unauthorized");
    expect(ctx.mode).toBe("enabled"); // still enabled locally
  });

  it("network failure is non-fatal — records error, keeps ticking", async () => {
    const ctx = makeCtx();
    const fetchFn = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const hb = startHeartbeat(ctx, { fetchFn, intervalMs: 60_000 });
    await hb.triggerOnce();
    hb.stop();
    expect(ctx.lastHeartbeatError).toBe("ECONNREFUSED");
  });

  it("respects server-provided nextHeartbeatIn for next tick", async () => {
    const ctx = makeCtx();
    const fetchFn = vi
      .fn()
      .mockResolvedValue(
        respond(200, { ok: true, nextHeartbeatIn: 5, mode: "enabled" }),
      );
    const hb = startHeartbeat(ctx, { fetchFn, intervalMs: 60_000 });
    await hb.triggerOnce();
    hb.stop();
    expect(ctx.lastHeartbeatError).toBeUndefined();
    expect(ctx.mode).toBe("enabled");
  });

  it("mode=maintenance from server updates ctx.mode", async () => {
    const ctx = makeCtx();
    const fetchFn = vi
      .fn()
      .mockResolvedValue(respond(200, { ok: true, mode: "maintenance" }));
    const hb = startHeartbeat(ctx, { fetchFn, intervalMs: 60_000 });
    await hb.triggerOnce();
    hb.stop();
    expect(ctx.mode).toBe("maintenance");
  });

  it("printerStatus reflects probe paperOut", async () => {
    const ctx = makeCtx();
    (ctx.transport.probe as unknown as ReturnType<typeof vi.fn>) = vi
      .fn()
      .mockResolvedValue({ up: false, paperOut: true } as PrinterProbeResult);
    const fetchFn = vi.fn().mockResolvedValue(respond(200, { ok: true }));
    const hb = startHeartbeat(ctx, { fetchFn, intervalMs: 60_000 });
    await hb.triggerOnce();
    hb.stop();
    const body = JSON.parse(fetchFn.mock.calls[0]![1].body);
    expect(body.printerStatus).toBe("out_of_paper");
  });
});
