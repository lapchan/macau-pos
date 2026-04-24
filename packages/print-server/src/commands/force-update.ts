import type { BridgeContext } from "../daemon.js";
import type { HeartbeatCommand } from "./apply.js";
import { performUpdate } from "../self-update.js";
import { logging } from "../util/logging.js";

export interface ForceUpdatePayload {
  targetVersion: string;
}

// Triggers a self-update to the given version (sub-phase L wires the real
// npm install + restart + health-check + rollback). Failure throws so the
// bridge does NOT ACK — admin will re-send next heartbeat.
export async function applyForceUpdate(
  ctx: BridgeContext,
  cmd: HeartbeatCommand,
): Promise<void> {
  const payload = cmd.payload as Partial<ForceUpdatePayload>;
  if (!payload || typeof payload.targetVersion !== "string" || !payload.targetVersion) {
    throw new Error("force_update: payload.targetVersion required");
  }
  const outcome = await performUpdate(ctx, payload.targetVersion);
  if (!outcome.ok) {
    throw new Error(`update failed: ${outcome.reason}`);
  }
  logging.info("force_update applied", {
    id: cmd.id,
    from: ctx.configStore.get().version,
    to: payload.targetVersion,
  });
}
