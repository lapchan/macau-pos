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
