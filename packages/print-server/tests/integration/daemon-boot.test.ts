import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { AddressInfo } from "node:net";
import { startDaemon, type DaemonHandle } from "../../src/daemon.js";

// Start the daemon in dev mode on an ephemeral port by overriding config
// right before startDaemon() reads it. We use PRINTER_BRIDGE_DEV=1 so no
// real config file is required, plus PRINTER_BRIDGE_NO_HEARTBEAT so the
// background timer doesn't keep the test process alive.
describe("daemon boot — integration", () => {
  let handle: DaemonHandle;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.PRINTER_BRIDGE_DEV = "1";
    process.env.PRINTER_BRIDGE_PORT = "0"; // ephemeral
    process.env.PRINTER_BRIDGE_NO_HEARTBEAT = "1";
    process.env.PRINTER_BRIDGE_NO_UPDATE_CHECK = "1";
    handle = await startDaemon();
    const addr = handle.server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await handle?.shutdown();
  });

  it("GET /version returns plain-text daemon version", async () => {
    const res = await fetch(`${baseUrl}/version`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");
    const text = await res.text();
    expect(text).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("POST /print without auth → 401", async () => {
    const res = await fetch(`${baseUrl}/print`, {
      method: "POST",
      body: "{}",
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(401);
  });

  it("POST /print without Idempotency-Key → 400 bad_request", async () => {
    const res = await fetch(`${baseUrl}/print`, {
      method: "POST",
      body: "{}",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer dev-token-replace-in-config",
      },
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("bad_request");
  });

  it("GET /health with valid auth returns 200 with printer status", async () => {
    const res = await fetch(`${baseUrl}/health`, {
      headers: { Authorization: "Bearer dev-token-replace-in-config" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.bridgeUp).toBe(true);
    expect(body.transport).toBe("noop");
    expect(body.printerStatus).toBe("ok");
    expect(typeof body.uptimeSec).toBe("number");
  });

  it("unknown path → 404", async () => {
    const res = await fetch(`${baseUrl}/totally-unknown`, {
      headers: { Authorization: "Bearer dev-token-replace-in-config" },
    });
    expect(res.status).toBe(404);
  });
});
