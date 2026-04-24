import type { IncomingMessage, ServerResponse } from "node:http";
import type { BridgeContext } from "../daemon.js";

// §5.2.5: plain text, no auth. Used by monitoring to confirm the tunnel
// is reachable without a token.
export function handleVersion(
  _req: IncomingMessage,
  res: ServerResponse,
  ctx: BridgeContext,
): void {
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(ctx.configStore.get().version);
}
