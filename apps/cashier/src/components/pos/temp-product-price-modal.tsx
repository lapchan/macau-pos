"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Delete, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { type Locale, t } from "@/i18n/locales";
import CloseButton from "@/components/shared/close-button";

type Props = {
  open: boolean;
  productName: string;
  // E.g. "From GS1 Hong Kong"
  sourceLabel?: string;
  currency?: string;
  locale: Locale;
  onConfirm: (price: number) => void;
  onCancel: () => void;
};

export default function TempProductPriceModal({
  open,
  productName,
  sourceLabel,
  currency = "MOP",
  locale,
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState("0");

  // Reset price every time the modal opens with a new product
  useEffect(() => {
    if (open) setValue("0");
  }, [open, productName]);

  const handlePress = useCallback((key: string) => {
    setValue((prev) => {
      if (key === "C") return "0";
      if (key === "⌫") {
        const next = prev.slice(0, -1);
        return next === "" ? "0" : next;
      }
      if (prev === "0") return key;
      if (prev.length >= 8) return prev;
      return prev + key;
    });
  }, []);

  const displayPrice = useMemo(() => {
    const cents = parseInt(value, 10);
    return (cents / 100).toFixed(2);
  }, [value]);

  const handleConfirm = useCallback(() => {
    const cents = parseInt(value, 10);
    if (cents <= 0) return;
    onConfirm(cents / 100);
  }, [value, onConfirm]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/40 animate-[fadeIn_0.2s_ease-out]"
        onClick={onCancel}
      />
      <div className="fixed inset-x-0 top-0 z-[70] flex justify-center pt-[8vh] px-4 animate-[spotlightOpen_0.25s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="w-full max-w-xl bg-pos-surface rounded-2xl shadow-2xl overflow-hidden relative">
          <CloseButton
            onClick={onCancel}
            className="absolute top-3 right-3 z-10"
            label={t(locale, "cancel")}
          />

          <div className="px-6 pt-5 pb-2">
            {sourceLabel && (
              <div className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
                {sourceLabel}
              </div>
            )}
            <p className="text-[15px] font-semibold text-pos-text leading-snug pr-10">
              {productName}
            </p>
          </div>

          <div className="px-6 pt-3 pb-2">
            <div className="flex items-center justify-between">
              <p className="text-[56px] font-bold text-pos-text tracking-tight text-left tabular-nums leading-none">
                <span className="text-[34px] text-pos-text-muted mr-1">{currency}</span>
                {displayPrice}
              </p>
              <button
                onClick={() => handlePress("⌫")}
                className={cn(
                  "h-12 w-12 flex items-center justify-center rounded-full text-pos-text-muted hover:bg-pos-surface-hover active:scale-[0.95] transition-all",
                  parseInt(value, 10) === 0 && "invisible"
                )}
              >
                <Delete className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 px-6 pb-6">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((n) => (
              <button
                key={n}
                onClick={() => handlePress(n)}
                className="h-[78px] flex items-center justify-center text-[32px] font-medium text-pos-text rounded-[var(--radius-md)] bg-pos-bg hover:bg-pos-surface-hover active:scale-[0.97] transition-all"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => handlePress("C")}
              className="h-[78px] flex items-center justify-center text-[24px] font-semibold text-pos-text-muted rounded-[var(--radius-md)] bg-pos-bg hover:bg-pos-surface-hover active:scale-[0.97] transition-all"
            >
              C
            </button>
            <button
              onClick={() => handlePress("0")}
              className="h-[78px] flex items-center justify-center text-[32px] font-medium text-pos-text rounded-[var(--radius-md)] bg-pos-bg hover:bg-pos-surface-hover active:scale-[0.97] transition-all"
            >
              0
            </button>
            <button
              onClick={handleConfirm}
              disabled={parseInt(value, 10) <= 0}
              className="h-[78px] flex items-center justify-center text-[32px] font-semibold text-white rounded-[var(--radius-md)] active:scale-[0.97] transition-all disabled:opacity-40"
              style={{ backgroundColor: "var(--color-pos-accent)" }}
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
