import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { applyCommands, type HeartbeatCommand } from "../../src/commands/apply.js";
import { applyRotateToken } from "../../src/commands/rotate-token.js";
import type { BridgeContext } from "../../src/daemon.js";
import { ConfigStore, devConfig, writeConfigAtomic } from "../../src/config.js";
import { Semaphore } from "../../src/util/semaphore.js";
import { IdempotencyCache } from "../../src/middleware/idempotency.js";
import { RateLimiter } from "../../src/middleware/rate-limit.js";
import type { TransportAdapter } from "../../src/transport/adapter.js";

function makeCtx(): BridgeContext {
  const cfg = devConfig();
  cfg.token = "tok-initial";
  const transport: TransportAdapter = {
    name: "noop",
    async init() {},
    async write() {},
    async probe() {
      return { up: true };
    },
  };
  return {
    configStore: new ConfigStore(cfg),
    transport,
    writeLock: new Semaphore(1),
    idempotency: new IdempotencyCache({ ttlMs: 1000 }),
    rateLimiter: new RateLimiter({ rps: 10, burst: 20 }),
    metrics: { jobsServedTotal: 0, startedAt: Date.now() },
    startedAt: Date.now(),
    mode: "enabled",
  };
}

describe("commands", () => {
  let origCfgDir: string | undefined;
  let tmpDir: string;

  beforeEach(() => {
    origCfgDir = process.env.PRINTER_BRIDGE_CONFIG_DIR;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cmd-test-"));
    process.env.PRINTER_BRIDGE_CONFIG_DIR = tmpDir;
  });
  afterEach(() => {
    if (origCfgDir !== undefined) process.env.PRINTER_BRIDGE_CONFIG_DIR = origCfgDir;
    else delete process.env.PRINTER_BRIDGE_CONFIG_DIR;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("U-CMD-01 rotate_token: primary token updates, old kept as pendingToken", async () => {
    const ctx = makeCtx();
    await applyRotateToken(ctx, {
      id: "cmd-r1",
      type: "rotate_token",
      payload: { newToken: "fresh-token", effectiveAt: "2026-04-24T10:00:00Z" },
    });
    const cfg = ctx.configStore.get();
    expect(cfg.token).toBe("fresh-token");
    expect(cfg.pendingToken).toBe("tok-initial");
    expect(cfg.rotationOverlapUntil).toBe("2026-04-24T10:00:00Z");
  });

  it("rotate_token with missing newToken throws (no config change)", async () => {
    const ctx = makeCtx();
    await expect(
      applyRotateToken(ctx, {
        id: "cmd-r2",
        type: "rotate_token",
        payload: {},
      }),
    ).rejects.toThrow(/newToken/);
    expect(ctx.configStore.get().token).toBe("tok-initial");
  });

  it("U-CMD-02 reload_config re-reads disk config", async () => {
    const ctx = makeCtx();
    // Write a mutated config to disk so reload picks it up.
    const next = { ...devConfig(), token: "from-disk", logLevel: "debug" as const };
    await writeConfigAtomic(next);

    const result = await applyCommands(ctx, [
      { id: "cmd-rc1", type: "reload_config", payload: {} },
    ]);
    expect(result).toBe("cmd-rc1");
    expect(ctx.configStore.get().token).toBe("from-disk");
  });

  it("U-CMD-03 force_update invokes self-update (stub returns ok:false in G)", async () => {
    const ctx = makeCtx();
    const result = await applyCommands(ctx, [
      { id: "cmd-up1", type: "force_update", payload: { targetVersion: "0.2.0" } },
    ]);
    // Stub returns ok:false so the command is considered failed — no ACK.
    expect(result).toBeUndefined();
  });

  it("U-CMD-04 unknown command type logs and does not ACK", async () => {
    const ctx = makeCtx();
    const result = await applyCommands(ctx, [
      { id: "cmd-x", type: "unknown" as unknown as HeartbeatCommand["type"], payload: {} },
    ]);
    expect(result).toBeUndefined();
  });

  it("U-CMD-05 failed command stops chain — downstream not applied or ACKed", async () => {
    const ctx = makeCtx();
    const result = await applyCommands(ctx, [
      { id: "cmd-ok", type: "rotate_token", payload: { newToken: "abc" } },
      { id: "cmd-bad", type: "rotate_token", payload: {} }, // missing newToken
      { id: "cmd-later", type: "reload_config", payload: {} },
    ]);
    expect(result).toBe("cmd-ok");
    expect(ctx.configStore.get().token).toBe("abc");
    // The later reload_config must not have run.
    // (Indirectly verified by result stopping at cmd-ok.)
  });
});
