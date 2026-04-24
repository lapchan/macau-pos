import type { BridgeContext } from "../daemon.js";
import type { HeartbeatCommand } from "./apply.js";
import { loadConfig } from "../config.js";
import { logging, setLogLevel } from "../util/logging.js";

// Re-reads config.json from disk without restarting the daemon. Used when
// admin has externally edited configuration (rare — mostly a support tool).
// Token changes go through rotate_token, not reload_config.
export async function applyReloadConfig(
  ctx: BridgeContext,
  cmd: HeartbeatCommand,
): Promise<void> {
  try {
    const { config } = await loadConfig();
    await ctx.configStore.update(config);
    setLogLevel(config.logLevel);
    logging.info("reload_config applied", { id: cmd.id });
  } catch (err) {
    logging.error("reload_config failed", {
      id: cmd.id,
      err: (err as Error).message,
    });
    throw err;
  }
}
