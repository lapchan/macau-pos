"use server";

import { randomUUID } from "crypto";
import {
  buildReceipt,
  type ReceiptInput,
  type ReceiptLocale,
} from "@macau-pos/escpos-shared";
import { getReceiptData } from "./receipt-queries";

// Minimal wiring for live-fire bridge tests. Reads the bridge URL and raw
// bearer token from server-only env vars; the browser never sees the token.
// The proper per-location settings-API flow lands in sub-phase I alongside
// CF provisioning; this is the temporary short-circuit.
const BRIDGE_URL =
  process.env.PRINTER_BRIDGE_URL ?? "http://127.0.0.1:9321/print";
const BRIDGE_TOKEN = process.env.PRINTER_BRIDGE_TOKEN ?? "";

export type NetworkPrintResult =
  | { ok: true; jobId: string; durationMs: number }
  | { ok: false; error: string; message?: string };

export async function printReceiptToNetwork(
  orderNumber: string,
  locale: ReceiptLocale = "tc",
): Promise<NetworkPrintResult> {
  if (!BRIDGE_TOKEN) {
    return {
      ok: false,
      error: "config",
      message: "PRINTER_BRIDGE_TOKEN env var not set on the cashier server",
    };
  }

  const data = await getReceiptData(orderNumber);
  if (!data) return { ok: false, error: "not_found" };

  const input: ReceiptInput = {
    shopName: data.shopName,
    shopAddress: data.showAddress ? data.shopAddress : undefined,
    shopPhone: data.showPhone ? data.shopPhone : undefined,
    orderNumber: data.orderNumber,
    timestamp: data.orderDate,
    cashierName: data.cashierName,
    items: data.items.map((i) => {
      const localized = i.translations?.[locale] ?? i.name;
      return {
        name: i.variantName ? `${localized} · ${i.variantName}` : localized,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        discount:
          i.discountAmount > 0 ? (i.discountNote ?? String(i.discountAmount)) : undefined,
      };
    }),
    subtotal: data.subtotal,
    discountAmount: data.discountAmount > 0 ? data.discountAmount : undefined,
    taxAmount: data.showTax && data.taxAmount > 0 ? data.taxAmount : undefined,
    total: data.total,
    paymentMethod: data.paymentMethod,
    cashReceived: data.cashReceived,
    change: data.changeGiven,
    footer: data.receiptFooter,
    currency: data.currency,
    locale,
  };

  const bytes = buildReceipt(
    { driver: "generic", paperWidth: 80, codePage: "gb18030" },
    input,
  );

  const res = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BRIDGE_TOKEN}`,
      "Idempotency-Key": randomUUID(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bytesBase64: Buffer.from(bytes).toString("base64"),
      copies: 1,
      kickDrawer: false,
    }),
  }).catch((err) => ({ ok: false as const, status: 0, _err: err as Error }));

  if ("status" in res && res.status === 0) {
    return {
      ok: false,
      error: "fetch_failed",
      message: (res as { _err: Error })._err.message,
    };
  }
  const response = res as Response;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      ok: false,
      error: `http_${response.status}`,
      message: payload?.message ?? payload?.error ?? response.statusText,
    };
  }
  return {
    ok: true,
    jobId: payload?.jobId ?? "unknown",
    durationMs: payload?.durationMs ?? 0,
  };
}

// ─── Option A — URL-scheme print receiver ────────────────────────────
// For iPads with the "POS Print Receiver" iOS app installed. Server builds
// the same ESC/POS bytes as the bridge path above, but returns them to the
// cashier (instead of posting to a bridge daemon). The cashier fires
// `pos-print://send?host=…&port=…&bytes=BASE64` to hand off to the iOS app,
// which writes bytes directly to the LAN printer over TCP.
//
// Per-terminal config lives in `terminals.device_info.printer.{host,port}` —
// no schema change needed.

import { db, terminals, eq } from "@macau-pos/database";

export type ReceiptBytesResult =
  | {
      ok: true;
      host: string;
      port: number;
      bytesBase64: string;
      jobId: string;
      /** Human-readable summary for the iOS app's status UI. e.g. "CS-260503-0001 · MOP 25.50" */
      label: string;
    }
  | { ok: false; error: string; message?: string };

interface DeviceInfoPrinterConfig {
  method?: "url-scheme" | "bridge";
  host?: string;
  port?: number;
}

export async function getReceiptBytesForUrlScheme(
  orderNumber: string,
  terminalId: string,
  locale: ReceiptLocale = "tc",
): Promise<ReceiptBytesResult> {
  // Terminal-scoped printer config — caller must pass terminalId so the same
  // server can serve different printers per cashier station.
  const [term] = await db
    .select({ deviceInfo: terminals.deviceInfo })
    .from(terminals)
    .where(eq(terminals.id, terminalId))
    .limit(1);

  if (!term) {
    return { ok: false, error: "terminal_not_found" };
  }

  const cfg = (term.deviceInfo as { printer?: DeviceInfoPrinterConfig } | null)?.printer;
  // Only succeed if terminal is explicitly configured for URL-scheme. Other
  // methods (bridge, none) → return error so the caller can try its fallback.
  if (cfg?.method !== "url-scheme") {
    return { ok: false, error: "method_not_configured" };
  }
  if (!cfg.host || !cfg.port) {
    return {
      ok: false,
      error: "incomplete_printer_config",
      message:
        "Terminal has method='url-scheme' but missing host/port in device_info.printer",
    };
  }

  const data = await getReceiptData(orderNumber);
  if (!data) return { ok: false, error: "order_not_found" };

  const input: ReceiptInput = {
    shopName: data.shopName,
    shopAddress: data.showAddress ? data.shopAddress : undefined,
    shopPhone: data.showPhone ? data.shopPhone : undefined,
    orderNumber: data.orderNumber,
    timestamp: data.orderDate,
    cashierName: data.cashierName,
    items: data.items.map((i) => {
      const localized = i.translations?.[locale] ?? i.name;
      return {
        name: i.variantName ? `${localized} · ${i.variantName}` : localized,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        discount:
          i.discountAmount > 0 ? (i.discountNote ?? String(i.discountAmount)) : undefined,
      };
    }),
    subtotal: data.subtotal,
    discountAmount: data.discountAmount > 0 ? data.discountAmount : undefined,
    taxAmount: data.showTax && data.taxAmount > 0 ? data.taxAmount : undefined,
    total: data.total,
    paymentMethod: data.paymentMethod,
    cashReceived: data.cashReceived,
    change: data.changeGiven,
    footer: data.receiptFooter,
    currency: data.currency,
    locale,
  };

  const bytes = buildReceipt(
    { driver: "generic", paperWidth: 80, codePage: "gb18030" },
    input,
  );

  // Compact human-readable label for the iOS app's status UI. Plan: Option 2 §UI.
  const label = `${data.orderNumber} · ${data.currency} ${data.total.toFixed(2)}`;

  return {
    ok: true,
    host: cfg.host,
    port: cfg.port,
    bytesBase64: Buffer.from(bytes).toString("base64"),
    jobId: randomUUID(),
    label,
  };
}
