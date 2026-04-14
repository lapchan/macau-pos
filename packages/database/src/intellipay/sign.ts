import { createHash, createSign, createVerify, randomBytes } from "node:crypto";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface SignedRequestHeaders {
  Authorization: string;
  "X-Timestamp": string;
  "X-Nonce": string;
  "X-Signature": string;
  "Content-Type": "application/json";
}

export interface BuildInboundHeadersInput {
  method: HttpMethod;
  path: string;
  rawBody: string;
  accessKeyId: string;
  privateKeyPem: string;
  timestampMs?: number;
  nonce?: string;
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function buildInboundCanonicalString(
  method: HttpMethod,
  path: string,
  timestampMs: string,
  nonce: string,
  rawBody: string,
): string {
  return [method, path, timestampMs, nonce, sha256Hex(rawBody)].join("\n");
}

export function buildInboundHeaders(
  input: BuildInboundHeadersInput,
): SignedRequestHeaders {
  const timestamp = (input.timestampMs ?? Date.now()).toString();
  const nonce = input.nonce ?? randomBytes(16).toString("hex");
  const stringToSign = buildInboundCanonicalString(
    input.method,
    input.path,
    timestamp,
    nonce,
    input.rawBody,
  );
  const signature = createSign("RSA-SHA256")
    .update(stringToSign, "utf8")
    .sign(input.privateKeyPem, "base64");
  return {
    Authorization: `Bearer ${input.accessKeyId}`,
    "X-Timestamp": timestamp,
    "X-Nonce": nonce,
    "X-Signature": `v1=${signature}`,
    "Content-Type": "application/json",
  };
}

export interface VerifyOutboundWebhookInput {
  rawBody: string;
  timestamp: string;
  eventId: string;
  signatureHeader: string;
  publicKeyPem: string;
  skewMs?: number;
  nowMs?: number;
}

export type WebhookVerifyResult =
  | { ok: true }
  | { ok: false; reason: "stale_timestamp" | "bad_signature_version" | "bad_signature" | "missing_fields" };

export function verifyOutboundWebhook(
  input: VerifyOutboundWebhookInput,
): WebhookVerifyResult {
  if (!input.timestamp || !input.eventId || !input.signatureHeader) {
    return { ok: false, reason: "missing_fields" };
  }
  const now = input.nowMs ?? Date.now();
  const skew = input.skewMs ?? 5 * 60 * 1000;
  const ts = Number.parseInt(input.timestamp, 10);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > skew) {
    return { ok: false, reason: "stale_timestamp" };
  }
  if (!input.signatureHeader.startsWith("v1=")) {
    return { ok: false, reason: "bad_signature_version" };
  }
  const signatureB64 = input.signatureHeader.slice(3);
  const stringToSign = [input.timestamp, input.eventId, sha256Hex(input.rawBody)].join("\n");
  const ok = createVerify("RSA-SHA256")
    .update(stringToSign, "utf8")
    .verify(input.publicKeyPem, signatureB64, "base64");
  return ok ? { ok: true } : { ok: false, reason: "bad_signature" };
}
