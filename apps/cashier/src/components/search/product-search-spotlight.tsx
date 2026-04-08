"use client";

import { cn } from "@/lib/cn";
import { type Locale, t, getProductName } from "@/i18n/locales";
import { type Product } from "@/data/mock";
import { Search, X, ShoppingBag } from "lucide-react";

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

  const handleClose = () => {
    if (input.trim()) setSearchTags(prev => [...prev, input.trim()]);
    setInput("");
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 animate-[fadeIn_0.2s_ease-out]"
        onClick={handleClose}
      />
      {/* Search panel */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-[8vh] px-4 animate-[spotlightOpen_0.25s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="w-full max-w-xl bg-pos-surface rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label={t(locale, "cancel")}
            className="absolute top-3 right-3 h-10 w-10 flex items-center justify-center rounded-full bg-black/8 text-pos-text-muted hover:bg-black/15 transition-colors z-10"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>

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
                            <img src={product.image} alt="" className="h-full w-full object-cover" />
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
