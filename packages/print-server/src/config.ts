import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { BridgeConfig } from "./types.js";
import { logging } from "./util/logging.js";

export const DEFAULT_LISTEN_PORT = 3901;

export function getConfigDir(): string {
  if (process.env.PRINTER_BRIDGE_CONFIG_DIR) {
    return process.env.PRINTER_BRIDGE_CONFIG_DIR;
  }
  switch (process.platform) {
    case "darwin":
      return "/Library/Application Support/printer-bridge";
    case "win32":
      return path.join(
        process.env.PROGRAMDATA ?? "C:\\ProgramData",
        "printer-bridge",
      );
    default:
      return "/etc/printer-bridge";
  }
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), "config.json");
}

export interface LoadedConfig {
  config: BridgeConfig;
  path: string;
}

export async function loadConfig(): Promise<LoadedConfig> {
  const p = getConfigPath();
  const raw = await fs.readFile(p, "utf-8");
  const parsed = JSON.parse(raw) as BridgeConfig;
  validate(parsed);
  return { config: parsed, path: p };
}

export async function writeConfigAtomic(next: BridgeConfig): Promise<void> {
  validate(next);
  const p = getConfigPath();
  const tmp = p + ".tmp";
  const bak = p + ".bak";
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(next, null, 2) + "\n", { mode: 0o600 });
  try {
    await fs.rename(p, bak);
  } catch (err) {
    // No existing file — first-write case.
    const e = err as NodeJS.ErrnoException;
    if (e.code !== "ENOENT") throw err;
  }
  await fs.rename(tmp, p);
}

function validate(c: BridgeConfig): void {
  if (!c.locationId) throw new Error("config.locationId required");
  if (!c.token) throw new Error("config.token required");
  if (!c.endpointUrl) throw new Error("config.endpointUrl required");
  if (!c.heartbeatUrl) throw new Error("config.heartbeatUrl required");
  // listenPort=0 is valid — OS assigns an ephemeral port. >0 is a real port.
  if (typeof c.listenPort !== "number" || c.listenPort < 0 || c.listenPort > 65535) {
    throw new Error("config.listenPort must be in [0, 65535]");
  }
}

export class ConfigStore {
  private current: BridgeConfig;
  constructor(initial: BridgeConfig) {
    this.current = initial;
  }

  get(): BridgeConfig {
    return this.current;
  }

  async update(patch: Partial<BridgeConfig>): Promise<BridgeConfig> {
    const next = { ...this.current, ...patch };
    await writeConfigAtomic(next);
    this.current = next;
    logging.info("config updated", { keys: Object.keys(patch) });
    return next;
  }
}

// Development-only config — used when PRINTER_BRIDGE_DEV=1 so the daemon can
// start without a real bootstrap. Points to a no-op loopback. Port defaults
// to 3901 but can be overridden via PRINTER_BRIDGE_PORT (0 = ephemeral).
export function devConfig(): BridgeConfig {
  const portEnv = process.env.PRINTER_BRIDGE_PORT;
  const listenPort =
    portEnv !== undefined && portEnv !== "" && !Number.isNaN(Number(portEnv))
      ? Number(portEnv)
      : DEFAULT_LISTEN_PORT;
  return {
    version: "0.1.0",
    locationId: "00000000-0000-0000-0000-000000000000",
    tenantSlug: "dev",
    endpointUrl: "http://127.0.0.1/print",
    heartbeatUrl: "http://127.0.0.1/api/printers/heartbeat",
    token: "dev-token-replace-in-config",
    listenPort,
    transport: "auto",
    cupsPrinterName: null,
    paperWidth: 80,
    codePage: "big5",
    driver: "generic",
    logLevel: "warn",
    sentryDsn: null,
  };
}

export function getHomeFallbackConfigDir(): string {
  // Alternate user-level dir for dev bridges where root paths aren't writable.
  return path.join(os.homedir(), ".printer-bridge");
}
