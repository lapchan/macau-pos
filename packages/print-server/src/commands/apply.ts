import type { BridgeContext } from "../daemon.js";
import { applyRotateToken } from "./rotate-token.js";
import { applyReloadConfig } from "./reload-config.js";
import { applyForceUpdate } from "./force-update.js";
import { logging } from "../util/logging.js";

export interface HeartbeatCommand {
  id: string;
  type: "rotate_token" | "force_update" | "reload_config";
  payload: Record<string, unknown>;
}

// Applies each command in order. Returns the ID of the LAST successfully
// applied command for the next heartbeat to ACK. A failed command stops the
// chain so we don't ACK downstream commands that never ran.
export async function applyCommands(
  ctx: BridgeContext,
  commands: HeartbeatCommand[],
): Promise<string | undefined> {
  let lastId: string | undefined;
  for (const cmd of commands) {
    try {
      await dispatch(ctx, cmd);
      lastId = cmd.id;
    } catch (err) {
      logging.error("command failed — stopping chain", {
        id: cmd.id,
        type: cmd.type,
        err: (err as Error).message,
      });
      return lastId;
    }
  }
  return lastId;
}

async function dispatch(
  ctx: BridgeContext,
  cmd: HeartbeatCommand,
): Promise<void> {
  switch (cmd.type) {
    case "rotate_token":
      await applyRotateToken(ctx, cmd);
      return;
    case "reload_config":
      await applyReloadConfig(ctx, cmd);
      return;
    case "force_update":
      await applyForceUpdate(ctx, cmd);
      return;
    default: {
      // Unknown type — log and skip, don't ACK so server can evolve commands.
      const unknown = (cmd as { type?: string }).type ?? "unknown";
      logging.warn("unknown command type — ignored", {
        id: cmd.id,
        type: unknown,
      });
      throw new Error(`unknown command type: ${unknown}`);
    }
  }
}
