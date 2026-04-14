"use client";

import { useState } from "react";
import { XMarkIcon, StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { resolveStorefrontThumb } from "@/lib/resolve-image";

type Product = {
  id: string;
  slug: string | null;
  name: string;
  description?: string | null;
  sellingPrice: string | number;
  originalPrice?: string | number | null;
  image?: string | null;
  images?: { url: string; alt?: string }[];
  stock?: number | null;
  hasVariants?: boolean | null;
};

type Props = {
  product: Product;
  locale: string;
  open: boolean;
  onClose: () => void;
  currency?: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function ProductQuickview({ product, locale, open, onClose, currency = "MOP" }: Props) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!open) return null;

  const price = parseFloat(String(product.sellingPrice));
  const originalPrice = product.originalPrice ? parseFloat(String(product.originalPrice)) : null;
  const inStock = product.stock == null || product.stock > 0;
  const images = product.images?.length ? product.images : product.image ? [{ url: product.image, alt: product.name }] : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500/75 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-md bg-white p-2 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="size-6" aria-hidden="true" />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative aspect-square bg-gray-100">
              {images.length > 0 ? (
                <img
                  src={resolveStorefrontThumb(images[selectedImage]?.url)}
                  alt={images[selectedImage]?.alt || product.name}
                  className="size-full object-cover object-center"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
              )}

              {/* Image thumbnails */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`size-2 rounded-full transition-colors ${i === selectedImage ? "bg-white" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-6 sm:p-8 flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>

              <div className="mt-2 flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">{currency} {price.toFixed(2)}</p>
                {originalPrice && originalPrice > price && (
                  <p className="text-base text-gray-400 line-through">{currency} {originalPrice.toFixed(2)}</p>
                )}
              </div>

              {/* Placeholder rating */}
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  star <= 4 ? (
                    <StarSolidIcon key={star} className="size-4 text-yellow-400" />
                  ) : (
                    <StarIcon key={star} className="size-4 text-gray-300" />
                  )
                ))}
                <span className="ml-2 text-sm text-gray-500">4.0</span>
              </div>

              {/* Description */}
              {product.description && (
                <p className="mt-4 text-sm text-gray-600 line-clamp-3">{product.description}</p>
              )}

              <div className="mt-auto pt-6 space-y-3">
                {/* Stock status */}
                <div className="flex items-center gap-2 text-sm">
                  {inStock ? (
                    <>
                      <span className="size-2 rounded-full bg-green-500" />
                      <span className="text-gray-600">{t(locale, "有貨", "In stock", "Em estoque", "在庫あり")}</span>
                    </>
                  ) : (
                    <>
                      <span className="size-2 rounded-full bg-red-500" />
                      <span className="text-gray-600">{t(locale, "售罄", "Out of stock", "Esgotado", "在庫切れ")}</span>
                    </>
                  )}
                </div>

                {/* Add to cart */}
                <button
                  type="button"
                  disabled={!inStock}
                  className="w-full rounded-lg bg-sf-accent px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-sf-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sf-accent disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {t(locale, "加入購物車", "Add to cart", "Adicionar ao carrinho", "カートに追加")}
                </button>

                {/* View full details link */}
                {product.slug && (
                  <a
                    href={`/${locale}/products/${product.slug}`}
                    className="block text-center text-sm font-medium text-sf-accent hover:text-sf-accent-hover"
                  >
                    {t(locale, "查看完整詳情", "View full details", "Ver detalhes completos", "詳細を見る")}
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
