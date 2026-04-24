import type { BridgeConfig } from "../types.js";
import type { TransportAdapter } from "./adapter.js";
import { NoopTransport } from "./adapter.js";
import { LinuxLpAdapter } from "./linux-lp.js";
import { NodeUsbAdapter } from "./node-usb.js";
import { CupsAdapter } from "./cups.js";
import { logging } from "../util/logging.js";

export interface DetectOverrides {
  // Tests inject a synthetic platform + factories for each adapter.
  platform?: NodeJS.Platform;
  makeLinuxLp?: () => TransportAdapter;
  makeNodeUsb?: () => TransportAdapter;
  makeCups?: (name: string) => TransportAdapter;
}

export async function detectBestAdapter(
  config: BridgeConfig,
  overrides: DetectOverrides = {},
): Promise<TransportAdapter> {
  const platform = overrides.platform ?? process.platform;
  const makeLinuxLp = overrides.makeLinuxLp ?? (() => new LinuxLpAdapter());
  const makeNodeUsb = overrides.makeNodeUsb ?? (() => new NodeUsbAdapter());
  const makeCups =
    overrides.makeCups ?? ((name: string) => new CupsAdapter(name));

  // Explicit transport pin — no auto-fall-through.
  if (config.transport !== "auto") {
    const pinned = await startAdapter(config.transport, {
      makeLinuxLp,
      makeNodeUsb,
      makeCups: () =>
        makeCups(config.cupsPrinterName ?? fallbackCupsName()),
    });
    if (pinned) return pinned;
    throw new Error(
      `pinned transport '${config.transport}' failed to initialize`,
    );
  }

  const order: Array<"linux-lp" | "node-usb" | "cups"> =
    platform === "linux" ? ["linux-lp", "node-usb", "cups"] : ["node-usb", "cups"];

  for (const kind of order) {
    const adapter = await startAdapter(kind, {
      makeLinuxLp,
      makeNodeUsb,
      makeCups: () =>
        makeCups(config.cupsPrinterName ?? fallbackCupsName()),
    });
    if (adapter) return adapter;
  }

  if (
    process.env.PRINTER_BRIDGE_DEV === "1" ||
    process.env.PRINTER_BRIDGE_ALLOW_NOOP === "1"
  ) {
    logging.warn("no real transport available — falling back to noop (dev)");
    const noop = new NoopTransport();
    await noop.init();
    return noop;
  }

  throw new Error("no working transport adapter (linux-lp/node-usb/cups)");
}

async function startAdapter(
  kind: "linux-lp" | "node-usb" | "cups",
  factories: {
    makeLinuxLp: () => TransportAdapter;
    makeNodeUsb: () => TransportAdapter;
    makeCups: () => TransportAdapter;
  },
): Promise<TransportAdapter | null> {
  let adapter: TransportAdapter;
  switch (kind) {
    case "linux-lp":
      adapter = factories.makeLinuxLp();
      break;
    case "node-usb":
      adapter = factories.makeNodeUsb();
      break;
    case "cups":
      adapter = factories.makeCups();
      break;
  }
  try {
    await adapter.init();
  } catch (err) {
    logging.warn(`transport '${kind}' init failed`, {
      err: (err as Error).message,
    });
    return null;
  }
  // linux-lp init succeeds even with no device attached; verify via probe.
  if (adapter.name === "linux-lp") {
    const probe = await adapter.probe();
    if (!probe.up) {
      logging.warn("linux-lp probe failed, trying next transport");
      return null;
    }
  }
  logging.info("transport selected", { name: adapter.name });
  return adapter;
}

function fallbackCupsName(): string {
  // Most Mac users install Xprinter as the default queue name; OpenWRT users
  // typically use `printer` or `thermal`. Operators can override via config.
  return "Xprinter";
}
