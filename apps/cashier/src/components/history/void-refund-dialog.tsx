"use client";

import { cn } from "@/lib/cn";
import { type Locale, t } from "@/i18n/locales";
import { Ban, RotateCcw, Banknote, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: "void" | "refund";
  orderNumber: string;
  total: string;
  paymentMethod: string | null;
  isProcessing: boolean;
  locale: Locale;
};

export default function VoidRefundDialog({
  open, onClose, onConfirm, action, orderNumber, total, paymentMethod, isProcessing, locale,
}: Props) {
  if (!open) return null;

  const isVoid = action === "void";
  const Icon = isVoid ? Ban : RotateCcw;
  const isCash = paymentMethod === "cash";

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={isProcessing ? undefined : onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[320px] bg-pos-surface border border-pos-border rounded-[var(--radius-lg)] shadow-xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center pt-6 pb-4 px-5">
          <div className={cn(
            "h-14 w-14 rounded-full flex items-center justify-center mb-4",
            isVoid ? "bg-gray-100" : "bg-amber-50"
          )}>
            <Icon className={cn("h-7 w-7", isVoid ? "text-gray-600" : "text-amber-500")} strokeWidth={1.75} />
          </div>
          <h3 className="text-[16px] font-semibold text-pos-text">
            {isVoid ? t(locale, "voidConfirmTitle") : t(locale, "refundConfirmTitle")}
          </h3>
          <p className="text-[13px] text-pos-text-muted mt-1 text-center">
            {orderNumber}
          </p>
        </div>

        {/* Refund amount */}
        <div className="mx-5 mb-4 rounded-[var(--radius-md)] border border-pos-border bg-pos-bg p-4 text-center">
          <p className="text-[12px] text-pos-text-muted mb-1">
            {isVoid ? t(locale, "voidConfirmBody") : t(locale, "refundConfirmBody")}
          </p>
          <p className="text-[28px] font-bold tabular-nums text-pos-danger">
            MOP {parseFloat(total).toFixed(2)}
          </p>
          {isCash && (
            <div className="flex items-center justify-center gap-1.5 mt-2 text-[13px] font-medium text-pos-danger">
              <Banknote className="h-4 w-4" />
              {t(locale, "cashRefundAmount")}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 h-11 rounded-[var(--radius-md)] text-[14px] font-medium text-pos-text-secondary border border-pos-border hover:bg-pos-surface-hover transition-colors disabled:opacity-50"
          >
            {t(locale, "cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex-1 h-11 rounded-[var(--radius-md)] text-[14px] font-semibold text-white bg-pos-danger hover:bg-pos-danger/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Icon className="h-4 w-4" />
                {t(locale, "confirm")}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
