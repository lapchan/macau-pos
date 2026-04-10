"use client";

import { useState, useCallback, useEffect } from "react";
import { Check, ShoppingBag, Package, AlertCircle } from "lucide-react";
import CloseButton from "@/components/shared/close-button";
import { cn } from "@/lib/cn";
import { resolveImageSrc } from "@/lib/catalog-image-sync";
import { type Locale, t } from "@/i18n/locales";

export type VariantOption = {
  groupName: string;
  groupTranslations?: Record<string, string> | null;
  displayType?: string; // "auto" | "color" | "image" | "text"
  values: string[];
  valueTranslations?: (Record<string, string> | null)[];
};

function getTranslated(name: string, translations: Record<string, string> | null | undefined, locale: string): string {
  if (translations && translations[locale]) return translations[locale];
  return name;
}

// Color name → hex lookup for swatch circles
const COLOR_MAP: Record<string, string> = {
  // Chinese
  "白": "#ffffff", "純白": "#ffffff", "純白色": "#ffffff", "純⽩⾊": "#ffffff", "白色": "#ffffff",
  "黑": "#1a1a1a", "黑色": "#1a1a1a", "暗魂黑": "#1a1a1a", "酷黑": "#111111",
  "灰": "#9ca3af", "灰色": "#9ca3af", "城堡灰": "#8b8680",
  "綠": "#22c55e", "綠色": "#22c55e", "森林綠": "#2d5a27",
  "藍": "#3b82f6", "藍色": "#3b82f6", "深海藍": "#1e3a5f", "粉藍": "#93c5fd", "粉藍色": "#93c5fd",
  "紅": "#ef4444", "紅色": "#ef4444",
  "粉紅": "#f9a8d4", "粉紅色": "#f9a8d4", "粉紅 Pink": "#f9a8d4",
  "粉藍 Blue": "#93c5fd", "純白 White": "#ffffff",
  "薄荷": "#a7f3d0", "薄荷色": "#a7f3d0", "薄荷⾊": "#a7f3d0",
  "奶茶": "#c4a882", "奶茶色": "#c4a882", "奶茶⾊": "#c4a882",
  "紫": "#a855f7", "紫色": "#a855f7",
  "橙": "#f97316", "橙色": "#f97316",
  "金": "#eab308", "金色": "#eab308", "銀": "#c0c0c0", "銀色": "#c0c0c0",
  // English
  "white": "#ffffff", "black": "#1a1a1a", "grey": "#9ca3af", "gray": "#9ca3af",
  "green": "#22c55e", "blue": "#3b82f6", "red": "#ef4444", "pink": "#f9a8d4",
  "mint": "#a7f3d0", "silver": "#c0c0c0", "gold": "#eab308",
  // Scents / flowers — warm tones
  "河津櫻": "#f4c2c2", "丁香": "#c8a2c8", "乾燥玫瑰": "#c08081", "夜海": "#2c3e6b",
  "晨霧": "#d3d3d3", "焙茶": "#8b6914", "紫滕": "#9370db", "落日珊瑚": "#f08080",
  "薰衣草": "#b57edc", "藍雪花": "#6495ed", "風鈴木": "#f0c420", "綠桔梗": "#77b28c",
  "蝶豆花": "#4a3fc4", "青檸": "#a8d600", "桂枝": "#c4996c",
};

function getColorHex(name: string): string | null {
  const lower = name.toLowerCase().trim();
  // Direct match
  if (COLOR_MAP[name]) return COLOR_MAP[name];
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  // Partial match — check if any key is contained in the name
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (name.includes(key) || lower.includes(key.toLowerCase())) return hex;
  }
  return null;
}

export type VariantItem = {
  id: string;
  name: string;
  sellingPrice: string;
  stock: number | null;
  optionCombo: Record<string, string>;
  isActive: boolean;
  image?: string | null;
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
  onAddDirect?: () => void;
  loading?: boolean;
  locale?: Locale;
  currency?: string;
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
  onAddDirect,
  loading: loadingProp = false,
  locale = "tc",
  currency = "MOP",
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

  const hasNoVariants = !!onAddDirect;
  const isLoading = loadingProp;

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
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          closing ? "opacity-0" : "animate-[fadeIn_0.3s_ease-out]"
        )}
        onClick={handleClose}
      />

      {/* Bottom sheet — slides up to 85vh */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex flex-col bg-pos-bg rounded-t-[var(--radius-xl)] shadow-2xl",
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
              <img src={resolveImageSrc(productImage)} alt="" className="h-full w-full object-cover pointer-events-none select-none" draggable={false} />
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
                  {currency} {displayPrice.toFixed(displayPrice % 1 === 0 ? 0 : 1)}
                </span>
              ) : hasPriceRange ? (
                <span className="text-[17px] font-semibold text-gray-600 tabular-nums">
                  {currency} {minPrice.toFixed(0)} – {maxPrice.toFixed(0)}
                </span>
              ) : (
                <span className="text-[20px] font-bold text-blue-600 tabular-nums">
                  {currency} {basePrice.toFixed(basePrice % 1 === 0 ? 0 : 1)}
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
            {!hasNoVariants && (
              <p className="text-[12px] text-gray-400 mt-1">
                {t(locale, "variantsAvailable").replace("{count}", String(variants.length))}
              </p>
            )}
          </div>

          {/* Close button */}
          <CloseButton onClick={handleClose} className="shrink-0" />
        </div>

        {/* Options — scrollable area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {hasNoVariants ? (
            <div />
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="h-6 w-6 border-2 border-pos-accent/30 border-t-pos-accent rounded-full animate-spin" />
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

                    // Find variant image for this option value
                    const variantForVal = variants.find(
                      (v) => v.optionCombo[opt.groupName] === val && v.isActive
                    );
                    const dtype = opt.displayType || "auto";
                    const swatchImage = dtype !== "color" && dtype !== "text" ? (variantForVal?.image || null) : null;
                    const swatchColor = dtype !== "image" && dtype !== "text" ? getColorHex(val) : null;
                    const hasSwatch = dtype !== "text" && !!(swatchImage || swatchColor);

                    return (
                      <button
                        key={val}
                        onClick={() => handleSelect(opt.groupName, val)}
                        disabled={!hasStock}
                        className={cn(
                          "min-h-[44px] rounded-2xl text-[14px] font-medium transition-all border-2 flex items-center gap-2.5",
                          hasSwatch ? "pl-2.5 pr-5" : "px-5",
                          isValSelected
                            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                            : hasStock
                            ? "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.97]"
                            : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                        )}
                      >
                        {hasSwatch && (
                          <span
                            className={cn(
                              "h-7 w-7 rounded-full shrink-0 overflow-hidden border",
                              isValSelected ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-200"
                            )}
                          >
                            {swatchImage ? (
                              <img src={resolveImageSrc(swatchImage)} alt="" className="h-full w-full object-cover pointer-events-none select-none" draggable={false} />
                            ) : swatchColor ? (
                              <span
                                className="block h-full w-full"
                                style={{
                                  backgroundColor: swatchColor,
                                  boxShadow: swatchColor === "#ffffff" ? "inset 0 0 0 1px rgba(0,0,0,0.1)" : undefined,
                                }}
                              />
                            ) : null}
                          </span>
                        )}
                        <span>{(() => {
                          const idx = opt.values.indexOf(val);
                          return idx >= 0 && opt.valueTranslations?.[idx]
                            ? getTranslated(val, opt.valueTranslations[idx], locale)
                            : val;
                        })()}</span>
                        {valPrice !== null && valPrice !== basePrice && (
                          <span className="block text-[11px] text-gray-400 font-normal mt-0.5">
                            {currency} {valPrice.toFixed(0)}
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
                <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {(matchingVariant.image || productImage) ? (
                    <img src={resolveImageSrc(matchingVariant.image || productImage)} alt="" className="h-full w-full object-cover pointer-events-none select-none" draggable={false} />
                  ) : (
                    <Package className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {Object.values(matchingVariant.optionCombo).join(" · ")}
                  </p>
                  <p className="text-[12px] text-gray-500 mt-0.5">
                    {currency} {parseFloat(matchingVariant.sellingPrice).toFixed(1)}
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
          {hasNoVariants ? (
            <button
              onClick={() => { onAddDirect!(); handleClose(); }}
              className="w-full h-14 rounded-2xl text-[16px] font-bold transition-all flex items-center justify-center gap-2.5 bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-600/20"
            >
              <Check className="h-5 w-5" />
              {t(locale, "addToCartWith").replace("{currency}", currency).replace("{price}", basePrice.toFixed(basePrice % 1 === 0 ? 0 : 1))}
            </button>
          ) : (
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
                  {t(locale, "addToCartWith").replace("{currency}", currency).replace("{price}", displayPrice.toFixed(displayPrice % 1 === 0 ? 0 : 1))}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
