/**
 * ProductCard — Reusable product card component
 * Based on Tailwind Plus ecommerce product list patterns
 *
 * Variants:
 *  - "simple"         : Image + name + price
 *  - "with-inline"    : Image + name + price inline (name left, price right)
 *  - "with-cta"       : Image + name + price + "Shop now" link
 *  - "tall"           : Tall image (5:6 aspect), name + price below
 *  - "wide"           : Horizontal layout (image left, info right)
 *  - "with-overlay"   : Image with price overlay + "Add to bag" button below
 *  - "with-details"   : Image + name + description + star rating + price
 *  - "border-grid"    : Card with border, supporting text, structured layout
 *  - "with-swatches"  : Image + name + color swatch dots + price
 *  - "humanmade"      : HUMAN MADE-inspired minimal card (1:1 sharp image, uppercase name, yen-style price)
 */

import Image from "next/image";

type Product = {
  id: string;
  slug: string | null;
  name: string;
  description?: string | null;
  translations?: Record<string, string> | null;
  sellingPrice: string | number;
  originalPrice?: string | number | null;
  image?: string | null;
  images?: unknown;
  stock?: number | null;
  hasVariants?: boolean | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  categoryTranslations?: Record<string, string> | null;
};

type Props = {
  product: Product;
  locale: string;
  variant?: "simple" | "with-inline" | "with-cta" | "tall" | "wide" | "with-overlay" | "with-details" | "border-grid" | "with-swatches" | "humanmade";
  themeId?: string;
  showCategory?: boolean;
  currency?: string;
  onAddToCart?: (productId: string) => void;
};

function getDisplayName(name: string, translations?: Record<string, string> | null, locale?: string): string {
  if (locale && translations?.[locale]) return translations[locale];
  return name;
}

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function ProductCard({ product, locale, variant = "simple", showCategory = false, currency = "MOP", onAddToCart }: Props) {
  const name = getDisplayName(product.name, product.translations as Record<string, string>, locale);
  const price = parseFloat(String(product.sellingPrice));
  const originalPrice = product.originalPrice ? parseFloat(String(product.originalPrice)) : null;
  const inStock = product.stock == null || product.stock > 0;
  const href = product.slug ? `/${locale}/products/${product.slug}` : "#";
  const catName = product.categoryName
    ? getDisplayName(product.categoryName, product.categoryTranslations as Record<string, string>, locale)
    : null;
  const discount = originalPrice && originalPrice > price
    ? Math.round((1 - price / originalPrice) * 100)
    : null;

  const ImagePlaceholder = () => (
    <div className="size-full flex items-center justify-center text-gray-300">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    </div>
  );

  const SoldOutBadge = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
        {t(locale, "售罄", "Sold out", "Esgotado", "売り切れ")}
      </span>
    </div>
  );

  const ProductImage = ({ aspect = "aspect-square", rounded = "rounded-lg" }: { aspect?: string; rounded?: string }) => (
    <div className={`relative ${aspect} w-full overflow-hidden ${rounded} bg-gray-100 group-hover:opacity-75 transition-opacity`}>
      {product.image ? (
        <Image src={product.image} alt={name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover object-center" />
      ) : (
        <ImagePlaceholder />
      )}
      {!inStock && <SoldOutBadge />}
      {discount && variant !== "with-overlay" && (
        <span className="absolute top-2 left-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
          -{discount}%
        </span>
      )}
    </div>
  );

  // ------------------------------------------------------------------
  // Variant: wide (horizontal card)
  // ------------------------------------------------------------------
  if (variant === "wide") {
    return (
      <a href={href} className="group flex gap-4">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {product.image ? (
            <Image src={product.image} alt={name} fill sizes="128px" className="object-cover object-center group-hover:opacity-75 transition-opacity" />
          ) : (
            <ImagePlaceholder />
          )}
          {!inStock && <SoldOutBadge />}
        </div>
        <div className="flex flex-col justify-center">
          {showCategory && catName && <p className="text-xs text-gray-500">{catName}</p>}
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-gray-600">{name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900">{currency} {price.toFixed(2)}</p>
            {originalPrice && originalPrice > price && (
              <p className="text-sm text-gray-400 line-through">{currency} {originalPrice.toFixed(2)}</p>
            )}
          </div>
        </div>
      </a>
    );
  }

  // ------------------------------------------------------------------
  // Variant: with-overlay (price overlay + "Add to bag" button)
  // ------------------------------------------------------------------
  if (variant === "with-overlay") {
    return (
      <div>
        <div className="relative">
          <a href={href} className="group">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
              {product.image ? (
                <Image src={product.image} alt={name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover object-center group-hover:opacity-75 transition-opacity" />
              ) : (
                <ImagePlaceholder />
              )}
              {!inStock && <SoldOutBadge />}
            </div>
            {/* Price overlay at bottom */}
            <div className="absolute inset-x-0 top-0 flex aspect-square items-end justify-end overflow-hidden rounded-lg p-4">
              <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black opacity-50" />
              <p className="relative text-lg font-semibold text-white">{currency} {price.toFixed(2)}</p>
            </div>
          </a>
          {/* Info */}
          <div className="relative mt-4">
            <h3 className="text-sm font-medium text-gray-900">
              <a href={href}>{name}</a>
            </h3>
            {catName && showCategory && <p className="mt-1 text-sm text-gray-500">{catName}</p>}
          </div>
        </div>
        {/* Add to bag button */}
        <div className="mt-4">
          {inStock ? (
            <a
              href={href}
              className="relative flex items-center justify-center rounded-md border border-transparent bg-gray-100 px-8 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
            >
              {t(locale, "加入購物車", "Add to bag", "Adicionar", "カートに追加")}
            </a>
          ) : (
            <span className="flex items-center justify-center rounded-md bg-gray-50 px-8 py-2 text-sm font-medium text-gray-400">
              {t(locale, "售罄", "Sold out", "Esgotado", "売り切れ")}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Variant: with-details (name + description + rating + price)
  // ------------------------------------------------------------------
  if (variant === "with-details") {
    return (
      <a href={href} className="group">
        <ProductImage />
        <div className="mt-4 space-y-1">
          <h3 className="text-sm font-medium text-gray-900">{name}</h3>
          {product.description && (
            <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
          )}
          {/* Star rating placeholder */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className={`size-3.5 ${star <= 4 ? "text-yellow-400" : "text-gray-300"}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" fillRule="evenodd" />
              </svg>
            ))}
            <span className="ml-1 text-xs text-gray-500">(0)</span>
          </div>
          <p className="text-sm font-medium text-gray-900">{currency} {price.toFixed(2)}</p>
        </div>
      </a>
    );
  }

  // ------------------------------------------------------------------
  // Variant: border-grid (bordered card with supporting text)
  // ------------------------------------------------------------------
  if (variant === "border-grid") {
    return (
      <a href={href} className="group rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300">
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gray-100">
          {product.image ? (
            <Image src={product.image} alt={name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover object-center group-hover:opacity-75 transition-opacity" />
          ) : (
            <ImagePlaceholder />
          )}
          {!inStock && <SoldOutBadge />}
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">{name}</h3>
            <p className="text-sm font-medium text-gray-900">{currency} {price.toFixed(2)}</p>
          </div>
          {catName && showCategory && (
            <p className="mt-1 text-sm text-gray-500">{catName}</p>
          )}
          {product.hasVariants && (
            <p className="mt-1 text-xs text-gray-400">
              {t(locale, "多款可選", "Multiple options", "Várias opções", "複数オプション")}
            </p>
          )}
          {/* Star rating */}
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className={`size-3 ${star <= 4 ? "text-yellow-400" : "text-gray-200"}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" fillRule="evenodd" />
              </svg>
            ))}
          </div>
        </div>
      </a>
    );
  }

  // ------------------------------------------------------------------
  // Variant: with-swatches (color swatch dots)
  // ------------------------------------------------------------------
  if (variant === "with-swatches") {
    // Generate pseudo color swatches from product name hash
    const swatchColors = ["#1a1a1a", "#d4a574", "#6b7280", "#dc2626"].slice(0, product.hasVariants ? 3 : 1);
    return (
      <a href={href} className="group">
        <ProductImage />
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">{name}</h3>
            <p className="text-sm font-medium text-gray-900">{currency} {price.toFixed(2)}</p>
          </div>
          {/* Color swatches */}
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              {t(locale, "可選顏色", "Available colors", "Cores disponíveis", "カラー")}
            </p>
            <div className="mt-1.5 flex gap-1.5">
              {swatchColors.map((color, i) => (
                <span
                  key={i}
                  className="size-4 rounded-full border border-gray-300 ring-1 ring-transparent hover:ring-gray-400"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </a>
    );
  }

  // ------------------------------------------------------------------
  // Variant: humanmade (HUMAN MADE-inspired minimal card)
  // ------------------------------------------------------------------
  if (variant === "humanmade") {
    const hmPrice = price.toLocaleString("ja-JP", { maximumFractionDigits: 0 });
    const isNew = false; // TODO: wire up to a product.isNew field when available
    return (
      <a href={href} className="group block">
        {/* 1:1 sharp-edge image */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#f5f5f5]">
          {product.image ? (
            <Image
              src={product.image}
              alt={name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain object-center transition-transform duration-500 ease-in-out group-hover:scale-105"
            />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
        {/* Info */}
        <div className="p-2">
          {isNew && (
            <span className="text-xs font-medium text-red-500" style={{ letterSpacing: "0.5px" }}>
              NEW
            </span>
          )}
          <h3
            className="text-xs uppercase text-black leading-relaxed line-clamp-2"
            style={{ letterSpacing: "0.5px" }}
          >
            {name}
          </h3>
          <p
            className="mt-1 text-xs text-gray-500"
            style={{ letterSpacing: "0.5px" }}
          >
            &yen;{hmPrice}
          </p>
        </div>
      </a>
    );
  }

  // ------------------------------------------------------------------
  // Standard variants: simple, with-inline, with-cta, tall
  // ------------------------------------------------------------------
  const aspectClass = variant === "tall" ? "aspect-[5/6]" : "aspect-square";

  return (
    <a href={href} className="group">
      <ProductImage aspect={aspectClass} />

      {variant === "with-inline" ? (
        <div className="mt-4 flex justify-between">
          <div>
            <h3 className="text-sm text-gray-700">{name}</h3>
            {showCategory && catName && <p className="mt-1 text-sm text-gray-500">{catName}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{currency} {price.toFixed(2)}</p>
            {originalPrice && originalPrice > price && (
              <p className="mt-1 text-sm text-gray-400 line-through">{currency} {originalPrice.toFixed(2)}</p>
            )}
          </div>
        </div>
      ) : variant === "with-cta" ? (
        <div className="mt-4">
          {showCategory && catName && <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{catName}</p>}
          <h3 className="mt-1 text-sm font-medium text-gray-900">{name}</h3>
          <p className="mt-1 text-sm text-gray-500">{currency} {price.toFixed(2)}</p>
          <p className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            {t(locale, "立即選購", "Shop now", "Comprar", "今すぐ購入")}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          {showCategory && catName && <p className="text-xs text-gray-500">{catName}</p>}
          <h3 className="text-sm text-gray-700">{name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900">{currency} {price.toFixed(2)}</p>
            {originalPrice && originalPrice > price && (
              <p className="text-sm text-gray-400 line-through">{currency} {originalPrice.toFixed(2)}</p>
            )}
          </div>
        </div>
      )}
    </a>
  );
}
