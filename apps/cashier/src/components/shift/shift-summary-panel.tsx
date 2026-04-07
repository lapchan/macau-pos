"use client";

import { useState, useEffect } from "react";
import { getShiftSummary } from "@/lib/shift-actions";
import { Clock, ShoppingBag, DollarSign, CreditCard, X } from "lucide-react";
import { type Locale, t } from "@/i18n/locales";
import { PAYMENT_METHOD_KEYS } from "@/lib/constants";

type Props = {
  shiftId: string;
  onClose: () => void;
  onEndShift: () => void;
  locale?: Locale;
  embedded?: boolean;
  currency?: string;
};

export default function ShiftSummaryPanel({ shiftId, onClose, onEndShift, locale = "en", embedded = false, currency = "MOP" }: Props) {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getShiftSummary>>>(null);

  useEffect(() => {
    getShiftSummary(shiftId).then(setSummary);
  }, [shiftId]);

  if (!summary) {
    if (embedded) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-2 border-pos-accent/30 border-t-pos-accent rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const elapsed = Math.floor((Date.now() - new Date(summary.openedAt).getTime()) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const content = (
    <div className="space-y-4">
      <div className="flex items-center gap-3 py-3 px-4 bg-gray-50 rounded-xl">
        <Clock className="h-5 w-5 text-gray-400" />
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wider">{t(locale, "shiftDuration")}</p>
          <p className="text-[15px] font-semibold text-[#1d1d1f]">{durationStr}</p>
        </div>
      </div>
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
      <div className="py-3 px-4 bg-blue-50 rounded-xl">
        <p className="text-[11px] text-blue-600 uppercase tracking-wider mb-1">{t(locale, "shiftExpectedCash")}</p>
        <p className="text-[18px] font-bold text-blue-700 tabular-nums">{currency} {summary.expectedCash.toFixed(2)}</p>
        <p className="text-[11px] text-blue-500 mt-0.5">
          {`Float ${currency} `}{parseFloat(summary.openingFloat).toFixed(2)}{` + Cash ${currency} `}{summary.cashTotal.toFixed(2)}
        </p>
      </div>
      <button onClick={onEndShift} className="w-full h-[44px] rounded-[var(--radius-md)] text-[14px] font-medium text-white transition-all active:scale-[0.98]" style={{ backgroundColor: "#ff3b30" }}>
        {t(locale, "shiftEndBtn")}
      </button>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-0 sm:mx-4 bg-pos-bg rounded-t-[var(--radius-xl)] sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-pos-bg px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between z-10">
          <h2 className="text-[17px] font-semibold text-[#1d1d1f]">{t(locale, "shiftSummary")}</h2>
          <button onClick={onClose} className="h-10 w-10 rounded-full bg-black/8 flex items-center justify-center text-pos-text-muted hover:bg-black/15 transition-colors">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {content}
        </div>
      </div>
    </div>
  );
}
