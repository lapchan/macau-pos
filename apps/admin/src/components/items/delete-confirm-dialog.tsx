"use client";

import { useEffect, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName?: string;
  count?: number;
  isPending: boolean;
};

export default function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  productName,
  count,
  isPending,
}: Props) {
  // Escape to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !isPending) onClose();
    },
    [open, onClose, isPending]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const { locale } = useLocale();

  if (!open) return null;

  const title = count && count > 1
    ? interpolate(t(locale, "items.deleteTitleBulk"), { count })
    : t(locale, "items.deleteTitle");
  const description =
    count && count > 1
      ? interpolate(t(locale, "items.deleteDescBulk"), { count })
      : interpolate(t(locale, "items.deleteDesc"), { name: productName || "" });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 animate-[fadeIn_0.15s_ease-out]"
        onClick={isPending ? undefined : onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[380px] bg-surface rounded-[var(--radius-lg)] border border-border shadow-2xl animate-[scaleIn_0.2s_ease-out]">
          {/* Header */}
          <div className="flex items-start gap-3 p-5 pb-3">
            <div className="h-10 w-10 rounded-full bg-danger-light flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
              <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">
                {description}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              aria-label={t(locale, "common.close")}
              className="h-7 w-7 rounded-[var(--radius-sm)] flex items-center justify-center text-text-tertiary hover:bg-surface-hover transition-colors -mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 p-5 pt-3">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 h-10 rounded-[var(--radius-md)] border border-border text-[13px] font-medium text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              {t(locale, "common.cancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 h-10 rounded-[var(--radius-md)] bg-danger text-white text-[13px] font-medium hover:bg-danger/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t(locale, "common.delete")
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
