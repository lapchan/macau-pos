"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { closeShift, getShiftSummary } from "@/lib/shift-actions";
import { AlertTriangle, Check } from "lucide-react";
import { type Locale, t } from "@/i18n/locales";

type Props = {
  shiftId: string;
  onClose: () => void;
  onShiftClosed: () => void;
  locale?: Locale;
};

export default function ShiftCloseModal({ shiftId, onClose, onShiftClosed, locale = "en" }: Props) {
  const router = useRouter();
  const [actualCash, setActualCash] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedCash, setExpectedCash] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const actualNum = parseFloat(actualCash) || 0;
  const variance = actualNum - expectedCash;
  const withinTolerance = Math.abs(variance) <= 5;

  useEffect(() => {
    getShiftSummary(shiftId).then((s) => {
      if (s) setExpectedCash(s.expectedCash);
    });
  }, [shiftId]);

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
            {t(locale, "shiftVariance")}: MOP {variance >= 0 ? "+" : ""}{variance.toFixed(2)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-[18px] font-semibold text-[#1d1d1f]">{t(locale, "shiftEnd")}</h2>
          <p className="text-[13px] text-[#86868b] mt-0.5">{t(locale, "shiftEndSub")}</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="text-[12px] text-[#ff3b30] bg-[#ff3b30]/8 px-3 py-2 rounded-xl">{error}</div>
          )}

          {/* Expected cash */}
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
            <span className="text-[13px] text-gray-500">{t(locale, "shiftExpectedCash")}</span>
            <span className="text-[16px] font-semibold text-[#1d1d1f] tabular-nums">MOP {expectedCash.toFixed(2)}</span>
          </div>

          {/* Actual cash input */}
          <div>
            <label className="block text-[13px] font-medium text-[#1d1d1f] mb-2">{t(locale, "shiftActualCash")}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-gray-400">MOP</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0.00"
                className="w-full h-[48px] pl-14 pr-4 text-[18px] font-semibold bg-white border border-gray-200 rounded-xl text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 tabular-nums"
              />
            </div>
          </div>

          {/* Variance display */}
          {actualCash && (
            <div className={`flex items-center gap-2 py-3 px-4 rounded-xl ${withinTolerance ? "bg-emerald-50" : "bg-amber-50"}`}>
              {withinTolerance ? (
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-[13px] font-medium ${withinTolerance ? "text-emerald-700" : "text-amber-700"}`}>
                  {t(locale, "shiftVariance")}: MOP {variance >= 0 ? "+" : ""}{variance.toFixed(2)}
                </p>
                <p className={`text-[11px] ${withinTolerance ? "text-emerald-600" : "text-amber-600"}`}>
                  {withinTolerance ? t(locale, "shiftWithinTolerance") : t(locale, "shiftOverTolerance")}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[13px] font-medium text-[#1d1d1f] mb-1.5">{t(locale, "shiftNotes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t(locale, "shiftNotesPlaceholder")}
              rows={2}
              className="w-full px-3 py-2 text-[13px] bg-white border border-gray-200 rounded-xl text-[#1d1d1f] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 h-[44px] rounded-xl border border-gray-200 text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t(locale, "cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !actualCash}
            className="flex-1 h-[44px] rounded-xl text-[14px] font-medium text-white transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: "var(--color-pos-accent, #0071e3)" }}
          >
            {isPending ? t(locale, "shiftClosing") : t(locale, "shiftCloseBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
