import type { IncomingMessage, ServerResponse } from "node:http";
import type { BridgeContext } from "../daemon.js";
import { getDriver } from "@macau-pos/escpos-shared";
import { PrintRequestSchema, MAX_BYTES_BASE64_BYTES } from "../schemas.js";
import {
  InvalidJson,
  PayloadTooLarge,
  readJson,
  sendJson,
} from "../util/http.js";
import { idempotencyKey } from "../middleware/idempotency.js";
import { BridgeError } from "../errors.js";
import { logging } from "../util/logging.js";

export async function handlePrint(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: BridgeContext,
): Promise<void> {
  // Every print must arrive with a stable Idempotency-Key — that header IS
  // the jobId per contract (§5.2.2). Reject early if missing.
  const jobId = idempotencyKey(req);
  if (!jobId) {
    return sendJson(res, 400, {
      ok: false,
      error: "bad_request",
      message: "Idempotency-Key header required",
    });
  }

  // Idempotency replay — serve cached result for repeats within TTL.
  const cached = ctx.idempotency.get(jobId);
  if (cached) {
    logging.info("idempotency hit", { jobId });
    return sendJson(res, cached.status, cached.body as Record<string, unknown>);
  }

  // Maintenance mode (M4 fix): refuse prints while still serving /health.
  if (ctx.mode === "maintenance") {
    return sendJson(res, 503, {
      ok: false,
      jobId,
      error: "printer_offline",
      message: "bridge in maintenance mode",
      retryable: true,
    });
  }

  // Parse + validate body.
  let body: unknown;
  try {
    body = await readJson(req);
  } catch (err) {
    if (err instanceof PayloadTooLarge) {
      return sendJson(res, 413, {
        ok: false,
        jobId,
        error: "payload_too_large",
      });
    }
    if (err instanceof InvalidJson) {
      return sendJson(res, 400, {
        ok: false,
        jobId,
        error: "invalid_payload",
      });
    }
    throw err;
  }

  const parsed = PrintRequestSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, {
      ok: false,
      jobId,
      error: "invalid_payload",
      message: parsed.error.errors.map((e) => e.message).join("; "),
    });
  }
  const { bytesBase64, copies, kickDrawer, timeoutMs } = parsed.data;

  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(Buffer.from(bytesBase64, "base64"));
  } catch {
    return sendJson(res, 400, {
      ok: false,
      jobId,
      error: "invalid_payload",
      message: "bytesBase64 is not valid base64",
    });
  }
  if (bytes.length === 0) {
    return sendJson(res, 400, {
      ok: false,
      jobId,
      error: "invalid_payload",
      message: "empty payload",
    });
  }
  if (bytes.length > MAX_BYTES_BASE64_BYTES) {
    return sendJson(res, 413, {
      ok: false,
      jobId,
      error: "payload_too_large",
    });
  }

  // Append driver-specific drawer-kick bytes once at the end of the last
  // copy if the caller requested it (they didn't bake it into the receipt).
  const cfg = ctx.configStore.get();
  const driver = getDriver(cfg.driver);
  const kickBytes = kickDrawer ? driver.kickDrawer() : null;

  const started = Date.now();
  try {
    await ctx.writeLock.run(async () => {
      for (let i = 0; i < copies; i++) {
        await ctx.transport.write(bytes, { timeoutMs });
        if (kickBytes && i === copies - 1) {
          await ctx.transport.write(kickBytes, { timeoutMs });
        }
      }
    });
  } catch (err) {
    const response = errorResponse(jobId, err);
    // Cache only idempotent outcomes — terminal errors cache for the TTL so
    // a cashier retry doesn't re-print on a now-healthy device. Transient
    // errors (timeout, offline) are NOT cached so retries can succeed.
    logging.error("print failed", {
      jobId,
      err: (err as Error).message,
      code: response.body.error,
    });
    return sendJson(res, response.status, response.body);
  }

  const durationMs = Date.now() - started;
  const probe = await ctx.transport.probe();
  const body200 = {
    ok: true as const,
    jobId,
    durationMs,
    printerStatus: probe.up ? "ok" : "offline",
  };
  ctx.metrics.jobsServedTotal += copies;
  ctx.idempotency.set(jobId, 200, body200);
  sendJson(res, 200, body200);
}

function errorResponse(
  jobId: string,
  err: unknown,
): { status: number; body: Record<string, unknown> } {
  if (err instanceof BridgeError) {
    const retryable =
      err.code === "printer_offline" ||
      err.code === "printer_timeout" ||
      err.code === "printer_paper_out" ||
      err.code === "rate_limited";
    return {
      status: err.status,
      body: {
        ok: false,
        jobId,
        error: mapErrorCode(err.code),
        message: err.message,
        retryable,
      },
    };
  }
  return {
    status: 500,
    body: {
      ok: false,
      jobId,
      error: "bridge_internal",
      message: (err as Error).message ?? "unknown",
      retryable: true,
    },
  };
}

function mapErrorCode(code: string): string {
  // Collapse our internal codes to the public contract from planning §5.2.2.
  switch (code) {
    case "printer_paper_out":
      return "no_paper";
    case "printer_cover_open":
    case "printer_error":
    case "printer_offline":
      return "printer_offline";
    case "printer_timeout":
      return "printer_timeout";
    case "transport_unavailable":
      return "printer_offline";
    default:
      return code;
  }
}
