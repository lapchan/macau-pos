/**
 * ProductCard — Reusable product card component
 * Based on Tailwind Plus ecommerce product list patterns
 *
 * Variants:
 *  - "simple"       : Image + name + price
 *  - "with-inline"  : Image + name + price inline
 *  - "with-cta"     : Image + name + price + "Shop now" link
 *  - "tall"         : Tall image (5:6 aspect), name + price below
 *  - "wide"         : Horizontal layout (image left, info right)
 */

type Product = {
  id: string;
  slug: string | null;
  name: string;
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
  variant?: "simple" | "with-inline" | "with-cta" | "tall" | "wide";
  showCategory?: boolean;
  currency?: string;
};

function getDisplayName(name: string, translations?: Record<string, string> | null, locale?: string): string {
  if (locale && translations?.[locale]) return translations[locale];
  return name;
}

export default function ProductCard({ product, locale, variant = "simple", showCategory = false, currency = "MOP" }: Props) {
  const name = getDisplayName(product.name, product.translations as Record<string, string>, locale);
  const price = parseFloat(String(product.sellingPrice));
  const originalPrice = product.originalPrice ? parseFloat(String(product.originalPrice)) : null;
  const inStock = product.stock == null || product.stock > 0;
  const href = product.slug ? `/${locale}/products/${product.slug}` : "#";
  const catName = product.categoryName
    ? getDisplayName(product.categoryName, product.categoryTranslations as Record<string, string>, locale)
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
        {locale === "en" ? "Sold out" : locale === "pt" ? "Esgotado" : "售罄"}
      </span>
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
            <img src={product.image} alt={name} className="size-full object-cover object-center group-hover:opacity-75 transition-opacity" />
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
  // Image aspect ratio
  // ------------------------------------------------------------------
  const aspectClass = variant === "tall" ? "aspect-[5/6]" : "aspect-square";

  return (
    <a href={href} className="group">
      {/* Image */}
      <div className={`relative ${aspectClass} w-full overflow-hidden rounded-lg bg-gray-100 group-hover:opacity-75 transition-opacity`}>
        {product.image ? (
          <img src={product.image} alt={name} className="size-full object-cover object-center" />
        ) : (
          <ImagePlaceholder />
        )}
        {!inStock && <SoldOutBadge />}
      </div>

      {/* Info */}
      {variant === "with-inline" ? (
        // Inline layout: name left, price right
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
        // With CTA link
        <div className="mt-4">
          {showCategory && catName && <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{catName}</p>}
          <h3 className="mt-1 text-sm font-medium text-gray-900">{name}</h3>
          <p className="mt-1 text-sm text-gray-500">{currency} {price.toFixed(2)}</p>
          <p className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            {locale === "en" ? "Shop now" : locale === "pt" ? "Comprar" : locale === "ja" ? "今すぐ購入" : "立即選購"}
          </p>
        </div>
      ) : (
        // Simple (default)
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
