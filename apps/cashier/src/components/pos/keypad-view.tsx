"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/cn";
import { type Locale, t } from "@/i18n/locales";
import { type Product } from "@/data/mock";
import { Delete, StickyNote, Plus } from "lucide-react";
import CloseButton from "@/components/shared/close-button";

type Props = {
  locale: Locale;
  onAddToCart: (product: Product) => void;
  currency?: string;
};

export default function KeypadView({ locale, onAddToCart, currency = "MOP" }: Props) {
  const [value, setValue] = useState("0");
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  const handlePress = useCallback((key: string) => {
    setValue(prev => {
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

  const handleAddToCart = useCallback(() => {
    const cents = parseInt(value, 10);
    if (cents <= 0) return;
    const price = cents / 100;
    const customId = `custom_${Date.now()}`;
    const customProduct: Product = {
      id: customId,
      name: note || t(locale, "customItem"),
      price,
      category: "custom",
      inStock: true,
    };
    onAddToCart(customProduct);
    setValue("0");
    setNote("");
  }, [value, note, locale, onAddToCart]);

  return (
    <div className="flex-1 flex flex-col px-8 py-6" style={{ contain: "layout" }}>
      {/* Price display */}
      <div className="flex-1 flex flex-col justify-center min-h-0">
        <div className="flex items-center justify-between">
          <p className="text-[64px] font-bold text-pos-text tracking-tight text-left tabular-nums leading-none">
            <span className="text-[40px] text-pos-text-muted mr-1">{currency}</span>
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
        <p className={cn(
          "text-[15px] mt-2 text-left truncate h-[22px]",
          note ? "text-pos-text-muted" : "text-transparent"
        )}>
          {note || "\u00A0"}
        </p>
      </div>

      {/* Keypad grid */}
      <div className="grid grid-cols-3 gap-3 pb-2">
        {/* Row 1: + Note (full row) */}
        <button
          onClick={() => setShowNote(true)}
          className="h-[86px] col-span-3 flex items-center justify-center gap-2 text-[19px] font-medium text-pos-text-secondary rounded-[var(--radius-md)] bg-pos-bg hover:bg-pos-surface-hover active:scale-[0.97] transition-all"
        >
          <StickyNote className="h-5 w-5" />
          {t(locale, "addNote")}
        </button>

        {/* Row 2–4: number keys 1-9 */}
        {["1","2","3","4","5","6","7","8","9"].map(n => (
          <button
            key={n}
            onClick={() => handlePress(n)}
            className="h-[86px] flex items-center justify-center text-[34px] font-medium text-pos-text rounded-[var(--radius-md)] bg-pos-bg hover:bg-pos-surface-hover active:scale-[0.97] transition-all"
          >
            {n}
          </button>
        ))}

        {/* Row 5: C, 0, Add */}
        <button
          onClick={() => handlePress("C")}
          className="h-[86px] flex items-center justify-center text-[26px] font-semibold text-pos-text-muted rounded-[var(--radius-md)] bg-pos-bg hover:bg-pos-surface-hover active:scale-[0.97] transition-all"
        >
          C
        </button>
        <button
          onClick={() => handlePress("0")}
          className="h-[86px] flex items-center justify-center text-[34px] font-medium text-pos-text rounded-[var(--radius-md)] bg-pos-bg hover:bg-pos-surface-hover active:scale-[0.97] transition-all"
        >
          0
        </button>
        <button
          onClick={handleAddToCart}
          disabled={parseInt(value, 10) <= 0}
          className="h-[86px] flex items-center justify-center text-[34px] font-semibold text-white rounded-[var(--radius-md)] active:scale-[0.97] transition-all disabled:opacity-40"
          style={{ backgroundColor: "var(--color-pos-accent)" }}
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>

      {/* Note spotlight overlay */}
      {showNote && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setShowNote(false)}
          />
          <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-[8vh] px-4 animate-[spotlightOpen_0.25s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="w-full max-w-xl bg-pos-surface rounded-2xl shadow-2xl overflow-hidden relative">
              {/* Close button */}
              <CloseButton onClick={() => setShowNote(false)} className="absolute top-3 right-3 z-10" label={t(locale, "cancel")} />

              <div className="p-5">
                <p className="text-[15px] font-semibold text-pos-text mb-3">{t(locale, "addNote")}</p>
                <input
                  type="text"
                  autoFocus
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") setShowNote(false); }}
                  placeholder={t(locale, "keypadNotePlaceholder")}
                  className="w-full h-11 px-3 text-[14px] text-pos-text bg-pos-bg border border-pos-border rounded-[var(--radius-md)] outline-none focus:border-pos-accent transition-colors"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => { setNote(""); setShowNote(false); }}
                    className="h-10 px-4 text-[13px] text-pos-text-secondary rounded-[var(--radius-md)] hover:bg-pos-surface-hover transition-colors"
                  >
                    {t(locale, "clear")}
                  </button>
                  <button
                    onClick={() => setShowNote(false)}
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
