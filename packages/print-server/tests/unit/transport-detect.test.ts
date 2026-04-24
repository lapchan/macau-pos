import { describe, it, expect } from "vitest";
import { detectBestAdapter } from "../../src/transport/detect.js";
import type {
  PrinterProbeResult,
  TransportAdapter,
} from "../../src/transport/adapter.js";
import type { BridgeConfig } from "../../src/types.js";

function makeFakeAdapter(
  name: TransportAdapter["name"],
  behavior: "ok" | "probe-down" | "throw",
): TransportAdapter {
  return {
    name,
    async init() {
      if (behavior === "throw") throw new Error(`${name} init failed`);
    },
    async write() {},
    async probe(): Promise<PrinterProbeResult> {
      return behavior === "probe-down"
        ? { up: false, lastError: "down" }
        : { up: true, model: `fake-${name}` };
    },
  };
}

function baseConfig(): BridgeConfig {
  return {
    version: "0.1.0",
    locationId: "x",
    tenantSlug: "x",
    endpointUrl: "https://x/print",
    heartbeatUrl: "https://x/hb",
    token: "t",
    listenPort: 3901,
    transport: "auto",
    cupsPrinterName: "Xprinter",
    paperWidth: 80,
    codePage: "big5",
    driver: "generic",
    logLevel: "warn",
    sentryDsn: null,
  };
}

describe("detectBestAdapter", () => {
  it("U-TX-06 linux picks LinuxLpAdapter when lp exists", async () => {
    const cfg = baseConfig();
    const chosen = await detectBestAdapter(cfg, {
      platform: "linux",
      makeLinuxLp: () => makeFakeAdapter("linux-lp", "ok"),
      makeNodeUsb: () => makeFakeAdapter("node-usb", "ok"),
      makeCups: () => makeFakeAdapter("cups", "ok"),
    });
    expect(chosen.name).toBe("linux-lp");
  });

  it("U-TX-07 falls back to CUPS when node-usb throws", async () => {
    const cfg = baseConfig();
    const chosen = await detectBestAdapter(cfg, {
      platform: "darwin",
      makeLinuxLp: () => makeFakeAdapter("linux-lp", "ok"),
      makeNodeUsb: () => makeFakeAdapter("node-usb", "throw"),
      makeCups: () => makeFakeAdapter("cups", "ok"),
    });
    expect(chosen.name).toBe("cups");
  });

  it("linux falls through linux-lp (probe down) → node-usb → cups", async () => {
    const cfg = baseConfig();
    const chosen = await detectBestAdapter(cfg, {
      platform: "linux",
      makeLinuxLp: () => makeFakeAdapter("linux-lp", "probe-down"),
      makeNodeUsb: () => makeFakeAdapter("node-usb", "throw"),
      makeCups: () => makeFakeAdapter("cups", "ok"),
    });
    expect(chosen.name).toBe("cups");
  });

  it("darwin auto skips linux-lp even if factory provided", async () => {
    const cfg = baseConfig();
    const chosen = await detectBestAdapter(cfg, {
      platform: "darwin",
      makeLinuxLp: () => makeFakeAdapter("linux-lp", "ok"),
      makeNodeUsb: () => makeFakeAdapter("node-usb", "ok"),
      makeCups: () => makeFakeAdapter("cups", "ok"),
    });
    expect(chosen.name).toBe("node-usb");
  });

  it("pinned transport does not fall through", async () => {
    const cfg = baseConfig();
    cfg.transport = "cups";
    const chosen = await detectBestAdapter(cfg, {
      makeLinuxLp: () => makeFakeAdapter("linux-lp", "ok"),
      makeNodeUsb: () => makeFakeAdapter("node-usb", "ok"),
      makeCups: () => makeFakeAdapter("cups", "ok"),
    });
    expect(chosen.name).toBe("cups");
  });

  it("pinned transport that fails throws (no fallback)", async () => {
    const cfg = baseConfig();
    cfg.transport = "node-usb";
    await expect(
      detectBestAdapter(cfg, {
        makeNodeUsb: () => makeFakeAdapter("node-usb", "throw"),
      }),
    ).rejects.toThrow(/pinned transport 'node-usb'/);
  });

  it("auto with all three failing and DEV=1 returns noop", async () => {
    const cfg = baseConfig();
    const prev = process.env.PRINTER_BRIDGE_DEV;
    process.env.PRINTER_BRIDGE_DEV = "1";
    try {
      const chosen = await detectBestAdapter(cfg, {
        platform: "darwin",
        makeNodeUsb: () => makeFakeAdapter("node-usb", "throw"),
        makeCups: () => makeFakeAdapter("cups", "throw"),
      });
      expect(chosen.name).toBe("noop");
    } finally {
      if (prev === undefined) delete process.env.PRINTER_BRIDGE_DEV;
      else process.env.PRINTER_BRIDGE_DEV = prev;
    }
  });

  it("auto with all three failing and no DEV → throws", async () => {
    const cfg = baseConfig();
    delete process.env.PRINTER_BRIDGE_DEV;
    await expect(
      detectBestAdapter(cfg, {
        platform: "darwin",
        makeNodeUsb: () => makeFakeAdapter("node-usb", "throw"),
        makeCups: () => makeFakeAdapter("cups", "throw"),
      }),
    ).rejects.toThrow(/no working transport/);
  });
});
