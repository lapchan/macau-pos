"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { type Locale, t } from "@/i18n/locales";
import { Percent, DollarSign, X, Delete } from "lucide-react";
import type { OrderDiscount } from "@/lib/actions";

type Props = {
  locale: Locale;
  subtotal: number;
  onApply: (discount: OrderDiscount) => void;
  onClose: () => void;
};

export default function DiscountPopover({ locale, subtotal, onApply, onClose }: Props) {
  const [mode, setMode] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("0");
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const numValue = mode === "percent"
    ? (parseInt(value, 10) || 0)
    : (parseInt(value, 10) / 100);
  const preview = mode === "percent"
    ? Math.round(subtotal * numValue / 100 * 100) / 100
    : Math.min(numValue, subtotal);
  const isValid = numValue > 0 && (mode === "percent" ? numValue <= 100 : numValue <= subtotal);

  const displayValue = mode === "percent"
    ? (parseInt(value, 10) || 0) + "%"
    : "MOP " + (parseInt(value, 10) / 100).toFixed(2);

  const handleApply = () => {
    if (!isValid) return;
    onApply({ type: mode, value: numValue });
    handleClose();
  };

  const handleKey = (key: string) => {
    setValue(prev => {
      if (key === "C") return "0";
      if (key === "⌫") {
        const next = prev.slice(0, -1);
        return next === "" ? "0" : next;
      }
      if (prev === "0") return key;
      const next = prev + key;
      // Percent: cap at 100
      if (mode === "percent" && parseInt(next, 10) > 100) return prev;
      // Fixed: max 8 digits
      if (mode === "fixed" && next.length > 8) return prev;
      return next;
    });
  };

  return (
    <>
      <div className={cn("fixed inset-0 z-50 bg-black/40 transition-opacity duration-200", closing ? "opacity-0" : "opacity-100")} onClick={handleClose} />
      <div className={cn(
        "fixed left-1/2 top-[15%] -translate-x-1/2 z-50 w-[340px] bg-pos-surface border border-pos-border rounded-[var(--radius-lg)] shadow-xl overflow-hidden transition-all duration-200",
        closing ? "opacity-0 scale-95" : "animate-scale-in"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-pos-border">
          <span className="text-[15px] font-semibold text-pos-text">{t(locale, "discount")}</span>
          <button onClick={handleClose} className="h-10 w-10 rounded-full bg-black/8 flex items-center justify-center text-pos-text-muted hover:bg-black/15 transition-colors">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-pos-bg rounded-[var(--radius-md)]">
            <button
              onClick={() => { setMode("percent"); setValue("0"); }}
              className={cn(
                "flex-1 h-11 flex items-center justify-center gap-1.5 text-[14px] font-medium rounded-[var(--radius-md)] transition-all",
                mode === "percent" ? "bg-pos-surface text-pos-text shadow-sm" : "text-pos-text-muted hover:text-pos-text-secondary"
              )}
            >
              <Percent className="h-4 w-4" />
              {t(locale, "percentage")}
            </button>
            <button
              onClick={() => { setMode("fixed"); setValue("0"); }}
              className={cn(
                "flex-1 h-11 flex items-center justify-center gap-1.5 text-[14px] font-medium rounded-[var(--radius-md)] transition-all",
                mode === "fixed" ? "bg-pos-surface text-pos-text shadow-sm" : "text-pos-text-muted hover:text-pos-text-secondary"
              )}
            >
              <DollarSign className="h-4 w-4" />
              MOP
            </button>
          </div>

          {/* Display — same height for both modes */}
          <div className="flex items-center justify-between px-4 h-14 bg-pos-bg border border-pos-border rounded-[var(--radius-md)]">
            <span className="text-[13px] text-pos-text-muted">{mode === "percent" ? "%" : "MOP"}</span>
            <div className="flex items-center gap-2">
              <span className="text-[24px] font-bold text-pos-text tabular-nums">
                {mode === "percent" ? (parseInt(value, 10) || 0) : (parseInt(value, 10) / 100).toFixed(2)}
              </span>
              <button
                onClick={() => handleKey("⌫")}
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-full text-pos-text-muted hover:bg-pos-surface-hover transition-colors",
                  parseInt(value, 10) === 0 && "invisible"
                )}
              >
                <Delete className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Numpad — same for both modes */}
          <div className="grid grid-cols-3 gap-2">
            {["1","2","3","4","5","6","7","8","9","C","0", mode === "fixed" ? "00" : ""].map(n => (
              n ? (
                <button
                  key={n}
                  onClick={() => handleKey(n)}
                  className={cn(
                    "h-14 rounded-[var(--radius-md)] text-[20px] font-medium transition-all active:scale-[0.97]",
                    n === "C"
                      ? "bg-pos-bg text-pos-text-muted hover:bg-pos-surface-hover text-[18px]"
                      : "bg-pos-bg text-pos-text hover:bg-pos-surface-hover"
                  )}
                >
                  {n}
                </button>
              ) : <div key="empty" className="h-14" />
            ))}
          </div>

          {/* Percent presets — slides in below numpad */}
          <div className={cn(
            "grid grid-cols-6 gap-1.5 overflow-hidden transition-all duration-200 ease-out",
            mode === "percent" ? "max-h-[44px] opacity-100 mt-0" : "max-h-0 opacity-0 -mt-3"
          )}>
            {[5, 10, 15, 20, 25, 50].map((p) => (
              <button
                key={p}
                onClick={() => setValue(String(p))}
                className={cn(
                  "h-10 rounded-[var(--radius-sm)] text-[13px] font-medium border transition-all active:scale-[0.97]",
                  parseInt(value, 10) === p
                    ? "border-pos-accent bg-pos-accent/10 text-pos-accent"
                    : "border-pos-border bg-pos-bg text-pos-text-secondary hover:border-pos-border-strong"
                )}
              >
                {p}%
              </button>
            ))}
          </div>

          {/* Preview — always occupies space, opacity transition */}
          <div className={cn(
            "flex items-center justify-between text-[13px] px-1 h-[20px] transition-opacity duration-200",
            numValue > 0 ? "opacity-100" : "opacity-0"
          )}>
            <span className="text-pos-text-muted">
              {mode === "percent" ? `${numValue}% of MOP ${subtotal.toFixed(2)}` : "Fixed discount"}
            </span>
            <span className="font-semibold text-pos-danger">-MOP {preview.toFixed(2)}</span>
          </div>

          {/* Apply */}
          <button
            onClick={handleApply}
            disabled={!isValid}
            className={cn(
              "w-full h-14 rounded-[var(--radius-md)] text-[16px] font-semibold transition-all",
              isValid
                ? "text-white hover:shadow-md active:scale-[0.98]"
                : "bg-pos-bg text-pos-text-muted cursor-not-allowed border border-pos-border"
            )}
            style={isValid ? { backgroundColor: "var(--color-pos-accent)" } : undefined}
          >
            {t(locale, "applyDiscount")}
          </button>
        </div>
      </div>
    </>
  );
}
