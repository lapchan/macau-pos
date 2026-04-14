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

// Upstream returns `{ payment: { ... } }` for creates/query/cancel and
// `{ refund: { ... } }` for refund. Everything below unwraps to the inner
// object so callers can keep using flat `ipResult.data.payment_id` access.

interface UpstreamPayment {
  payment_id: string;
  payment_token?: string;
  payment_url?: string | null;
  payment_provider_qr_code?: string | null;
  payment_universal_qr_code?: string | null;
  status?: number;
  status_desc?: string;
  is_payment_paid_successfully?: boolean;
  order_id?: string;
  order_amount?: number;
  order_currency?: string;
  payment_service_code?: number | null;
  payment_channel?: string | null;
  channel_trans_id?: string | null;
  terminal_id?: string | null;
  payment_provider_code?: number | null;
}

interface UpstreamRefund {
  refund_id?: string;
  payment_id: string;
  refund_amount?: number;
  refund_currency?: string;
  is_payment_refunded_successfully?: boolean;
  is_payment_fully_refunded?: boolean;
  payment_provider_refund_id?: string;
  refund_result_code?: string;
  refund_result_message?: string;
  status?: number;
  status_desc?: string;
}

async function callAndUnwrapPayment<T>(
  credentials: IntellipayCredentials,
  path: string,
  body: Record<string, unknown>,
  opts?: CallIntellipayOptions,
): Promise<IntellipayCallResult<T>> {
  const res = await callIntellipay<{ payment: UpstreamPayment }>(
    credentials,
    path,
    body,
    opts,
  );
  if (!res.ok) return res;
  const inner = (res.data?.payment ?? {}) as unknown as T;
  return { ok: true, status: res.status, data: inner, requestId: res.requestId };
}

async function callAndUnwrapRefund<T>(
  credentials: IntellipayCredentials,
  path: string,
  body: Record<string, unknown>,
  opts?: CallIntellipayOptions,
): Promise<IntellipayCallResult<T>> {
  const res = await callIntellipay<{ refund: UpstreamRefund }>(
    credentials,
    path,
    body,
    opts,
  );
  if (!res.ok) return res;
  const inner = (res.data?.refund ?? {}) as unknown as T;
  return { ok: true, status: res.status, data: inner, requestId: res.requestId };
}

export interface CreateOnlinePaymentInput {
  order_id: string;
  order_amount: number;
  order_currency: string;
  subject: string;
  payment_service: string;
  callback_url: string;
  webhook_url: string;
  description?: string;
  merchant_id?: string;
  operator_id?: string;
}

export interface CreateOnlinePaymentResponse {
  payment_id: string;
  order_id?: string;
  status?: number;
  status_desc?: string;
  payment_url: string;
  qr_code_url?: string | null;
  provider_code?: string | null;
  payment_service?: string | null;
  terminal_id?: string | null;
  order_amount?: number;
  order_currency?: string;
}

export async function createOnlinePayment(
  credentials: IntellipayCredentials,
  body: CreateOnlinePaymentInput,
  opts?: CallIntellipayOptions,
): Promise<IntellipayCallResult<CreateOnlinePaymentResponse>> {
  // Map our { webhook_url, callback_url } onto upstream { notify_url, callback_url }.
  const upstreamBody: Record<string, unknown> = {
    ...body,
    payment_type: "web",
    notify_url: body.webhook_url,
  };
  delete upstreamBody.webhook_url;

  const res = await callIntellipay<{ payment: UpstreamPayment }>(
    credentials,
    "/v1/retailai/payments/online/create",
    upstreamBody,
    opts,
  );
  if (!res.ok) return res as IntellipayCallResult<CreateOnlinePaymentResponse>;
  const p = res.data?.payment ?? ({} as UpstreamPayment);
  return {
    ok: true,
    status: res.status,
    requestId: res.requestId,
    data: {
      payment_id: p.payment_id,
      order_id: p.order_id,
      status: p.status,
      status_desc: p.status_desc,
      payment_url: p.payment_url ?? "",
      qr_code_url: p.payment_provider_qr_code ?? null,
      provider_code: p.payment_provider_code != null ? String(p.payment_provider_code) : null,
      payment_service: p.payment_service_code != null ? String(p.payment_service_code) : null,
      terminal_id: p.terminal_id ?? null,
      order_amount: p.order_amount,
      order_currency: p.order_currency,
    },
  };
}

export interface CreateMpqrPaymentInput {
  order_id: string;
  order_amount: number;
  order_currency: string;
  subject: string;
  payment_service: string;
  terminal_id: string;
  webhook_url: string;
  description?: string;
  merchant_id?: string;
  operator_id?: string;
}

export interface CreateMpqrPaymentResponse {
  payment_id: string;
  order_id?: string;
  status?: number;
  status_desc?: string;
  qr_code_url?: string | null;
  qr_code_content?: string | null;
  provider_code?: string | null;
  payment_service?: string | null;
  terminal_id?: string | null;
  expires_at?: string | null;
  order_amount?: number;
  order_currency?: string;
}

export async function createMpqrPayment(
  credentials: IntellipayCredentials,
  body: CreateMpqrPaymentInput,
  opts?: CallIntellipayOptions,
): Promise<IntellipayCallResult<CreateMpqrPaymentResponse>> {
  const upstreamBody: Record<string, unknown> = {
    ...body,
    payment_type: "terminal",
    notify_url: body.webhook_url,
  };
  delete upstreamBody.webhook_url;

  const res = await callIntellipay<{ payment: UpstreamPayment }>(
    credentials,
    "/v1/retailai/payments/qr-code/create",
    upstreamBody,
    opts,
  );
  if (!res.ok) return res as IntellipayCallResult<CreateMpqrPaymentResponse>;
  const p = res.data?.payment ?? ({} as UpstreamPayment);
  return {
    ok: true,
    status: res.status,
    requestId: res.requestId,
    data: {
      payment_id: p.payment_id,
      order_id: p.order_id,
      status: p.status,
      status_desc: p.status_desc,
      qr_code_url: p.payment_provider_qr_code ?? p.payment_url ?? null,
      qr_code_content: p.payment_universal_qr_code ?? null,
      provider_code: p.payment_provider_code != null ? String(p.payment_provider_code) : null,
      payment_service: p.payment_service_code != null ? String(p.payment_service_code) : null,
      terminal_id: p.terminal_id ?? null,
      expires_at: null,
      order_amount: p.order_amount,
      order_currency: p.order_currency,
    },
  };
}

export interface CreateCpmPaymentInput {
  order_id: string;
  order_amount: number;
  order_currency: string;
  subject: string;
  payment_service: string;
  auth_code: string;
  terminal_id: string;
  webhook_url: string;
  description?: string;
  merchant_id?: string;
  operator_id?: string;
}

export interface CreateCpmPaymentResponse {
  payment_id: string;
  order_id?: string;
  status?: number;
  status_desc?: string;
  provider_code?: string | null;
  payment_service?: string | null;
  terminal_id?: string | null;
  order_amount?: number;
  order_currency?: string;
}

export async function createCpmPayment(
  credentials: IntellipayCredentials,
  body: CreateCpmPaymentInput,
  opts?: CallIntellipayOptions,
): Promise<IntellipayCallResult<CreateCpmPaymentResponse>> {
  // Upstream field is `payment_authorization_code`, not `auth_code`.
  const { auth_code, webhook_url, ...rest } = body;
  const upstreamBody: Record<string, unknown> = {
    ...rest,
    payment_authorization_code: auth_code,
    notify_url: webhook_url,
  };

  const res = await callIntellipay<{ payment: UpstreamPayment }>(
    credentials,
    "/v1/retailai/payments/cp-mode/create",
    upstreamBody,
    opts,
  );
  if (!res.ok) return res as IntellipayCallResult<CreateCpmPaymentResponse>;
  const p = res.data?.payment ?? ({} as UpstreamPayment);
  return {
    ok: true,
    status: res.status,
    requestId: res.requestId,
    data: {
      payment_id: p.payment_id,
      order_id: p.order_id,
      status: p.status,
      status_desc: p.status_desc,
      provider_code: p.payment_provider_code != null ? String(p.payment_provider_code) : null,
      payment_service: p.payment_service_code != null ? String(p.payment_service_code) : null,
      terminal_id: p.terminal_id ?? null,
      order_amount: p.order_amount,
      order_currency: p.order_currency,
    },
  };
}

export interface QueryPaymentResponse {
  payment_id: string;
  order_id?: string;
  status?: number;
  status_desc?: string;
  is_payment_paid_successfully?: boolean;
  payment_paid_at?: string | null;
  order_amount?: number;
  order_currency?: string;
  terminal_id?: string | null;
  channel_trans_id?: string | null;
  payment_provider_trans_id?: string | null;
}

export function queryPayment(
  credentials: IntellipayCredentials,
  paymentId: string,
  opts?: CallIntellipayOptions,
): Promise<IntellipayCallResult<QueryPaymentResponse>> {
  return callAndUnwrapPayment<QueryPaymentResponse>(
    credentials,
    "/v1/retailai/payments/status",
    { payment_id: paymentId },
    opts,
  );
}

export interface CancelPaymentResponse {
  payment_id: string;
  status?: number;
  status_desc?: string;
}

export function cancelPayment(
  credentials: IntellipayCredentials,
  paymentId: string,
  opts?: CallIntellipayOptions,
): Promise<IntellipayCallResult<CancelPaymentResponse>> {
  return callAndUnwrapPayment<CancelPaymentResponse>(
    credentials,
    "/v1/retailai/payments/cancel",
    { payment_id: paymentId },
    opts,
  );
}

export interface RefundPaymentInput {
  // Amount to refund in minor units (e.g., cents). Omit for full refund.
  refund_amount?: number;
  reason?: string;
  merchant_id?: string;
  operator_id?: string;
}

export interface RefundPaymentResponse {
  payment_id: string;
  refund_id?: string;
  status?: number;
  status_desc?: string;
  refunded_amount?: number;
  order_currency?: string;
}

export async function refundPayment(
  credentials: IntellipayCredentials,
  paymentId: string,
  body: RefundPaymentInput,
  opts?: CallIntellipayOptions,
): Promise<IntellipayCallResult<RefundPaymentResponse>> {
  const upstreamBody: Record<string, unknown> = {
    payment_id: paymentId,
    refund_amount: body.refund_amount,
    refund_reason: body.reason,
    ...(body.merchant_id ? { merchant_id: body.merchant_id } : {}),
    ...(body.operator_id ? { operator_id: body.operator_id } : {}),
  };

  const res = await callAndUnwrapRefund<UpstreamRefund>(
    credentials,
    "/v1/retailai/payments/refund",
    upstreamBody,
    opts,
  );
  if (!res.ok) return res as IntellipayCallResult<RefundPaymentResponse>;
  const r = res.data;
  return {
    ok: true,
    status: res.status,
    requestId: res.requestId,
    data: {
      payment_id: r.payment_id,
      refund_id: r.refund_id,
      status: r.status,
      status_desc: r.status_desc,
      refunded_amount: r.refund_amount,
      order_currency: r.refund_currency,
    },
  };
}
