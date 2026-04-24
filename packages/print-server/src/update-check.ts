import type { BridgeContext } from "./daemon.js";
import { logging } from "./util/logging.js";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1h

export interface UpdateCheckHandle {
  stop(): void;
}

// Implemented in sub-phase L (self-update + rollback).
export function startUpdateCheck(_ctx: BridgeContext): UpdateCheckHandle {
  if (process.env.PRINTER_BRIDGE_NO_UPDATE_CHECK === "1") {
    return { stop() {} };
  }
  logging.debug("update-check stub (sub-phase L)");
  const timer = setInterval(() => {
    logging.debug("update-check tick (noop)");
  }, UPDATE_CHECK_INTERVAL_MS);
  timer.unref();
  return {
    stop() {
      clearInterval(timer);
    },
  };
}
