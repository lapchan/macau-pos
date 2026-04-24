import type { IncomingMessage, ServerResponse } from "node:http";
import { logging } from "../util/logging.js";

const START_SYM = Symbol("access-start");

export function accessStart(req: IncomingMessage): void {
  (req as unknown as { [START_SYM]: number })[START_SYM] = Date.now();
}

export function accessEnd(
  req: IncomingMessage,
  res: ServerResponse,
): void {
  const startedAt =
    (req as unknown as { [START_SYM]?: number })[START_SYM] ?? Date.now();
  const durationMs = Date.now() - startedAt;
  // Socket can be null if the request was aborted mid-body (client hung up,
  // payload-too-large reject, etc.) — guard so logging doesn't crash.
  const ip = req.socket?.remoteAddress ?? null;
  logging.info("http", {
    method: req.method,
    path: req.url,
    status: res.statusCode,
    durationMs,
    ip,
  });
}
