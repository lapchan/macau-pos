"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/cn";
import { type Locale, t, getProductName } from "@/i18n/locales";
import { type Product } from "@/data/mock";
import { resolveImageSrc } from "@/lib/catalog-image-sync";
import { Search, X, ShoppingBag } from "lucide-react";
import CloseButton from "@/components/shared/close-button";

type Props = {
  locale: Locale;
  searchTags: string[];
  setSearchTags: (fn: (prev: string[]) => string[]) => void;
  input: string;
  setInput: (value: string) => void;
  filtered: Product[];
  addToCart: (product: Product) => void;
  onClose: () => void;
};

export default function ProductSearchSpotlight({
  locale, searchTags, setSearchTags, input, setInput, filtered, addToCart, onClose,
}: Props) {

  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    if (input.trim()) setSearchTags(prev => [...prev, input.trim()]);
    setInput("");
    setTimeout(onClose, 200);
  }, [closing, input, setSearchTags, setInput, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn("fixed inset-0 z-50 bg-black/40 transition-opacity duration-200", closing ? "opacity-0" : "animate-[fadeIn_0.2s_ease-out]")}
        onClick={handleClose}
      />
      {/* Search panel */}
      <div className={cn("fixed inset-x-0 top-0 z-50 flex justify-center pt-[8vh] px-4 transition-all duration-200", closing ? "opacity-0 -translate-y-4" : "animate-[spotlightOpen_0.25s_cubic-bezier(0.16,1,0.3,1)]")}>
        <div className="w-full max-w-xl bg-pos-surface rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Close button */}
          <CloseButton onClick={handleClose} className="absolute top-2 right-3 z-10" label={t(locale, "cancel")} />

          {/* Active tags */}
          {searchTags.length > 0 && (
            <div className="flex items-center gap-1.5 px-5 pt-3 flex-wrap">
              {searchTags.map((tag, i) => (
                <div
                  key={i}
                  className="h-7 flex items-center gap-1 pl-2.5 pr-1 text-[12px] font-medium rounded-[var(--radius-full)]"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-pos-accent) 12%, transparent)",
                    color: "var(--color-pos-accent)",
                  }}
                >
                  <span>{tag}</span>
                  <span
                    onClick={() => setSearchTags(prev => prev.filter((_, idx) => idx !== i))}
                    role="button"
                    tabIndex={0}
                    className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="flex items-center px-4">
            <Search className="h-5 w-5 text-pos-text-muted shrink-0 ml-1" />
            <input
              type="text"
              autoFocus
              placeholder={searchTags.length > 0 ? t(locale, "addFilter") : t(locale, "search")}
              aria-label={t(locale, "search")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") handleClose();
                if (e.key === "Enter" && input.trim()) {
                  setSearchTags(prev => [...prev, input.trim()]);
                  setInput("");
                }
                if (e.key === "Backspace" && !input && searchTags.length > 0) {
                  setSearchTags(prev => prev.slice(0, -1));
                }
              }}
              className="flex-1 h-14 pl-3 pr-12 text-[18px] bg-transparent text-pos-text placeholder:text-pos-text-muted outline-none border-none"
              style={{ outline: "none" }}
            />
          </div>

          {/* Quick results preview */}
          {(input || searchTags.length > 0) && (
            <div className="border-t border-pos-border max-h-[50vh] overflow-y-auto">
              {filtered.length > 0 ? (
                <div className="p-2">
                  {filtered.slice(0, 8).map((product) => {
                    const displayName = getProductName(product, locale);
                    const brand = product.brand || null;
                    const shortName = displayName;
                    return (
                      <button
                        key={product.id}
                        onClick={() => {
                          addToCart(product);
                          if (!product.hasVariants) handleClose();
                        }}
                        disabled={!product.inStock}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-colors",
                          product.inStock
                            ? "hover:bg-pos-surface-hover active:bg-pos-surface-active"
                            : "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-pos-bg flex items-center justify-center shrink-0 overflow-hidden">
                          {product.image ? (
                            <img src={resolveImageSrc(product.image)} alt={displayName} className="h-full w-full object-cover" loading="lazy" fetchPriority="low" />
                          ) : (
                            <ShoppingBag className="h-4 w-4 text-pos-text-muted/40" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {brand && <p className="text-[9px] font-semibold text-pos-text-muted uppercase tracking-wide">{brand}</p>}
                          <p className="text-[14px] font-medium text-pos-text truncate">{brand ? shortName : displayName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[14px] font-bold tabular-nums" style={{ color: "var(--color-pos-accent)" }}>
                            ${product.price.toFixed(product.price % 1 === 0 ? 0 : 1)}
                          </p>
                          {product.hasVariants && (
                            <p className="text-[10px] text-pos-text-muted">{t(locale, "variants")}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {filtered.length > 8 && (
                    <p className="text-center text-[12px] text-pos-text-muted py-2">
                      {t(locale, "searchMoreResults").replace("{count}", String(filtered.length - 8))}
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[14px] text-pos-text-secondary">{t(locale, "noResults")}</p>
                  <p className="text-[12px] text-pos-text-muted mt-1">{t(locale, "tryOther")}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
