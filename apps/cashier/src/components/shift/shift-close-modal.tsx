"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { closeShift, getShiftSummary } from "@/lib/shift-actions";
import { AlertTriangle, Check, Clock, CreditCard, Delete, DollarSign, ShoppingBag, StickyNote } from "lucide-react";
import CloseButton from "@/components/shared/close-button";
import { type Locale, t } from "@/i18n/locales";
import { PAYMENT_METHOD_KEYS } from "@/lib/constants";
import { cn } from "@/lib/cn";

type ShiftSummaryData = Awaited<ReturnType<typeof getShiftSummary>>;

type Props = {
  shiftId: string;
  onClose: () => void;
  onShiftClosed: () => void;
  locale?: Locale;
  userName?: string | null;
  userAvatar?: string | null;
  currency?: string;
};

export default function ShiftCloseModal({ shiftId, onClose, onShiftClosed, locale = "en", userName, userAvatar, currency = "MOP" }: Props) {
  const router = useRouter();
  const [cashCents, setCashCents] = useState("0");
  const [notes, setNotes] = useState("");
  const [showNoteSpotlight, setShowNoteSpotlight] = useState(false);
  const [summary, setSummary] = useState<ShiftSummaryData>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [closing, setClosing] = useState(false);

  const expectedCash = summary?.expectedCash ?? 0;
  const actualNum = parseInt(cashCents, 10) / 100;
  const cashDisplay = actualNum.toFixed(2);
  const variance = actualNum - expectedCash;
  const withinTolerance = Math.abs(variance) <= 5;
  const hasAmount = cashCents !== "0";

  useEffect(() => {
    getShiftSummary(shiftId).then(setSummary);
  }, [shiftId]);

  // Shift duration
  const elapsed = summary ? Math.floor((Date.now() - new Date(summary.openedAt).getTime()) / 1000) : 0;
  const hours = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  function handleDigit(n: string) {
    setCashCents(prev => {
      if (prev === "0") return n;
      if (prev.length >= 8) return prev;
      return prev + n;
    });
  }

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => onClose(), 350);
  }, [onClose]);

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      const result = await closeShift(shiftId, actualNum, notes || undefined);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onShiftClosed();
          router.refresh();
        }, 1500);
      } else {
        setError(result.error || "Failed to close shift");
      }
    });
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-xl">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-[18px] font-semibold text-[#1d1d1f]">{t(locale, "shiftClosed")}</h2>
          <p className="text-[13px] text-[#86868b] mt-1">
            {t(locale, "shiftVariance")}: {currency} {variance >= 0 ? "+" : ""}{variance.toFixed(2)}
            {expectedCash > 0 && ` (${((variance / expectedCash) * 100).toFixed(1)}%)`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          closing && "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Bottom-up sheet */}
      <div
        className={cn(
          "relative w-full h-full bg-pos-bg shadow-2xl flex flex-col overflow-hidden",
          closing ? "animate-sheet-down" : "animate-sheet-up"
        )}
      >
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-5 shrink-0 border-b border-pos-border">
          <h2 className="text-[16px] font-semibold text-pos-text">{t(locale, "shiftEnd")}</h2>
          <CloseButton onClick={handleClose} />
        </header>

        {/* Two-column (landscape) / stacked (portrait) content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left — Shift Summary */}
          <div className="flex-1 flex items-center justify-center overflow-y-auto border-r border-pos-border">
            <div className="w-full max-w-[460px] mx-auto px-6 py-6 space-y-4">
              {!summary ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 border-2 border-pos-accent/30 border-t-pos-accent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* User profile — lock screen style */}
                  {userName && (
                    <div className="flex flex-col items-center py-2">
                      {userAvatar ? (
                        <img src={userAvatar} alt={userName} className="h-[64px] w-[64px] rounded-full object-cover shadow-lg bg-[#f5f5f7]" />
                      ) : (
                        <div className="h-[64px] w-[64px] rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: "var(--color-pos-accent, #0071e3)" }}>
                          <span className="text-white text-[24px] font-semibold">{userName.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <p className="text-[15px] font-medium text-[#1d1d1f] mt-3">{userName}</p>
                      <p className="text-[12px] text-[#86868b] mt-0.5">{t(locale, "shiftSummary")}</p>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="flex items-center gap-3 py-3 px-4 bg-gray-50 rounded-xl">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider">{t(locale, "shiftDuration")}</p>
                      <p className="text-[15px] font-semibold text-[#1d1d1f]">{durationStr}</p>
                    </div>
                  </div>

                  {/* Orders + Sales */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="py-3 px-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider">{t(locale, "shiftOrders")}</p>
                      </div>
                      <p className="text-[20px] font-semibold text-[#1d1d1f] tabular-nums">{summary.liveOrders}</p>
                    </div>
                    <div className="py-3 px-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider">{t(locale, "shiftSales")}</p>
                      </div>
                      <p className="text-[20px] font-semibold text-[#1d1d1f] tabular-nums">{currency} {summary.liveSales.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Payment breakdown */}
                  {Object.keys(summary.paymentBreakdown).length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <CreditCard className="h-3.5 w-3.5 text-gray-400" />
                        <p className="text-[11px] text-gray-500 uppercase tracking-wider">{t(locale, "shiftPaymentBreakdown")}</p>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(summary.paymentBreakdown).map(([method, total]) => (
                          <div key={method} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-xl">
                            <span className="text-[13px] text-gray-700">{PAYMENT_METHOD_KEYS[method] ? t(locale, PAYMENT_METHOD_KEYS[method] as any) : method}</span>
                            <span className="text-[13px] font-semibold text-[#1d1d1f] tabular-nums">{currency} {(total as number).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expected cash highlight */}
                  <div className="py-3 px-4 bg-blue-50 rounded-xl">
                    <p className="text-[11px] text-blue-600 uppercase tracking-wider mb-1">{t(locale, "shiftExpectedCash")}</p>
                    <p className="text-[18px] font-bold text-blue-700 tabular-nums">{currency} {summary.expectedCash.toFixed(2)}</p>
                    <p className="text-[11px] text-blue-500 mt-0.5">
                      {`Float ${currency} `}{parseFloat(summary.openingFloat).toFixed(2)}{` + Cash ${currency} `}{summary.cashTotal.toFixed(2)}
                    </p>
                  </div>

                </>
              )}
            </div>
          </div>

          {/* Right — Cash Counting */}
          <div className="flex-1 flex items-center justify-center overflow-y-auto">
            <div className="w-full max-w-[400px] px-6 py-6 space-y-4">
              {error && (
                <div className="text-[12px] text-[#ff3b30] bg-[#ff3b30]/8 px-3 py-2 rounded-xl">{error}</div>
              )}

              {/* Variance display — always rendered, opacity toggle to prevent layout shift */}
              <div className={cn(
                "flex items-center gap-2 py-3 px-4 rounded-xl transition-opacity duration-200",
                hasAmount ? "opacity-100" : "opacity-0",
                withinTolerance ? "bg-emerald-50" : "bg-amber-50"
              )}>
                {withinTolerance ? (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                )}
                <div className="flex-1">
                  <p className={cn("text-[13px] font-medium", withinTolerance ? "text-emerald-700" : "text-amber-700")}>
                    {t(locale, "shiftVariance")}: {currency} {variance >= 0 ? "+" : ""}{variance.toFixed(2)}
                    {expectedCash > 0 && <span className="ml-1">({((variance / expectedCash) * 100).toFixed(1)}%)</span>}
                  </p>
                  <p className={cn("text-[11px]", withinTolerance ? "text-emerald-600" : "text-amber-600")}>
                    {withinTolerance ? t(locale, "shiftWithinTolerance").replace("{currency}", currency) : t(locale, "shiftOverTolerance")}
                  </p>
                </div>
              </div>

              {/* Cash display (read-only) */}
              <div>
                <label className="block text-[13px] font-medium text-pos-text mb-1.5">{t(locale, "shiftActualCash")}</label>
                <div className="flex items-baseline gap-2 px-4 py-3 bg-white border border-pos-border rounded-xl">
                  <span className="text-[14px] text-pos-text-muted">{currency}</span>
                  <span className="text-[28px] font-bold tabular-nums text-pos-text">{cashDisplay}</span>
                </div>
              </div>

              {/* Numpad — cents-based */}
              <div className="grid grid-cols-3 gap-2">
                {["1","2","3","4","5","6","7","8","9"].map(n => (
                  <button
                    key={n}
                    onClick={() => handleDigit(n)}
                    className="h-14 rounded-[var(--radius-md)] bg-pos-bg text-[24px] font-medium text-pos-text transition-all active:scale-[0.97] hover:bg-pos-surface-hover"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setCashCents("0")}
                  className="h-14 rounded-[var(--radius-md)] bg-pos-bg text-[19px] font-semibold text-pos-text-muted transition-all active:scale-[0.97] hover:bg-pos-surface-hover"
                >
                  C
                </button>
                <button
                  onClick={() => handleDigit("0")}
                  className="h-14 rounded-[var(--radius-md)] bg-pos-bg text-[24px] font-medium text-pos-text transition-all active:scale-[0.97] hover:bg-pos-surface-hover"
                >
                  0
                </button>
                <button
                  onClick={() => setCashCents(prev => {
                    const next = prev.slice(0, -1);
                    return next === "" ? "0" : next;
                  })}
                  className="h-14 rounded-[var(--radius-md)] bg-pos-bg text-pos-text-muted transition-all active:scale-[0.97] hover:bg-pos-surface-hover flex items-center justify-center"
                >
                  <Delete className="h-5 w-5" />
                </button>
              </div>

              {/* Note */}
              <button
                onClick={() => setShowNoteSpotlight(true)}
                className={cn(
                  "w-full flex items-center gap-2 px-4 rounded-[var(--radius-md)] transition-colors text-left",
                  notes
                    ? "py-3 bg-blue-50 hover:bg-blue-100"
                    : "py-3 hover:bg-pos-surface-hover"
                )}
              >
                <StickyNote className={cn("h-4 w-4 shrink-0 self-start mt-0.5", notes ? "text-blue-500" : "text-pos-text-muted")} />
                {notes ? (
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-blue-600 uppercase tracking-wider">{t(locale, "shiftNotes")}</p>
                    <p className="text-[13px] text-blue-800 line-clamp-2">{notes}</p>
                  </div>
                ) : (
                  <span className="text-[13px] text-pos-text-muted">+ {t(locale, "shiftNotes")}</span>
                )}
              </button>

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleClose}
                  disabled={isPending}
                  className="flex-1 h-[48px] rounded-[var(--radius-md)] border border-pos-border text-[14px] font-medium text-pos-text-secondary hover:bg-pos-surface-hover transition-colors disabled:opacity-50"
                >
                  {t(locale, "cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending || !hasAmount}
                  className="flex-1 h-[48px] rounded-[var(--radius-md)] text-[14px] font-medium text-white transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-pos-accent, #0071e3)" }}
                >
                  {isPending ? t(locale, "shiftClosing") : t(locale, "shiftCloseBtn")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Note spotlight overlay */}
      {showNoteSpotlight && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40 animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setShowNoteSpotlight(false)}
          />
          <div className="fixed inset-x-0 top-0 z-[60] flex justify-center pt-[8vh] px-4 animate-[spotlightOpen_0.25s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="w-full max-w-xl bg-pos-surface rounded-2xl shadow-2xl overflow-hidden relative">
              {/* Close button */}
              <CloseButton onClick={() => setShowNoteSpotlight(false)} className="absolute top-3 right-3 z-10" label={t(locale, "cancel")} />

              <div className="p-5">
                <p className="text-[15px] font-semibold text-pos-text mb-3">{t(locale, "shiftNotes")}</p>
                <textarea
                  autoFocus
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t(locale, "shiftNotesPlaceholder")}
                  rows={3}
                  className="w-full px-3 py-3 text-[14px] text-pos-text bg-pos-bg border border-pos-border rounded-[var(--radius-md)] outline-none focus:border-pos-accent transition-colors resize-none"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => { setNotes(""); setShowNoteSpotlight(false); }}
                    className="h-10 px-4 text-[13px] text-pos-text-secondary rounded-[var(--radius-md)] hover:bg-pos-surface-hover transition-colors"
                  >
                    {t(locale, "clear")}
                  </button>
                  <button
                    onClick={() => setShowNoteSpotlight(false)}
                    className="h-10 px-4 text-[13px] font-medium text-white rounded-[var(--radius-md)] transition-colors"
                    style={{ backgroundColor: "var(--color-pos-accent)" }}
                  >
                    {t(locale, "confirm")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
