import type { BridgeContext } from "./daemon.js";
import { logging } from "./util/logging.js";

// Sub-phase L wires real npm install + restart + rollback. For G, this stub
// logs the request and signals "not implemented" without crashing so the
// command-channel plumbing can be exercised end-to-end.
export async function performUpdate(
  _ctx: BridgeContext,
  targetVersion: string,
): Promise<
  | { ok: true; newVersion: string }
  | { ok: false; reason: string; rolledBackTo?: string }
> {
  logging.warn("self-update stub (sub-phase L)", { targetVersion });
  return { ok: false, reason: "self_update_not_implemented_phase_L" };
}
