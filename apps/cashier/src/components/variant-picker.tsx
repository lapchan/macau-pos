"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Check, ShoppingBag, Package, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { type Locale, t } from "@/i18n/locales";

export type VariantOption = {
  groupName: string;
  groupTranslations?: Record<string, string> | null;
  values: string[];
  valueTranslations?: (Record<string, string> | null)[];
};

function getTranslated(name: string, translations: Record<string, string> | null | undefined, locale: string): string {
  if (translations && translations[locale]) return translations[locale];
  return name;
}

export type VariantItem = {
  id: string;
  name: string;
  sellingPrice: string;
  stock: number | null;
  optionCombo: Record<string, string>;
  isActive: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  productName: string;
  productImage?: string;
  basePrice: number;
  options: VariantOption[];
  variants: VariantItem[];
  onSelect: (variant: VariantItem) => void;
  locale?: Locale;
};

export default function VariantPicker({
  open,
  onClose,
  productName,
  productImage,
  basePrice,
  options,
  variants,
  onSelect,
  locale = "tc",
}: Props) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [closing, setClosing] = useState(false);

  // Reset selection when opened
  useEffect(() => {
    if (open) {
      setSelected({});
      setClosing(false);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Find matching variant for current selection
  const matchingVariant = variants.find((v) => {
    const combo = v.optionCombo;
    return options.every((opt) => combo[opt.groupName] === selected[opt.groupName]);
  });

  const allSelected = options.every((opt) => selected[opt.groupName]);

  const handleSelect = useCallback((groupName: string, value: string) => {
    setSelected((prev) => ({ ...prev, [groupName]: value }));
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 250);
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (matchingVariant) {
      onSelect(matchingVariant);
      handleClose();
    }
  }, [matchingVariant, onSelect, handleClose]);

  if (!open) return null;

  const displayPrice = matchingVariant
    ? parseFloat(matchingVariant.sellingPrice)
    : basePrice;

  const inStock = matchingVariant
    ? matchingVariant.isActive && (matchingVariant.stock === null || matchingVariant.stock > 0)
    : true;

  const isLoading = options.length === 0;

  // Price range across all variants
  const prices = variants.map((v) => parseFloat(v.sellingPrice));
  const minPrice = prices.length > 0 ? Math.min(...prices) : basePrice;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : basePrice;
  const hasPriceRange = minPrice !== maxPrice;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300",
          closing ? "opacity-0" : "animate-[fadeIn_0.3s_ease-out]"
        )}
        onClick={handleClose}
      />

      {/* Bottom sheet — slides up to 85vh */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex flex-col bg-white rounded-t-2xl shadow-2xl",
          closing
            ? "animate-[variantSlideDown_0.3s_cubic-bezier(0.4,0,1,1)_forwards]"
            : "animate-[variantSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]"
        )}
        style={{ height: "85vh" }}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header — product info */}
        <div className="flex items-start gap-4 px-5 pb-4 border-b border-gray-100 shrink-0">
          {/* Product image */}
          <div className="h-20 w-20 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
            {productImage ? (
              <img src={productImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <ShoppingBag className="h-8 w-8 text-gray-300" strokeWidth={1.25} />
            )}
          </div>

          {/* Product details */}
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-[17px] font-bold text-gray-900 leading-tight">{productName}</h3>
            <div className="flex items-baseline gap-2 mt-1.5">
              {allSelected && matchingVariant ? (
                <span className="text-[20px] font-bold text-blue-600 tabular-nums">
                  MOP {displayPrice.toFixed(displayPrice % 1 === 0 ? 0 : 1)}
                </span>
              ) : hasPriceRange ? (
                <span className="text-[17px] font-semibold text-gray-600 tabular-nums">
                  MOP {minPrice.toFixed(0)} – {maxPrice.toFixed(0)}
                </span>
              ) : (
                <span className="text-[20px] font-bold text-blue-600 tabular-nums">
                  MOP {basePrice.toFixed(basePrice % 1 === 0 ? 0 : 1)}
                </span>
              )}
              {matchingVariant && matchingVariant.stock !== null && (
                <span className={cn(
                  "text-[12px] font-medium",
                  matchingVariant.stock > 30 ? "text-green-600" : matchingVariant.stock > 0 ? "text-orange-500" : "text-red-500"
                )}>
                  {matchingVariant.stock > 0
                    ? t(locale, "inStock").replace("{count}", String(matchingVariant.stock))
                    : t(locale, "outOfStock")}
                </span>
              )}
            </div>
            <p className="text-[12px] text-gray-400 mt-1">
              {t(locale, "variantsAvailable").replace("{count}", String(variants.length))}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Close"
            className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors shrink-0 mt-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Options — scrollable area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="h-6 w-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            options.map((opt) => (
              <div key={opt.groupName}>
                <label className="block text-[13px] font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                  {getTranslated(opt.groupName, opt.groupTranslations, locale)}
                  {selected[opt.groupName] && (
                    <span className="ml-2 normal-case tracking-normal text-gray-900 font-bold">
                      — {(() => {
                        const idx = opt.values.indexOf(selected[opt.groupName]);
                        return idx >= 0 && opt.valueTranslations?.[idx]
                          ? getTranslated(selected[opt.groupName], opt.valueTranslations[idx], locale)
                          : selected[opt.groupName];
                      })()}
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {opt.values.map((val) => {
                    const isValSelected = selected[opt.groupName] === val;
                    // Check if this value has any in-stock variant
                    const hasStock = variants.some(
                      (v) => v.optionCombo[opt.groupName] === val && v.isActive && (v.stock === null || v.stock > 0)
                    );
                    // Get price for this specific value (if single option group)
                    const matchForVal = options.length === 1
                      ? variants.find((v) => v.optionCombo[opt.groupName] === val && v.isActive)
                      : null;
                    const valPrice = matchForVal ? parseFloat(matchForVal.sellingPrice) : null;

                    return (
                      <button
                        key={val}
                        onClick={() => handleSelect(opt.groupName, val)}
                        disabled={!hasStock}
                        className={cn(
                          "min-h-[44px] px-5 rounded-2xl text-[14px] font-medium transition-all border-2",
                          isValSelected
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                            : hasStock
                            ? "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.97]"
                            : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                        )}
                      >
                        <span>{(() => {
                          const idx = opt.values.indexOf(val);
                          return idx >= 0 && opt.valueTranslations?.[idx]
                            ? getTranslated(val, opt.valueTranslations[idx], locale)
                            : val;
                        })()}</span>
                        {valPrice !== null && valPrice !== basePrice && (
                          <span className="block text-[11px] text-gray-400 font-normal mt-0.5">
                            MOP {valPrice.toFixed(0)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Selected variant details */}
          {matchingVariant && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {Object.values(matchingVariant.optionCombo).join(" · ")}
                  </p>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    MOP {parseFloat(matchingVariant.sellingPrice).toFixed(1)}
                    {matchingVariant.stock !== null && ` · ${t(locale, "inStock").replace("{count}", String(matchingVariant.stock))}`}
                    {matchingVariant.stock === null && ` · ${t(locale, "unlimitedStock")}`}
                  </p>
                </div>
                {!inStock && (
                  <div className="flex items-center gap-1 text-red-500 text-[12px] font-medium shrink-0">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {t(locale, "outOfStock")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer — sticky CTA */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-100 shrink-0 bg-white">
          <button
            onClick={handleConfirm}
            disabled={!allSelected || !matchingVariant || !inStock}
            className={cn(
              "w-full h-14 rounded-2xl text-[16px] font-bold transition-all flex items-center justify-center gap-2.5",
              allSelected && matchingVariant && inStock
                ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-600/20"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : !allSelected ? (
              t(locale, "selectOptions")
            ) : !inStock ? (
              t(locale, "outOfStock")
            ) : (
              <>
                <Check className="h-5 w-5" />
                {t(locale, "addToCartWith").replace("{price}", displayPrice.toFixed(displayPrice % 1 === 0 ? 0 : 1))}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
