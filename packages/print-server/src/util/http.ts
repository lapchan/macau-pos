import type { IncomingMessage, ServerResponse } from "node:http";

// Default body cap (slightly above the base64 print ceiling so we still
// reach Zod validation and emit a typed `payload_too_large` error rather
// than a bare 413).
const DEFAULT_MAX_BYTES = 128 * 1024;

export async function readJson<T = unknown>(
  req: IncomingMessage,
  maxBytes: number = DEFAULT_MAX_BYTES,
): Promise<T> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
    size += buf.length;
    if (size > maxBytes) throw new PayloadTooLarge();
    chunks.push(buf);
  }
  if (size === 0) return {} as T;
  const text = Buffer.concat(chunks).toString("utf-8");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new InvalidJson();
  }
}

export class PayloadTooLarge extends Error {
  readonly code = "payload_too_large" as const;
}

export class InvalidJson extends Error {
  readonly code = "invalid_payload" as const;
}

export function sendJson(
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  if (res.headersSent) return;
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}
