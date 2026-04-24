import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { AddressInfo } from "node:net";
import { startDaemon, type DaemonHandle } from "../../src/daemon.js";

// Small ESC/POS payload: ESC @ (init) + ASCII + LF + GS V 1 (partial cut).
const TINY_RECEIPT = Buffer.from([
  0x1b, 0x40, 0x41, 0x42, 0x43, 0x0a, 0x1d, 0x56, 0x01,
]).toString("base64");

const AUTH = "Bearer dev-token-replace-in-config";

describe("/print + /test handlers — integration", () => {
  let handle: DaemonHandle;
  let base: string;

  beforeAll(async () => {
    process.env.PRINTER_BRIDGE_DEV = "1";
    process.env.PRINTER_BRIDGE_PORT = "0";
    process.env.PRINTER_BRIDGE_NO_HEARTBEAT = "1";
    process.env.PRINTER_BRIDGE_NO_UPDATE_CHECK = "1";
    handle = await startDaemon();
    const addr = handle.server.address() as AddressInfo;
    base = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await handle?.shutdown();
  });

  async function post(
    path: string,
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
  ): Promise<Response> {
    return fetch(`${base}${path}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: AUTH,
        ...headers,
      },
    });
  }

  it("POST /print with valid body + Idempotency-Key → 200 ok", async () => {
    const res = await post(
      "/print",
      { bytesBase64: TINY_RECEIPT, copies: 1 },
      { "Idempotency-Key": "11111111-1111-1111-1111-111111111111" },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.jobId).toBe("11111111-1111-1111-1111-111111111111");
    expect(typeof body.durationMs).toBe("number");
    expect(body.printerStatus).toBe("ok");
  });

  it("POST /print idempotency replay returns cached body", async () => {
    const key = "22222222-2222-2222-2222-222222222222";
    const res1 = await post(
      "/print",
      { bytesBase64: TINY_RECEIPT },
      { "Idempotency-Key": key },
    );
    const body1 = await res1.json();
    expect(body1.ok).toBe(true);

    // Replay with a DIFFERENT body — cached response should come back, not a
    // fresh one. Proves idempotency is keyed purely on the header.
    const res2 = await post(
      "/print",
      { bytesBase64: "AAAA" },
      { "Idempotency-Key": key },
    );
    expect(res2.status).toBe(200);
    const body2 = await res2.json();
    expect(body2).toEqual(body1);
  });

  it("POST /print without Idempotency-Key → 400 bad_request", async () => {
    const res = await post("/print", { bytesBase64: TINY_RECEIPT });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("bad_request");
  });

  it("POST /print with invalid base64 → 400 invalid_payload", async () => {
    const res = await post(
      "/print",
      { bytesBase64: "" },
      { "Idempotency-Key": "33333333-3333-3333-3333-333333333333" },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_payload");
  });

  it("POST /print with copies > 10 → 400 invalid_payload", async () => {
    const res = await post(
      "/print",
      { bytesBase64: TINY_RECEIPT, copies: 11 },
      { "Idempotency-Key": "44444444-4444-4444-4444-444444444444" },
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_payload");
  });

  it("POST /print with a huge payload → 413 payload_too_large", async () => {
    // 200KB of base64 → well over the 64KiB-decoded ceiling.
    const huge = "A".repeat(200_000);
    const res = await post(
      "/print",
      { bytesBase64: huge },
      { "Idempotency-Key": "55555555-5555-5555-5555-555555555555" },
    );
    expect([400, 413]).toContain(res.status);
    const body = await res.json();
    expect(body.error).toMatch(/payload_too_large|invalid_payload/);
  });

  it("POST /print with extra unknown fields → 400 invalid_payload (strict schema)", async () => {
    const res = await post(
      "/print",
      { bytesBase64: TINY_RECEIPT, sneaky: "field" },
      { "Idempotency-Key": "66666666-6666-6666-6666-666666666666" },
    );
    expect(res.status).toBe(400);
  });

  it("POST /print kickDrawer:true appends drawer-pulse", async () => {
    // With the noop transport we can't observe the byte stream, but the
    // request should still succeed. This guards against a crash in the
    // driver.kickDrawer() path.
    const res = await post(
      "/print",
      { bytesBase64: TINY_RECEIPT, kickDrawer: true },
      { "Idempotency-Key": "77777777-7777-7777-7777-777777777777" },
    );
    expect(res.status).toBe(200);
  });

  it("POST /test emits a test page (200)", async () => {
    const res = await post(
      "/test",
      {
        driver: "generic",
        paperWidth: 80,
        codePage: "big5",
        shopName: "Test Shop",
        locationName: "Main",
      },
      { "Idempotency-Key": "88888888-8888-8888-8888-888888888888" },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.jobId).toBe("88888888-8888-8888-8888-888888888888");
  });

  it("POST /test without body uses defaults from config", async () => {
    const res = await post(
      "/test",
      {},
      { "Idempotency-Key": "99999999-9999-9999-9999-999999999999" },
    );
    expect(res.status).toBe(200);
  });
});
