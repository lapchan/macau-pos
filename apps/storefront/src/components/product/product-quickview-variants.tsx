"use client";

/**
 * Product Quickview Variants — Tailwind Plus
 *
 * 4 variants:
 *  - "with-color-size"     : Color swatches + size selector grid
 *  - "with-details-link"   : Color + size + "View full details" link
 *  - "with-large-size"     : Large size buttons (S/M/L/XL)
 *  - "with-description"    : Color selector + full description text
 */

import { useState } from "react";
import Image from "@/components/shared/store-thumb";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

type Product = {
  id: string;
  slug: string | null;
  name: string;
  description?: string | null;
  sellingPrice: string | number;
  image?: string | null;
  stock?: number | null;
};

type Props = {
  product: Product;
  locale: string;
  variant?: "with-color-size" | "with-details-link" | "with-large-size" | "with-description";
  open: boolean;
  onClose: () => void;
  currency?: string;
};

const t = (locale: string, tc: string, en: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt: en, ja: en };
  return m[locale] || en;
};

const COLORS = [
  { name: "White", class: "bg-white border-gray-300" },
  { name: "Gray", class: "bg-gray-400" },
  { name: "Black", class: "bg-gray-900" },
];

const SIZES = ["XS", "S", "M", "L", "XL"];

export default function ProductQuickviewVariants({ product, locale, variant = "with-color-size", open, onClose, currency = "MOP" }: Props) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(2); // M default
  const price = parseFloat(String(product.sellingPrice));
  const inStock = product.stock == null || product.stock > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl">
          <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-md bg-white p-2 text-gray-400 hover:text-gray-500">
            <XMarkIcon className="size-6" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative aspect-square bg-gray-100">
              {product.image ? (
                <Image src={product.image} alt={product.name} fill sizes="(max-width: 640px) 100vw, 50vw" className="object-cover" />
              ) : (
                <div className="size-full flex items-center justify-center text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-6 sm:p-8 flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
              <p className="mt-1 text-2xl font-bold text-gray-900">{currency} {price.toFixed(2)}</p>

              {/* Rating */}
              <div className="mt-3 flex items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarSolidIcon key={s} className={`size-4 ${s <= 4 ? "text-yellow-400" : "text-gray-300"}`} />
                ))}
                <span className="ml-2 text-sm text-gray-500">4.0</span>
              </div>

              {/* Description (variant: with-description) */}
              {(variant === "with-description") && product.description && (
                <p className="mt-4 text-sm text-gray-600 line-clamp-4">{product.description}</p>
              )}

              {/* Color selector */}
              {(variant !== "with-large-size") && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900">{t(locale, "顏色", "Color")}</h3>
                  <div className="mt-2 flex gap-2">
                    {COLORS.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColor(i)}
                        className={`size-8 rounded-full border-2 ${color.class} ${selectedColor === i ? "ring-2 ring-indigo-500 ring-offset-2" : ""}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size selector */}
              {(variant === "with-color-size" || variant === "with-details-link" || variant === "with-large-size") && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900">{t(locale, "尺寸", "Size")}</h3>
                  <div className={`mt-2 grid gap-2 ${variant === "with-large-size" ? "grid-cols-3" : "grid-cols-5"}`}>
                    {SIZES.map((size, i) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(i)}
                        className={`rounded-md border py-2 text-sm font-medium ${selectedSize === i ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"} ${variant === "with-large-size" ? "py-3 text-base" : ""}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6 space-y-3">
                <button
                  type="button"
                  disabled={!inStock}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:bg-gray-300"
                >
                  {t(locale, "加入購物車", "Add to cart")}
                </button>

                {/* Details link (variant: with-details-link) */}
                {variant === "with-details-link" && product.slug && (
                  <a href={`/${locale}/products/${product.slug}`} className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    {t(locale, "查看完整詳情", "View full details")}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
