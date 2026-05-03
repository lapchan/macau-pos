"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getReceiptData, type ReceiptData } from "@/lib/receipt-queries";
import {
  printReceiptToNetwork,
  getReceiptBytesForUrlScheme,
} from "@/lib/network-printer";
import { type Locale, t } from "@/i18n/locales";
import { PAYMENT_METHOD_KEYS } from "@/lib/constants";

type Props = {
  receiptData?: ReceiptData | null;
  orderNumber?: string;
  locale?: Locale;
  children: (props: { onPrint: () => void; isPrinting: boolean }) => React.ReactNode;
};

/**
 * Prints via a hidden iframe so the main app DOM is never touched.
 * This prevents React re-renders and ghost click events after print dialog closes.
 */
export default function PrintReceipt({ receiptData, orderNumber, locale = "tc", children }: Props) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [data, setData] = useState<ReceiptData | null>(receiptData || null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (receiptData) setData(receiptData);
  }, [receiptData]);

  const printViaIframe = useCallback((receiptHtml: string) => {
    // Remove old iframe if exists
    if (iframeRef.current) {
      document.body.removeChild(iframeRef.current);
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-10000px";
    iframe.style.left = "-10000px";
    iframe.style.width = "80mm";
    iframe.style.height = "0";
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) { setIsPrinting(false); return; }

    doc.open();
    doc.write(`<!DOCTYPE html>
<html><head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: "Courier New", "Courier", monospace; font-size: 12px; width: 80mm; color: #000; }
  @page { size: 80mm auto; margin: 2mm; }
  .receipt-center { text-align: center; }
  .receipt-bold { font-weight: bold; }
  .receipt-large { font-size: 16px; }
  .receipt-small { font-size: 10px; }
  .receipt-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 1px 0; }
  .receipt-row-left { flex: 1; min-width: 0; word-wrap: break-word; padding-right: 8px; }
  .receipt-row-right { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .receipt-divider { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .receipt-double-divider { border: none; border-top: 2px solid #000; margin: 8px 0; }
</style>
</head><body>${receiptHtml}</body></html>`);
    doc.close();

    // Wait for content to render, then print
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (iframeRef.current) {
          document.body.removeChild(iframeRef.current);
          iframeRef.current = null;
        }
        setIsPrinting(false);
      }, 500);
    }, 100);
  }, []);

  const buildReceiptHtml = useCallback((d: ReceiptData): string => {
    const cur = d.currency;
    const paymentLabel = PAYMENT_METHOD_KEYS[d.paymentMethod] ? t(locale, PAYMENT_METHOD_KEYS[d.paymentMethod] as any) : d.paymentMethod;

    const formatDate = (date: Date) => {
      const dt = new Date(date);
      return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}-${String(dt.getDate()).padStart(2,"0")} ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}:${String(dt.getSeconds()).padStart(2,"0")}`;
    };

    let html = "";
    html += `<div class="receipt-center receipt-bold receipt-large" style="margin-bottom:4px">${d.shopName}</div>`;
    if (d.showAddress && d.shopAddress) html += `<div class="receipt-center receipt-small">${d.shopAddress}</div>`;
    if (d.showPhone && d.shopPhone) html += `<div class="receipt-center receipt-small">${d.shopPhone}</div>`;
    html += `<hr class="receipt-double-divider">`;
    if (d.receiptHeader) html += `<div class="receipt-center receipt-small">${d.receiptHeader}</div><hr class="receipt-divider">`;
    html += `<div class="receipt-row"><span>${t(locale, "receiptOrder")}: ${d.orderNumber}</span></div>`;
    html += `<div class="receipt-row receipt-small"><span>${formatDate(d.orderDate)}</span></div>`;
    html += `<hr class="receipt-divider">`;

    for (const item of d.items) {
      const rawTotal = (item.unitPrice * item.quantity).toFixed(2);
      html += `<div class="receipt-row"><span class="receipt-row-left">${item.name} x${item.quantity}</span><span class="receipt-row-right">${cur} ${rawTotal}</span></div>`;
      if (item.variantName) html += `<div class="receipt-small" style="padding-left:8px;color:#666">· ${item.variantName}</div>`;
      if (item.discountAmount > 0) html += `<div class="receipt-row receipt-small" style="padding-left:8px;color:#666"><span>${item.discountNote || t(locale, "receiptDiscount")}</span><span class="receipt-row-right">-${cur} ${item.discountAmount.toFixed(2)}</span></div>`;
    }

    html += `<hr class="receipt-divider">`;
    html += `<div class="receipt-row"><span>${t(locale, "receiptSubtotal")}</span><span class="receipt-row-right">${cur} ${d.subtotal.toFixed(2)}</span></div>`;
    if (d.discountAmount > 0) html += `<div class="receipt-row"><span>${d.discountNote || t(locale, "receiptDiscount")}</span><span class="receipt-row-right">-${cur} ${d.discountAmount.toFixed(2)}</span></div>`;
    if (d.showTax && d.taxAmount > 0) html += `<div class="receipt-row"><span>${t(locale, "receiptTax")} (${d.taxRate}%)</span><span class="receipt-row-right">${cur} ${d.taxAmount.toFixed(2)}</span></div>`;
    html += `<div class="receipt-row receipt-bold receipt-large" style="margin-top:4px"><span>${t(locale, "receiptTotal")}</span><span class="receipt-row-right">${cur} ${d.total.toFixed(2)}</span></div>`;
    html += `<hr class="receipt-divider">`;
    html += `<div class="receipt-row"><span>${paymentLabel}</span><span class="receipt-row-right">${cur} ${d.paymentAmount.toFixed(2)}</span></div>`;

    if (d.paymentMethod === "cash" && d.cashReceived != null) {
      html += `<div class="receipt-row receipt-small"><span>${t(locale, "receiptCashReceived")}</span><span class="receipt-row-right">${cur} ${d.cashReceived.toFixed(2)}</span></div>`;
      if (d.changeGiven != null && d.changeGiven > 0) html += `<div class="receipt-row receipt-small"><span>${t(locale, "receiptChange")}</span><span class="receipt-row-right">${cur} ${d.changeGiven.toFixed(2)}</span></div>`;
    }

    html += `<hr class="receipt-double-divider">`;
    html += `<div class="receipt-center receipt-small">${d.receiptFooter || t(locale, "receiptThankYou")}</div>`;
    html += `<div style="height:16px"></div>`;

    return html;
  }, [locale]);

  const handlePrint = useCallback(async () => {
    setIsPrinting(true);
    try {
      // Cashier locale ("en"|"tc"|"sc"|"pt"|"ja") maps 1:1 to ReceiptLocale.
      //
      // Print fallback chain (Option A → Module 12 bridge → iframe):
      //   1. URL-scheme to "POS Print Receiver" iOS app on the same iPad,
      //      if `terminals.device_info.printer.method === 'url-scheme'`.
      //   2. Bridge daemon (Module 12) for terminals without the iOS app
      //      installed but with a shop-side bridge device.
      //   3. window.print() iframe — last-resort, always works.
      const terminalId =
        typeof window !== "undefined"
          ? window.localStorage.getItem("pos_terminal_id")
          : null;

      if (orderNumber && terminalId) {
        const urlScheme = await getReceiptBytesForUrlScheme(
          orderNumber,
          terminalId,
          locale,
        );
        if (urlScheme.ok) {
          // Fire-and-forget — Safari opens the iOS print app, app sends bytes
          // to printer, returns to Safari. No success/failure callback. Cashier
          // physically sees the receipt or presses reprint.
          // Read merchant accent color from CSS at fire time so the print
          // app's button matches the cashier's theme.
          const accent =
            typeof window !== "undefined"
              ? getComputedStyle(document.documentElement)
                  .getPropertyValue("--color-pos-accent")
                  .trim()
                  .replace(/^#/, "")
              : "";

          const params = new URLSearchParams({
            host: urlScheme.host,
            port: String(urlScheme.port),
            bytes: urlScheme.bytesBase64,
            // For the iOS app's status UI + return-to-cashier button:
            label: urlScheme.label,
            total: urlScheme.total,
            cashier: urlScheme.cashier,
            payment: urlScheme.paymentMethod,
            items: String(urlScheme.itemCount),
            return: window.location.href,
            // Cashier locale so the print app's UI speaks the same language.
            locale: locale,
            // Cashier accent color (e.g. "0071e3") so the button matches.
            accent: accent,
          });
          window.location.href = `pos-print://send?${params.toString()}`;
          setIsPrinting(false);
          return;
        }
        if (urlScheme.error !== "method_not_configured") {
          console.warn("[print-receipt] url-scheme path failed", urlScheme);
        }
      }

      if (orderNumber) {
        const net = await printReceiptToNetwork(orderNumber, locale);
        if (net.ok) {
          setIsPrinting(false);
          return;
        }
        console.warn("[print-receipt] bridge print failed, falling back", net);
      }

      let printData = data;
      if (!printData && orderNumber) {
        printData = await getReceiptData(orderNumber);
        if (printData) setData(printData);
      }
      if (printData) {
        const html = buildReceiptHtml(printData);
        printViaIframe(html);
      } else {
        setIsPrinting(false);
      }
    } catch {
      setIsPrinting(false);
    }
  }, [data, orderNumber, buildReceiptHtml, printViaIframe]);

  return <>{children({ onPrint: handlePrint, isPrinting })}</>;
}
