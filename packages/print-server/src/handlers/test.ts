import type { IncomingMessage, ServerResponse } from "node:http";
import type { BridgeContext } from "../daemon.js";
import { buildTestPage, getDriver } from "@macau-pos/escpos-shared";
import { TestRequestSchema } from "../schemas.js";
import {
  InvalidJson,
  PayloadTooLarge,
  readJson,
  sendJson,
} from "../util/http.js";
import { idempotencyKey } from "../middleware/idempotency.js";
import { BridgeError } from "../errors.js";
import { logging } from "../util/logging.js";

export async function handleTest(
  req: IncomingMessage,
  res: ServerResponse,
  ctx: BridgeContext,
): Promise<void> {
  const jobId = idempotencyKey(req) ?? cryptoRandomId();

  const cached = ctx.idempotency.get(jobId);
  if (cached) {
    return sendJson(res, cached.status, cached.body as Record<string, unknown>);
  }

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

  const parsed = TestRequestSchema.safeParse(body);
  if (!parsed.success) {
    return sendJson(res, 400, {
      ok: false,
      jobId,
      error: "invalid_payload",
      message: parsed.error.errors.map((e) => e.message).join("; "),
    });
  }

  const cfg = ctx.configStore.get();
  const driver = parsed.data.driver ?? cfg.driver;
  const paperWidth = parsed.data.paperWidth ?? cfg.paperWidth;
  const codePage = parsed.data.codePage ?? cfg.codePage;
  const shopName = parsed.data.shopName ?? cfg.tenantSlug;
  const locationName = parsed.data.locationName ?? cfg.locationId;
  const { kickDrawer, timeoutMs } = parsed.data;

  const bytes = buildTestPage({
    shopName,
    locationName,
    timestamp: new Date(),
    driver,
    paperWidth,
    codePage,
  });

  const kickBytes = kickDrawer ? getDriver(driver).kickDrawer() : null;
  const started = Date.now();
  try {
    await ctx.writeLock.run(async () => {
      await ctx.transport.write(bytes, { timeoutMs });
      if (kickBytes) await ctx.transport.write(kickBytes, { timeoutMs });
    });
  } catch (err) {
    logging.error("test print failed", {
      jobId,
      err: (err as Error).message,
    });
    if (err instanceof BridgeError) {
      return sendJson(res, err.status, {
        ok: false,
        jobId,
        error: err.code,
        message: err.message,
        retryable: true,
      });
    }
    return sendJson(res, 500, {
      ok: false,
      jobId,
      error: "bridge_internal",
      message: (err as Error).message,
      retryable: true,
    });
  }

  const durationMs = Date.now() - started;
  const probe = await ctx.transport.probe();
  const body200 = {
    ok: true as const,
    jobId,
    durationMs,
    printerStatus: probe.up ? "ok" : "offline",
  };
  ctx.metrics.jobsServedTotal += 1;
  ctx.idempotency.set(jobId, 200, body200);
  sendJson(res, 200, body200);
}

function cryptoRandomId(): string {
  // Non-crypto-strength fallback (only used when no Idempotency-Key was sent).
  return `test-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}
