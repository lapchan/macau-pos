import { decryptSecret } from "../crypto";
import { buildInboundHeaders, type HttpMethod } from "./sign";

export interface IntellipayCredentials {
  accessKeyId: string;
  privateKeyPemEncrypted: string;
}

export type IntellipayErrorType =
  | "auth"
  | "invalid_request"
  | "not_found"
  | "conflict"
  | "upstream"
  | "server"
  | "network"
  | "unknown";

export interface IntellipayErrorEnvelope {
  error: {
    code: string;
    type: string;
    message: string;
    details: unknown;
    status: number;
    request_id?: string;
  };
}

export type IntellipayCallResult<T> =
  | { ok: true; status: number; data: T; requestId: string | null }
  | {
      ok: false;
      status: number;
      errorCode: string;
      errorType: IntellipayErrorType;
      message: string;
      requestId: string | null;
      raw?: unknown;
    };

export interface CallIntellipayOptions {
  baseUrl?: string;
  method?: HttpMethod;
  idempotencyKey?: string;
  timeoutMs?: number;
}

export async function callIntellipay<T>(
  credentials: IntellipayCredentials,
  path: string,
  body: Record<string, unknown>,
  opts: CallIntellipayOptions = {},
): Promise<IntellipayCallResult<T>> {
  const baseUrl = opts.baseUrl ?? process.env.INTELLIPAY_BASE_URL;
  if (!baseUrl) {
    return {
      ok: false,
      status: 0,
      errorCode: "config_missing",
      errorType: "unknown",
      message: "INTELLIPAY_BASE_URL is not set",
      requestId: null,
    };
  }
  if (!path.startsWith("/")) {
    return {
      ok: false,
      status: 0,
      errorCode: "bad_path",
      errorType: "unknown",
      message: `Intellipay path must be absolute, got: ${path}`,
      requestId: null,
    };
  }

  let privateKeyPem: string;
  try {
    privateKeyPem = decryptSecret(credentials.privateKeyPemEncrypted);
  } catch (err) {
    return {
      ok: false,
      status: 0,
      errorCode: "key_decrypt_failed",
      errorType: "auth",
      message: err instanceof Error ? err.message : String(err),
      requestId: null,
    };
  }

  const method: HttpMethod = opts.method ?? "POST";
  const rawBody = JSON.stringify(body);
  const headers = buildInboundHeaders({
    method,
    path,
    rawBody,
    accessKeyId: credentials.accessKeyId,
    privateKeyPem,
  });

  const extraHeaders: Record<string, string> = {};
  if (opts.idempotencyKey) {
    extraHeaders["Idempotency-Key"] = opts.idempotencyKey;
  }

  const url = baseUrl.replace(/\/+$/, "") + path;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    opts.timeoutMs ?? 15_000,
  );

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { ...headers, ...extraHeaders },
      body: rawBody,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    return {
      ok: false,
      status: 0,
      errorCode: "network_error",
      errorType: "network",
      message: err instanceof Error ? err.message : String(err),
      requestId: null,
    };
  }
  clearTimeout(timer);

  const requestId = res.headers.get("X-Request-Id");
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    return {
      ok: false,
      status: res.status,
      errorCode: "bad_response",
      errorType: "server",
      message: `Non-JSON response: ${text.slice(0, 200)}`,
      requestId,
    };
  }

  if (res.ok) {
    return { ok: true, status: res.status, data: parsed as T, requestId };
  }

  const envelope = parsed as Partial<IntellipayErrorEnvelope> | null;
  const errorCode = envelope?.error?.code ?? `http_${res.status}`;
  const errorType = (envelope?.error?.type as IntellipayErrorType) ?? "unknown";
  const message = envelope?.error?.message ?? `HTTP ${res.status}`;
  return {
    ok: false,
    status: res.status,
    errorCode,
    errorType,
    message,
    requestId: envelope?.error?.request_id ?? requestId,
    raw: parsed,
  };
}

export interface MerchantInfoResponse {
  merchant: { id: string; name: string };
  operator: {
    id: string;
    name: string;
    channels: string[];
    enable_refund: boolean;
    webhook_url: string | null;
    terminals: Array<{
      terminal_id: string;
      name: string | null;
      available_payment_services: string[];
      available_payment_providers: string[];
    }>;
  };
}

export function fetchMerchantInfo(
  credentials: IntellipayCredentials,
  opts?: CallIntellipayOptions,
): Promise<IntellipayCallResult<MerchantInfoResponse>> {
  return callIntellipay<MerchantInfoResponse>(
    credentials,
    "/v1/retailai/merchant/info",
    {},
    opts,
  );
}
