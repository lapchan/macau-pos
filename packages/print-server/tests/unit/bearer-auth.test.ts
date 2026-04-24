import { describe, it, expect, vi } from "vitest";
import type { IncomingMessage, ServerResponse } from "node:http";
import { makeBearerAuth } from "../../src/middleware/bearer-auth.js";
import type { BridgeContext } from "../../src/daemon.js";
import { ConfigStore, devConfig } from "../../src/config.js";

function makeCtx(tokenOverride?: string, pending?: string): BridgeContext {
  const cfg = devConfig();
  cfg.token = tokenOverride ?? "correct-horse-battery-staple";
  if (pending) cfg.pendingToken = pending;
  return {
    configStore: new ConfigStore(cfg),
    transport: { name: "noop" } as unknown as BridgeContext["transport"],
    writeLock: {} as BridgeContext["writeLock"],
    idempotency: {} as BridgeContext["idempotency"],
    rateLimiter: {} as BridgeContext["rateLimiter"],
    metrics: { jobsServedTotal: 0, startedAt: Date.now() },
    startedAt: Date.now(),
  };
}

function makeReqRes(authHeader?: string): {
  req: IncomingMessage;
  res: ServerResponse;
  writeHead: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
} {
  const writeHead = vi.fn();
  const end = vi.fn();
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as IncomingMessage;
  const res = { writeHead, end, headersSent: false } as unknown as ServerResponse;
  return { req, res, writeHead, end };
}

describe("bearer-auth", () => {
  it("U-AUTH-01 valid token → passes (returns true)", async () => {
    const ctx = makeCtx("t-ok");
    const { req, res, writeHead } = makeReqRes("Bearer t-ok");
    const ok = await makeBearerAuth(ctx)(req, res);
    expect(ok).toBe(true);
    expect(writeHead).not.toHaveBeenCalled();
  });

  it("U-AUTH-02 wrong token → 401 unauthorized", async () => {
    const ctx = makeCtx("t-ok");
    const { req, res, writeHead, end } = makeReqRes("Bearer t-wrong");
    const ok = await makeBearerAuth(ctx)(req, res);
    expect(ok).toBe(false);
    expect(writeHead).toHaveBeenCalledWith(
      401,
      expect.objectContaining({ "Content-Type": "application/json" }),
    );
    expect(end.mock.calls[0]?.[0]).toContain("unauthorized");
  });

  it("U-AUTH-03 missing Authorization header → 401", async () => {
    const ctx = makeCtx("t-ok");
    const { req, res, writeHead } = makeReqRes();
    const ok = await makeBearerAuth(ctx)(req, res);
    expect(ok).toBe(false);
    expect(writeHead).toHaveBeenCalledWith(401, expect.any(Object));
  });

  it("U-AUTH-04 malformed 'Bearer  ' header → 401", async () => {
    const ctx = makeCtx("t-ok");
    const { req, res, writeHead } = makeReqRes("Bearer   ");
    const ok = await makeBearerAuth(ctx)(req, res);
    expect(ok).toBe(false);
    expect(writeHead).toHaveBeenCalledWith(401, expect.any(Object));
  });

  it("pendingToken (rotation overlap) is also accepted", async () => {
    const ctx = makeCtx("primary", "pending-new");
    const { req, res } = makeReqRes("Bearer pending-new");
    const ok = await makeBearerAuth(ctx)(req, res);
    expect(ok).toBe(true);
  });

  it("U-AUTH-05/06 verify runs well under 5ms and timing is roughly constant", async () => {
    const ctx = makeCtx("correct-horse-battery-staple-verylongtoken");
    const auth = makeBearerAuth(ctx);

    async function time(header: string, n: number): Promise<number> {
      const start = process.hrtime.bigint();
      for (let i = 0; i < n; i++) {
        const { req, res } = makeReqRes(header);
        await auth(req, res);
      }
      return Number(process.hrtime.bigint() - start) / 1e6 / n;
    }

    // Warm up JIT
    await time("Bearer correct-horse-battery-staple-verylongtoken", 200);
    await time("Bearer wrong", 200);

    const validMs = await time(
      "Bearer correct-horse-battery-staple-verylongtoken",
      500,
    );
    const invalidMs = await time("Bearer wrong", 500);

    expect(validMs).toBeLessThan(5);
    expect(invalidMs).toBeLessThan(5);
    // Rough timing-constant sanity — allow wide variance in CI noise (<10x).
    const ratio = Math.max(validMs, invalidMs) / Math.min(validMs, invalidMs);
    expect(ratio).toBeLessThan(10);
  });
});
