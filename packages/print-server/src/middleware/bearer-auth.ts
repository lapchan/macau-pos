import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { BridgeContext } from "../daemon.js";

// HMAC helper used by the admin side when hashing tokens for DB storage.
// The bridge itself compares raw-to-raw since it stores the plaintext token
// in its local config file (which is 0600 mode).
export function hashToken(token: string, pepper: string): string {
  return createHmac("sha256", pepper).update(token).digest("hex");
}

function constantTimeEqualString(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf-8");
  const bBuf = Buffer.from(b, "utf-8");
  // timingSafeEqual requires equal length. Pad the shorter buffer so the
  // per-byte compare still runs on both, then reject length mismatch after.
  const len = Math.max(aBuf.length, bBuf.length, 1);
  const a2 = Buffer.alloc(len);
  const b2 = Buffer.alloc(len);
  aBuf.copy(a2);
  bBuf.copy(b2);
  const bytesEqual = timingSafeEqual(a2, b2);
  return bytesEqual && aBuf.length === bBuf.length;
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export function makeBearerAuth(ctx: BridgeContext) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<boolean> => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      sendJson(res, 401, { error: "unauthorized" });
      return false;
    }
    const raw = header.slice(7).trim();
    if (!raw) {
      sendJson(res, 401, { error: "unauthorized" });
      return false;
    }

    const cfg = ctx.configStore.get();
    const primaryOk = constantTimeEqualString(raw, cfg.token);
    const pendingOk = cfg.pendingToken
      ? constantTimeEqualString(raw, cfg.pendingToken)
      : false;

    if (primaryOk || pendingOk) return true;

    sendJson(res, 401, { error: "unauthorized" });
    return false;
  };
}
