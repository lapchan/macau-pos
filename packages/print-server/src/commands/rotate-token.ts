import type { BridgeContext } from "../daemon.js";
import type { HeartbeatCommand } from "./apply.js";
import { logging } from "../util/logging.js";

export interface RotateTokenPayload {
  newToken: string;
  effectiveAt?: string;
}

// Applies a rotate_token command received from the admin server during M1's
// rotation-overlap window. The admin has already stored the HMAC of this
// token as `pending_token_hash` and started accepting BOTH tokens. Our job:
// 1. Write the new token to local config atomically.
// 2. Keep the old token around as pendingToken until effectiveAt so requests
//    that raced the rotation still succeed (bearer-auth accepts both).
// 3. Next heartbeat ACKs; admin promotes pending→primary and we drop the old.
export async function applyRotateToken(
  ctx: BridgeContext,
  cmd: HeartbeatCommand,
): Promise<void> {
  const payload = cmd.payload as Partial<RotateTokenPayload>;
  if (!payload || typeof payload.newToken !== "string" || !payload.newToken) {
    throw new Error("rotate_token: payload.newToken required");
  }

  const cfg = ctx.configStore.get();
  const oldPrimary = cfg.token;

  const patch: Partial<typeof cfg> = {
    token: payload.newToken,
    // Old primary becomes the overlap token — bearer-auth checks both.
    pendingToken: oldPrimary,
    rotationOverlapUntil: payload.effectiveAt ?? null,
  };
  await ctx.configStore.update(patch);

  logging.info("rotate_token applied", {
    id: cmd.id,
    effectiveAt: payload.effectiveAt ?? null,
  });
}
