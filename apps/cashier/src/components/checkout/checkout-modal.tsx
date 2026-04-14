"use client";

import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/cn";
import { type CartItem } from "@/data/mock";
import { type Locale, t, getProductName } from "@/i18n/locales";
import {
  Wifi, WifiOff, CreditCard, Banknote, QrCode, Smartphone,
  Check, AlertCircle, Loader2, Printer, Mail, XCircle, Clock,
  ChevronLeft, Minus, Plus, Sun, Moon, Receipt, ScanLine,
} from "lucide-react";
import CloseButton from "@/components/shared/close-button";
import { createOrder, type OrderDiscount } from "@/lib/actions";
import {
  createMpmPayment,
  createCpmPayment,
  getMpmPaymentStatus,
  cancelMpmPayment,
} from "@/lib/intellipay-actions";
import { useBarcodeScanner } from "@/lib/use-barcode-scanner";
import { enqueueOrder } from "@/lib/offline-queue";
import PrintReceipt from "@/components/receipt/print-receipt";
import type { ReceiptData } from "@/lib/receipt-queries";

type CheckoutState =
  | "review"
  | "tap"
  | "insert"
  | "qr"
  | "cpqr"
  | "cash"
  | "processing"
  | "success"
  | "saved-offline"
  | "failed";

type Props = {
  cart: CartItem[];
  locale: Locale;
  onClose: () => void;
  onComplete: (orderNumber: string) => void;
  customerId?: string;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  taxRate?: number;
  total?: number;
  orderDiscount?: OrderDiscount;
  isOnline?: boolean;
  currency?: string;
};

const CASH_PRESETS = [10, 20, 50, 100, 200, 500];

export default function CheckoutModal({ cart, locale, onClose, onComplete, customerId, subtotal: subtotalProp, discountAmount = 0, taxAmount = 0, taxRate = 0, total: totalProp, orderDiscount, isOnline = true, currency = "MOP" }: Props) {
  const [state, setState] = useState<CheckoutState>("review");
  const [closing, setClosing] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pos-checkout-dark") === "true";
    }
    return false;
  });
  const [cashCents, setCashCents] = useState("0");
  const [orderNum, setOrderNum] = useState("");
  // Intellipay MPM state. Populated when the cashier picks the QR tile and
  // we successfully create an MPM payment.
  const [mpmQrDataUrl, setMpmQrDataUrl] = useState<string | null>(null);
  const [mpmPaymentId, setMpmPaymentId] = useState<string | null>(null);
  const [mpmError, setMpmError] = useState<string | null>(null);
  // CPM (scan customer wallet) state.
  const [cpqrScanning, setCpqrScanning] = useState(false);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onClose(), 350);
  }, [onClose]);

  const rawSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = subtotalProp ?? rawSubtotal;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = totalProp ?? subtotal;

  const cashValue = parseInt(cashCents, 10) / 100;
  const cashDisplay = (parseInt(cashCents, 10) / 100).toFixed(2);
  const changeDue = cashValue - total;

  const cartForAction = useCallback(() => cart.map((item) => {
    const isCustom = item.id.startsWith("custom_");
    const [productId, variantId] = isCustom ? [undefined, undefined] : item.id.split("__");
    const rawTotal = item.price * item.quantity;
    const itemDiscountAmt = item.discount
      ? item.discount.type === "percent"
        ? Math.round(rawTotal * item.discount.value / 100 * 100) / 100
        : Math.min(item.discount.value, rawTotal)
      : 0;
    const itemDiscountNote = item.discount
      ? item.discount.type === "percent" ? `${item.discount.value}%` : `${currency} ${item.discount.value}`
      : undefined;
    return {
      productId,
      variantId: variantId || undefined,
      variantName: variantId ? item.name : undefined,
      name: item.name,
      translations: item.translations || undefined,
      unitPrice: item.price,
      quantity: item.quantity,
      discountAmount: itemDiscountAmt || undefined,
      discountNote: itemDiscountNote,
    };
  }), [cart, currency]);

  const buildOrderInput = useCallback((method: "tap" | "insert" | "cash") => ({
    cart: cart.map((item) => {
      const isCustom = item.id.startsWith("custom_");
      const [productId, variantId] = isCustom ? [undefined, undefined] : item.id.split("__");
      const rawTotal = item.price * item.quantity;
      const itemDiscountAmt = item.discount
        ? item.discount.type === "percent"
          ? Math.round(rawTotal * item.discount.value / 100 * 100) / 100
          : Math.min(item.discount.value, rawTotal)
        : 0;
      const itemDiscountNote = item.discount
        ? item.discount.type === "percent" ? `${item.discount.value}%` : `${currency} ${item.discount.value}`
        : undefined;
      return {
        productId,
        variantId: variantId || undefined,
        variantName: variantId ? item.name : undefined,
        name: item.name,
        translations: item.translations || undefined,
        unitPrice: item.price,
        quantity: item.quantity,
        discountAmount: itemDiscountAmt || undefined,
        discountNote: itemDiscountNote,
      };
    }),
    paymentMethod: method,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    cashReceived: method === "cash" ? cashValue : undefined,
    changeGiven: method === "cash" && cashValue > total ? cashValue - total : undefined,
    customerId,
    discountMeta: orderDiscount,
  }), [cart, subtotal, discountAmount, taxAmount, total, cashValue, customerId, orderDiscount, currency]);

  const processPayment = useCallback(async (method: "tap" | "insert" | "cash") => {
    setState("processing");
    const orderInput = buildOrderInput(method);

    // Wrap in a promise to prevent Next.js dev overlay from catching the network error
    const result = await new Promise<{ success: true; orderNumber: string } | { success: false; error: string } | null>((resolve) => {
      createOrder(orderInput).then(resolve).catch(() => resolve(null));
    });

    if (result === null) {
      // Network failure — save locally
      const pending = enqueueOrder(orderInput);
      setOrderNum(pending.tempOrderNumber);
      setState("saved-offline");
    } else if (result.success) {
      setOrderNum(result.orderNumber);
      setState("success");
    } else {
      setState("failed");
    }
  }, [buildOrderInput]);

  const handleCashConfirm = useCallback(() => {
    if (cashValue >= total) processPayment("cash");
  }, [cashValue, total, processPayment]);

  // Start an Intellipay MPM payment: create the pending order + QR, then
  // poll the DB until the webhook flips the order to a terminal state.
  const startMpmPayment = useCallback(async () => {
    setMpmError(null);
    setMpmQrDataUrl(null);
    setMpmPaymentId(null);
    setState("qr");

    const result = await createMpmPayment({
      cart: cartForAction(),
      // simplepay = user picks the wallet in their own app at scan time
      paymentService: "simplepay",
      subtotal,
      discountAmount,
      taxAmount,
      total,
      customerId,
      discountMeta: orderDiscount,
    });

    if (!result.success) {
      setMpmError(result.error);
      setState("failed");
      return;
    }
    setMpmQrDataUrl(result.qrCodeDataUrl);
    setMpmPaymentId(result.paymentId);
    setOrderNum(result.orderNumber);
  }, [cartForAction, subtotal, discountAmount, taxAmount, total, customerId, orderDiscount]);

  // Poll the payment row every 2s while we're on the QR screen with an
  // active payment. Bail out when we reach a terminal order status.
  useEffect(() => {
    if (state !== "qr" || !mpmPaymentId) return;

    let cancelled = false;
    const tick = async () => {
      const res = await getMpmPaymentStatus(mpmPaymentId);
      if (cancelled) return;
      if (!res.success) return;
      if (res.data.orderStatus === "completed") {
        setState("success");
      } else if (
        res.data.orderStatus === "voided" ||
        res.data.orderStatus === "refunded"
      ) {
        setMpmError(res.data.intellipayStatusDesc || "Payment did not complete.");
        setState("failed");
      }
    };
    tick();
    const interval = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [state, mpmPaymentId]);

  const handleMpmCancel = useCallback(async () => {
    if (!mpmPaymentId) {
      setState("review");
      return;
    }
    await cancelMpmPayment(mpmPaymentId);
    setMpmPaymentId(null);
    setMpmQrDataUrl(null);
    setState("review");
  }, [mpmPaymentId]);

  // CPM: customer shows wallet QR, cashier scans with POS barcode scanner.
  // On scan we call Intellipay synchronously. Status 2 = paid (go to success);
  // anything else pending = reuse the existing MPM poller by stashing the
  // payment id and transitioning to "qr" state.
  const handleCpmScan = useCallback(async (authCode: string) => {
    if (cpqrScanning) return;
    setCpqrScanning(true);
    setMpmError(null);
    setState("processing");

    const result = await createCpmPayment({
      cart: cartForAction(),
      authCode,
      paymentService: "simplepay",
      subtotal,
      discountAmount,
      taxAmount,
      total,
      customerId,
      discountMeta: orderDiscount,
    });

    setCpqrScanning(false);

    if (!result.success) {
      setMpmError(result.error);
      setState("failed");
      return;
    }

    setOrderNum(result.orderNumber);
    if (result.immediate) {
      setState("success");
      return;
    }
    // Pending — fall back to the MPM poller (same DB row shape).
    setMpmPaymentId(result.paymentId);
    setMpmQrDataUrl(null);
    setState("qr");
  }, [cpqrScanning, cartForAction, subtotal, discountAmount, taxAmount, total, customerId, orderDiscount]);

  useBarcodeScanner({
    enabled: state === "cpqr" && !cpqrScanning,
    onScan: handleCpmScan,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (state === "review") handleClose();
        else if (state === "qr") handleMpmCancel();
        else if (!["processing", "success", "saved-offline"].includes(state)) setState("review");
      }

      // F1-F5: payment method shortcuts (only in review state)
      if (state === "review") {
        if (e.key === "F1") { e.preventDefault(); setState("tap"); }
        else if (e.key === "F2") { e.preventDefault(); setState("insert"); }
        else if (e.key === "F3") { e.preventDefault(); startMpmPayment(); }
        else if (e.key === "F4") { e.preventDefault(); setState("cash"); }
        else if (e.key === "F5") { e.preventDefault(); setState("cpqr"); }
      }

      // Enter: confirm cash payment
      if (state === "cash" && e.key === "Enter" && cashValue >= total) {
        e.preventDefault();
        handleCashConfirm();
      }

      // Enter on tap/insert: process immediately (qr is driven by webhook poll)
      if (["tap", "insert"].includes(state) && e.key === "Enter") {
        e.preventDefault();
        processPayment(state as "tap" | "insert");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state, handleClose, cashValue, total, handleCashConfirm, processPayment, startMpmPayment, handleMpmCancel]);

  const handleDone = useCallback(() => {
    onComplete(orderNum);
  }, [onComplete, orderNum]);

  const bg = darkMode ? "bg-[#0a0a0c]" : "bg-pos-bg";
  const surface = darkMode ? "bg-[#18181b]" : "bg-white";
  const surfaceAlt = darkMode ? "bg-[#1f1f23]" : "bg-pos-surface-hover";
  const text = darkMode ? "text-white" : "text-pos-text";
  const textSec = darkMode ? "text-zinc-400" : "text-pos-text-secondary";
  const textMuted = darkMode ? "text-zinc-600" : "text-pos-text-muted";
  const border = darkMode ? "border-zinc-800" : "border-pos-border";
  const borderStrong = darkMode ? "border-zinc-700" : "border-pos-border-strong";

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          darkMode ? "bg-black/95" : "bg-black/40 backdrop-blur-sm",
          closing && "opacity-0"
        )}
        onClick={state === "review" ? handleClose : undefined}
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          "relative w-full h-full shadow-2xl flex flex-col overflow-hidden",
          closing ? "animate-sheet-down" : "animate-sheet-up",
          bg
        )}
      >
        {/* ===== HEADER ===== */}
        <header className={cn("h-14 flex items-center justify-between px-5 shrink-0 border-b", border)}>
          <div className="flex items-center gap-3">
            {state !== "review" && !["processing", "success"].includes(state) && (
              <button
                onClick={() => setState("review")}
                className={cn("h-8 w-8 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors", textSec, darkMode ? "hover:bg-zinc-800" : "hover:bg-pos-surface-active")}
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className={cn("text-[16px] font-semibold", text)}>
              {state === "success" ? t(locale, "paymentSuccess") : t(locale, "checkout")}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={() => { const next = !darkMode; setDarkMode(next); localStorage.setItem("pos-checkout-dark", String(next)); }}
              className={cn("h-8 w-8 flex items-center justify-center rounded-[var(--radius-sm)] transition-colors", textSec, darkMode ? "hover:bg-zinc-800" : "hover:bg-pos-surface-active")}
              aria-label={t(locale, "terminalMode")}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Close */}
            {!["processing", "success", "saved-offline"].includes(state) && (
              <CloseButton onClick={handleClose} dark={darkMode} label={t(locale, "cancel")} />
            )}
          </div>
        </header>

        {/* ===== BODY ===== */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Order Summary (always visible except in terminal states) */}
          {!["processing", "success", "saved-offline", "failed"].includes(state) && (
            <div className={cn("w-[340px] flex flex-col border-r shrink-0", border)}>
              {/* Items header */}
              <div className={cn("px-5 py-3 flex items-center justify-between border-b", border)}>
                <span className={cn("text-[13px] font-medium", textSec)}>
                  {t(locale, "orderSummary")} · {itemCount} {t(locale, "itemCount")}
                </span>
              </div>

              {/* Items list */}
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {cart.map((item) => {
                  const rawTotal = item.price * item.quantity;
                  const hasItemDiscount = !!item.discount;
                  const itemDiscountAmt = hasItemDiscount
                    ? item.discount!.type === "percent"
                      ? Math.round(rawTotal * item.discount!.value / 100 * 100) / 100
                      : Math.min(item.discount!.value, rawTotal)
                    : 0;
                  const lineTotal = rawTotal - itemDiscountAmt;
                  return (
                    <div key={item.id} className={cn("flex items-center gap-3 py-2.5 border-b last:border-0", border)}>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[14px] font-medium truncate", text)}>
                          {getProductName(item, locale)}
                        </p>
                        <p className={cn("text-[12px]", textMuted)}>
                          {currency} {item.price.toFixed(1)} × {item.quantity}
                        </p>
                        {hasItemDiscount && (
                          <p className="text-[11px] text-red-500">
                            {item.discount!.type === "percent" ? `${item.discount!.value}%` : `${currency} ${item.discount!.value}`} {t(locale, "discount")} (-{currency} {itemDiscountAmt.toFixed(1)})
                          </p>
                        )}
                      </div>
                      <span className={cn("text-[14px] font-semibold tabular-nums shrink-0", hasItemDiscount ? "text-red-500" : text)}>
                        ${lineTotal.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className={cn("px-5 py-4 border-t space-y-2", border)}>
                <div className="flex justify-between text-[13px]">
                  <span className={textSec}>{t(locale, "subtotal")}</span>
                  <span className={cn("tabular-nums", text)}>{currency} {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-red-500">
                      {t(locale, "discount")} {orderDiscount?.type === "percent" ? `(${orderDiscount.value}%)` : ""}
                    </span>
                    <span className="text-red-500 tabular-nums">-{currency} {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className={textSec}>{t(locale, "tax")} ({taxRate}%)</span>
                    <span className={cn("tabular-nums", text)}>{currency} {taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className={cn("h-px", darkMode ? "bg-zinc-800" : "bg-pos-border")} />
                <div className="flex justify-between items-baseline">
                  <span className={cn("text-[15px] font-semibold", text)}>{t(locale, "total")}</span>
                  <span className={cn("text-[28px] font-bold tabular-nums")} style={{ color: "var(--color-pos-accent)" }}>
                    {currency} {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: Payment Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            {/* REVIEW STATE — Payment method selection */}
            {state === "review" && (
              <div className="w-full max-w-[460px] animate-fade-in">
                <p className={cn("text-[15px] font-medium mb-5 text-center", textSec)}>
                  {t(locale, "selectPayment")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "tap" as const, icon: Smartphone, label: t(locale, "tapCard"), sub: t(locale, "paymentSubTap"), fKey: "F1", span: false },
                    { key: "insert" as const, icon: CreditCard, label: t(locale, "insertCard"), sub: t(locale, "paymentSubInsert"), fKey: "F2", span: false },
                    { key: "qr" as const, icon: QrCode, label: t(locale, "scanQr"), sub: t(locale, "paymentSubQr"), fKey: "F3", span: false },
                    { key: "cash" as const, icon: Banknote, label: t(locale, "cash"), sub: "MOP", fKey: "F4", span: false },
                    { key: "cpqr" as const, icon: ScanLine, label: t(locale, "scanWallet"), sub: t(locale, "paymentSubScanWallet"), fKey: "F5", span: true },
                  ].map((method) => (
                    <button
                      key={method.key}
                      onClick={() => {
                        if (method.key === "cash") setState("cash");
                        else if (method.key === "qr") startMpmPayment();
                        else if (method.key === "cpqr") setState("cpqr");
                        else if (method.key === "tap") setState("tap");
                        else if (method.key === "insert") setState("insert");
                      }}
                      className={cn(
                        "relative flex flex-col items-center gap-3 py-7 rounded-[var(--radius-lg)] border-2 transition-all active:scale-[0.97]",
                        method.span && "col-span-2",
                        border,
                        surface,
                        darkMode ? "hover:border-zinc-600 hover:bg-zinc-800/50" : "hover:border-pos-accent/30 hover:shadow-md"
                      )}
                    >
                      <div
                        className="h-14 w-14 rounded-[var(--radius-md)] flex items-center justify-center"
                        style={{ backgroundColor: "var(--color-pos-accent-light)" }}
                      >
                        <method.icon className="h-6 w-6" style={{ color: "var(--color-pos-accent)" }} strokeWidth={1.75} />
                      </div>
                      <div className="text-center">
                        <p className={cn("text-[15px] font-semibold", text)}>{method.label}</p>
                        <p className={cn("text-[12px] mt-0.5", textMuted)}>{method.sub}</p>
                      </div>
                      <span className={cn("absolute top-2 right-2.5 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded", darkMode ? "bg-zinc-800 text-zinc-500" : "bg-black/5 text-pos-text-muted")}>
                        {method.fKey}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAP STATE */}
            {state === "tap" && (
              <div className="flex flex-col items-center text-center animate-scale-in">
                <div className="relative mb-6">
                  <div
                    className="h-28 w-28 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-pos-accent-light)" }}
                  >
                    <Smartphone className="h-12 w-12" style={{ color: "var(--color-pos-accent)" }} strokeWidth={1.5} />
                  </div>
                  {/* Pulse ring */}
                  <div
                    className="absolute inset-0 rounded-full border-2 animate-ping opacity-30"
                    style={{ borderColor: "var(--color-pos-accent)" }}
                  />
                </div>
                <p className={cn("text-[28px] font-bold tabular-nums mb-2")} style={{ color: "var(--color-pos-accent)" }}>
                  {currency} {total.toFixed(2)}
                </p>
                <p className={cn("text-[18px] font-semibold mb-1", text)}>{t(locale, "readyToTap")}</p>
                <p className={cn("text-[14px]", textSec)}>{t(locale, "presentCard")}</p>
                <button
                  onClick={() => processPayment("tap")}
                  className={cn("mt-8 h-12 px-8 rounded-[var(--radius-md)] text-[15px] font-semibold text-white transition-all hover:shadow-lg active:scale-[0.97]")}
                  style={{ backgroundColor: "var(--color-pos-accent)" }}
                >
                  {t(locale, "processing").replace("...", "")}
                </button>
              </div>
            )}

            {/* INSERT STATE */}
            {state === "insert" && (
              <div className="flex flex-col items-center text-center animate-scale-in">
                <div className="relative mb-6">
                  <div
                    className="h-28 w-28 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-pos-accent-light)" }}
                  >
                    <CreditCard className="h-12 w-12" style={{ color: "var(--color-pos-accent)" }} strokeWidth={1.5} />
                  </div>
                </div>
                <p className={cn("text-[28px] font-bold tabular-nums mb-2")} style={{ color: "var(--color-pos-accent)" }}>
                  {currency} {total.toFixed(2)}
                </p>
                <p className={cn("text-[18px] font-semibold mb-1", text)}>{t(locale, "insertCard")}</p>
                <p className={cn("text-[14px]", textSec)}>{t(locale, "waitingForCard")}</p>
                <button
                  onClick={() => processPayment("insert")}
                  className={cn("mt-8 h-12 px-8 rounded-[var(--radius-md)] text-[15px] font-semibold text-white transition-all hover:shadow-lg active:scale-[0.97]")}
                  style={{ backgroundColor: "var(--color-pos-accent)" }}
                >
                  {t(locale, "processing").replace("...", "")}
                </button>
              </div>
            )}

            {/* QR STATE — Intellipay MPM */}
            {state === "qr" && (
              <div className="flex flex-col items-center text-center animate-scale-in">
                <div className={cn("h-56 w-56 rounded-[var(--radius-lg)] border-2 flex items-center justify-center mb-5 p-3", border, surface)}>
                  {mpmQrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mpmQrDataUrl}
                      alt="Payment QR code"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Loader2
                      className="h-10 w-10 animate-spin"
                      style={{ color: "var(--color-pos-accent)" }}
                      strokeWidth={1.5}
                    />
                  )}
                </div>
                <p className={cn("text-[28px] font-bold tabular-nums mb-2")} style={{ color: "var(--color-pos-accent)" }}>
                  {currency} {total.toFixed(2)}
                </p>
                <p className={cn("text-[15px] font-medium mb-1", text)}>
                  {mpmQrDataUrl ? t(locale, "scanToPay") : t(locale, "processing")}
                </p>
                <p className={cn("text-[13px]", textSec)}>{t(locale, "waitingForPayment")}</p>
                <button
                  onClick={handleMpmCancel}
                  className={cn("mt-6 h-11 px-6 rounded-[var(--radius-md)] text-[14px] font-semibold border transition-all active:scale-[0.97]", border, textSec, darkMode ? "hover:bg-zinc-800" : "hover:bg-pos-surface-active")}
                >
                  {t(locale, "cancel")}
                </button>
              </div>
            )}

            {/* CPM STATE — Consumer-Presented QR (cashier scans customer wallet) */}
            {state === "cpqr" && (
              <div className="flex flex-col items-center text-center animate-scale-in">
                <div className="relative mb-6">
                  <div
                    className="h-28 w-28 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-pos-accent-light)" }}
                  >
                    <ScanLine className="h-12 w-12" style={{ color: "var(--color-pos-accent)" }} strokeWidth={1.5} />
                  </div>
                  <div
                    className="absolute inset-0 rounded-full border-2 animate-ping opacity-30"
                    style={{ borderColor: "var(--color-pos-accent)" }}
                  />
                </div>
                <p className={cn("text-[28px] font-bold tabular-nums mb-2")} style={{ color: "var(--color-pos-accent)" }}>
                  {currency} {total.toFixed(2)}
                </p>
                <p className={cn("text-[18px] font-semibold mb-1", text)}>{t(locale, "scanWalletPrompt")}</p>
                <p className={cn("text-[14px]", textSec)}>{t(locale, "scanWalletHint")}</p>
              </div>
            )}

            {/* CASH STATE */}
            {state === "cash" && (
              <div className="w-full max-w-[380px] animate-scale-in flex flex-col h-full justify-center">
                {/* Top: Amount due + Change due */}
                <div className="flex flex-col items-center justify-center py-6">
                  {/* Amount due */}
                  <div className="text-center">
                    <p className={cn("text-[13px] font-medium mb-1", textSec)}>{t(locale, "amountDue")}</p>
                    <p className="text-[36px] font-bold tabular-nums" style={{ color: "var(--color-pos-accent)" }}>
                      {currency} {total.toFixed(2)}
                    </p>
                  </div>

                  {/* Change due — always renders to prevent layout shift */}
                  <div className={cn(
                    "rounded-[var(--radius-md)] px-8 py-3 mt-4 text-center transition-opacity duration-200",
                    cashValue > 0 && cashValue >= total
                      ? cn("opacity-100", darkMode ? "bg-emerald-950/40" : "bg-pos-success-light")
                      : "opacity-0"
                  )}>
                    <p className={cn("text-[12px] font-medium", textSec)}>{t(locale, "changeDue")}</p>
                    <p className="text-[28px] font-bold tabular-nums text-pos-success">
                      {currency} {changeDue > 0 ? changeDue.toFixed(2) : "0.00"}
                    </p>
                  </div>
                </div>

                {/* Bottom: Cash input + Keypad + Presets + Confirm (pinned) */}
                <div className="shrink-0">
                  {/* Cash received display */}
                  <div className={cn("rounded-[var(--radius-md)] border p-4 mb-4", border, surface)}>
                    <p className={cn("text-[12px] font-medium mb-2", textSec)}>{t(locale, "cashReceived")}</p>
                    <div className="flex items-baseline gap-2">
                      <span className={cn("text-[13px]", textMuted)}>{currency}</span>
                      <span className={cn("text-[28px] font-bold tabular-nums", text)}>{cashDisplay}</span>
                    </div>
                  </div>

                  {/* Number pad */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {["1","2","3","4","5","6","7","8","9"].map(n => (
                      <button
                        key={n}
                        onClick={() => setCashCents(prev => {
                          if (prev === "0") return n;
                          if (prev.length >= 8) return prev;
                          return prev + n;
                        })}
                        className={cn("h-14 rounded-[var(--radius-sm)] text-[24px] font-medium transition-all active:scale-[0.97]", surface, text, darkMode ? "hover:bg-zinc-800" : "hover:bg-pos-surface-active")}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setCashCents("0")}
                      className={cn("h-14 rounded-[var(--radius-sm)] text-[19px] font-semibold transition-all active:scale-[0.97]", surface, textMuted, darkMode ? "hover:bg-zinc-800" : "hover:bg-pos-surface-active")}
                    >
                      C
                    </button>
                    <button
                      onClick={() => setCashCents(prev => {
                        if (prev === "0") return "0";
                        if (prev.length >= 8) return prev;
                        return prev + "0";
                      })}
                      className={cn("h-14 rounded-[var(--radius-sm)] text-[24px] font-medium transition-all active:scale-[0.97]", surface, text, darkMode ? "hover:bg-zinc-800" : "hover:bg-pos-surface-active")}
                    >
                      0
                    </button>
                    <button
                      onClick={() => setCashCents(prev => {
                        const next = prev.slice(0, -1);
                        return next === "" ? "0" : next;
                      })}
                      className={cn("h-14 rounded-[var(--radius-sm)] text-[19px] font-medium transition-all active:scale-[0.97]", surface, textSec, darkMode ? "hover:bg-zinc-800" : "hover:bg-pos-surface-active")}
                    >
                      ⌫
                    </button>
                  </div>

                  {/* Preset amounts */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <button
                      onClick={() => setCashCents(String(Math.round(total * 100)))}
                      className={cn("h-11 rounded-[var(--radius-sm)] text-[13px] font-semibold border transition-all active:scale-[0.97]", border, surface, text, darkMode ? "hover:bg-zinc-800" : "hover:bg-pos-surface-active")}
                    >
                      {t(locale, "exactAmount")}
                    </button>
                    {CASH_PRESETS.filter((v) => v >= total).slice(0, 3).map((val) => (
                      <button
                        key={val}
                        onClick={() => setCashCents(String(val * 100))}
                        className={cn("h-11 rounded-[var(--radius-sm)] text-[13px] font-semibold border transition-all active:scale-[0.97]", border, surface, text, darkMode ? "hover:bg-zinc-800" : "hover:bg-pos-surface-active")}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>

                  {/* Confirm */}
                  <button
                    onClick={handleCashConfirm}
                    disabled={cashValue < total}
                    className={cn(
                      "w-full h-13 rounded-[var(--radius-md)] text-[16px] font-semibold transition-all mb-4",
                      cashValue >= total
                        ? "text-white hover:shadow-lg active:scale-[0.98]"
                        : cn("cursor-not-allowed", darkMode ? "bg-zinc-800 text-zinc-600" : "bg-pos-bg text-pos-text-muted border border-pos-border")
                    )}
                    style={cashValue >= total ? { backgroundColor: "var(--color-pos-accent)" } : undefined}
                  >
                    {t(locale, "confirmCash")}
                  </button>
                </div>
              </div>
            )}

            {/* PROCESSING STATE */}
            {state === "processing" && (
              <div className="flex flex-col items-center text-center animate-fade-in">
                <Loader2
                  className="h-16 w-16 animate-spin mb-5"
                  style={{ color: "var(--color-pos-accent)" }}
                  strokeWidth={1.5}
                />
                <p className={cn("text-[20px] font-semibold mb-1", text)}>{t(locale, "processing")}</p>
                <p className={cn("text-[32px] font-bold tabular-nums mt-2")} style={{ color: "var(--color-pos-accent)" }}>
                  {currency} {total.toFixed(2)}
                </p>
              </div>
            )}

            {/* SUCCESS STATE */}
            {state === "success" && (
              <div className="flex flex-col items-center text-center animate-scale-in">
                <div
                  className="h-20 w-20 rounded-full flex items-center justify-center mb-5"
                  style={{ backgroundColor: "var(--color-pos-success-light)" }}
                >
                  <Check className="h-10 w-10 text-pos-success" strokeWidth={2.5} />
                </div>
                <p className={cn("text-[24px] font-bold mb-1", text)}>{t(locale, "paymentSuccess")}</p>
                <p className={cn("text-[14px] mb-1", textSec)}>{t(locale, "orderNumber")} {orderNum}</p>
                <p className={cn("text-[32px] font-bold tabular-nums my-3")} style={{ color: "var(--color-pos-accent)" }}>
                  {currency} {total.toFixed(2)}
                </p>
                <p className={cn("text-[16px]", textSec)}>{t(locale, "thankYou")}</p>

                {/* Receipt options */}
                <div className="flex gap-2 mt-6">
                  {/* Print Receipt — functional */}
                  <PrintReceipt orderNumber={orderNum || undefined} locale={locale}>
                    {({ onPrint, isPrinting }) => (
                      <button
                        onClick={onPrint}
                        disabled={isPrinting}
                        className={cn(
                          "flex items-center gap-2 h-10 px-4 rounded-[var(--radius-sm)] text-[13px] font-medium border transition-all active:scale-[0.97]",
                          border, textSec,
                          darkMode ? "hover:bg-zinc-800" : "hover:bg-pos-surface-active",
                          isPrinting && "opacity-60"
                        )}
                      >
                        <Printer className="h-4 w-4" />
                        {isPrinting ? t(locale, "receiptPrinting") : t(locale, "printReceipt")}
                      </button>
                    )}
                  </PrintReceipt>

                  {/* Email Receipt — coming soon */}
                  <button
                    disabled
                    title={t(locale, "comingSoon")}
                    className={cn(
                      "flex items-center gap-2 h-10 px-4 rounded-[var(--radius-sm)] text-[13px] font-medium border opacity-50 cursor-not-allowed",
                      border, textSec,
                    )}
                  >
                    <Mail className="h-4 w-4" />
                    {t(locale, "emailReceipt")}
                  </button>

                  {/* No Receipt */}
                  <button
                    onClick={handleDone}
                    className={cn(
                      "flex items-center gap-2 h-10 px-4 rounded-[var(--radius-sm)] text-[13px] font-medium border transition-all active:scale-[0.97]",
                      border, textSec,
                      darkMode ? "hover:bg-zinc-800" : "hover:bg-pos-surface-active"
                    )}
                  >
                    <XCircle className="h-4 w-4" />
                    {t(locale, "noReceipt")}
                  </button>
                </div>

                {/* Done button */}
                <button
                  onClick={handleDone}
                  className="mt-5 h-13 px-10 rounded-[var(--radius-md)] text-[16px] font-semibold text-white transition-all hover:shadow-lg active:scale-[0.97]"
                  style={{ backgroundColor: "var(--color-pos-accent)" }}
                >
                  {t(locale, "done")}
                </button>
              </div>
            )}

            {/* SAVED OFFLINE STATE */}
            {state === "saved-offline" && (
              <div className="flex flex-col items-center text-center animate-scale-in">
                <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center mb-5">
                  <Clock className="h-10 w-10 text-amber-500" strokeWidth={2} />
                </div>
                <p className={cn("text-[24px] font-bold mb-1", text)}>{t(locale, "orderSavedOffline")}</p>
                <p className={cn("text-[14px] mb-1", textSec)}>{orderNum}</p>
                <p className={cn("text-[32px] font-bold tabular-nums my-3 text-amber-500")}>
                  {currency} {total.toFixed(2)}
                </p>
                <p className={cn("text-[14px]", textSec)}>{t(locale, "orderSavedOfflineHint")}</p>

                <button
                  onClick={handleDone}
                  className="mt-8 h-13 px-10 rounded-[var(--radius-md)] text-[16px] font-semibold text-white transition-all hover:shadow-lg active:scale-[0.97] bg-amber-500 hover:bg-amber-600"
                >
                  {t(locale, "done")}
                </button>
              </div>
            )}

            {/* FAILED STATE */}
            {state === "failed" && (
              <div className="flex flex-col items-center text-center animate-scale-in">
                <div className="h-20 w-20 rounded-full bg-pos-danger-light flex items-center justify-center mb-5">
                  <AlertCircle className="h-10 w-10 text-pos-danger" strokeWidth={2} />
                </div>
                <p className={cn("text-[24px] font-bold mb-1", text)}>{t(locale, "paymentFailed")}</p>
                <p className={cn("text-[14px] mb-6", textSec)}>
                  {mpmError || t(locale, "paymentFailedHint")}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setState("review")}
                    className="h-12 px-6 rounded-[var(--radius-md)] text-[15px] font-semibold text-white transition-all hover:shadow-lg active:scale-[0.97]"
                    style={{ backgroundColor: "var(--color-pos-accent)" }}
                  >
                    {t(locale, "tryAgain")}
                  </button>
                  <button
                    onClick={onClose}
                    className={cn("h-12 px-6 rounded-[var(--radius-md)] text-[15px] font-medium border transition-all active:scale-[0.97]", border, textSec, darkMode ? "hover:bg-zinc-800" : "hover:bg-pos-surface-active")}
                  >
                    {t(locale, "cancel")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Terminal status — bottom right */}
        <div className={cn(
          "absolute bottom-3 right-5 flex items-center gap-1.5 px-2.5 h-7 rounded-[var(--radius-full)] text-[11px] font-medium",
          isOnline
            ? cn(surfaceAlt, "text-pos-success")
            : cn("bg-red-50 text-red-500", darkMode && "bg-red-950/40")
        )}>
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span>{isOnline ? t(locale, "terminalConnected") : t(locale, "terminalOffline")}</span>
        </div>
      </div>
    </div>
  );
}
