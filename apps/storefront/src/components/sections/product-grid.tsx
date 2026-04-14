import Image from "@/components/shared/store-thumb";
import { getDisplayName } from "@macau-pos/database";
import { getStorefrontProducts } from "@/lib/storefront-queries";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string; themeId?: string };

export default async function ProductGrid({ data, locale, tenantId, themeId }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const subtitle = ((data.subtitleTranslations as Record<string, string>)?.[locale]) || (data.subtitle as string) || "";
  const columns = (data.columns as number) || 4;
  const limit = (data.limit as number) || 8;
  const sortBy = (data.sortBy as string) || "popular";
  const categorySlug = data.categorySlug as string | undefined;
  const viewAllLink = (data.viewAllLink as string) || `/${locale}/products`;
  const showViewAll = data.showViewAll !== false;

  const { products } = await getStorefrontProducts(tenantId, {
    pageSize: limit,
    sortBy: sortBy as any,
    categorySlug,
  });

  if (products.length === 0) return null;

  /* ─── HUMAN MADE variant ───
     From humanmade.jp CSS:
     - product-tile hover: scale(1.03), 0.5s ease
     - tile-image-overlay: bg-light, opacity 0→1 on hover
     - product-tile-name: line-clamp 2 (mobile) / 1 (desktop)
     - swatch: h-8px w-35px (rectangular color bars)
     - product-tile-batch: min-height 1.8rem (for NEW label)
     - fs-xs = 12px, ls-05 = letter-spacing 0.05em
     - body color: #121212
     - On homepage (#homepage): color-swatches + price hidden
  */
  if (themeId === "humanmade") {
    return (
      <div className="bg-white">
        <div className="w-full py-10 sm:py-14">
          {/* Title */}
          {title && (
            <h2
              className="mb-8 text-center text-[#121212] font-normal"
              style={{ fontSize: "32px", letterSpacing: "0.12em" }}
            >
              {title}
            </h2>
          )}

          {/* Product grid — 2 cols mobile, 4 cols desktop, zero gap like humanmade.jp */}
          <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: "0px" }}>
            {products.map((product) => {
              const name = getDisplayName(product.name, product.translations as Record<string, string>, locale);
              const price = parseFloat(String(product.sellingPrice));

              return (
                <a
                  key={product.id}
                  href={product.slug ? `/${locale}/products/${product.slug}` : "#"}
                  className="group block text-decoration-none"
                >
                  {/* Image — 1:1 square, white bg, object-contain like humanmade.jp */}
                  <div className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: "1/1" }}>
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-contain object-center transition-transform duration-500 ease-in-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center bg-[#f7f7f7] text-[#121212]/8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.3">
                          <rect width="18" height="18" x="3" y="3" rx="1" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="px-2 pt-2 pb-6">
                    {/* NEW badge */}
                    <div style={{ height: "17px" }}>
                      <span className="text-[#dc3545]" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>NEW</span>
                    </div>
                    {/* Product name — line-clamp-1 on desktop, 2 on mobile */}
                    <h3
                      className="text-[#121212] line-clamp-2 sm:line-clamp-1"
                      style={{ fontSize: "12px", letterSpacing: "0.05em", lineHeight: "1.5" }}
                    >
                      {name}
                    </h3>
                    {/* Price */}
                    <p className="mt-0.5 text-[#121212]" style={{ fontSize: "12px", letterSpacing: "0.05em" }}>
                      MOP${price.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                    </p>
                    {/* Color swatches — h-8px w-35px rectangular bars */}
                    <div className="mt-2 flex gap-px">
                      <span className="block bg-[#121212]" style={{ height: "8px", width: "35px" }} />
                      <span className="block bg-[#bbb]" style={{ height: "8px", width: "35px" }} />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* View all link */}
          {showViewAll && (
            <div className="mt-8 text-center">
              <a
                href={viewAllLink}
                className="text-[#121212]/60 hover:text-[#121212] transition-colors"
                style={{ fontSize: "12px", letterSpacing: "0.05em" }}
              >
                {locale === "en" ? "VIEW ALL" : locale === "pt" ? "VER TODOS" : locale === "ja" ? "すべて見る" : "查看全部"} →
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  }[columns] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="bg-white">
      <div className={`mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8 ${themeId === "classic" ? "py-8 sm:py-12" : "py-16 sm:py-24"}`}>
        {/* Header */}
        {(title || showViewAll) && (
          <div className="flex items-end justify-between">
            <div>
              {title && (
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
              )}
              {subtitle && (
                <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {showViewAll && (
              <a
                href={viewAllLink}
                className="hidden text-sm font-semibold text-sf-accent hover:text-sf-accent-hover sm:block"
              >
                {locale === "en" ? "Browse all products" : locale === "pt" ? "Ver todos" : locale === "ja" ? "すべて見る" : "查看全部"}
                <span aria-hidden="true"> &rarr;</span>
              </a>
            )}
          </div>
        )}

        {/* Product grid */}
        <div className={`mt-6 grid gap-x-6 gap-y-10 ${gridCols} xl:gap-x-8`}>
          {products.map((product) => {
            const name = getDisplayName(product.name, product.translations as Record<string, string>, locale);
            const price = parseFloat(String(product.sellingPrice));
            const originalPrice = product.originalPrice ? parseFloat(String(product.originalPrice)) : null;
            const inStock = product.stock === null || product.stock > 0;

            return (
              <a
                key={product.id}
                href={product.slug ? `/${locale}/products/${product.slug}` : "#"}
                className="group"
              >
                {/* Image */}
                <div className={`relative aspect-square w-full overflow-hidden bg-gray-100 group-hover:opacity-75 transition-opacity ${themeId === "classic" ? "" : "rounded-lg"}`}>
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className={themeId === "classic" ? "object-contain object-center p-2" : "object-cover object-center"}
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}
                  {!inStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                        {locale === "en" ? "Sold out" : locale === "pt" ? "Esgotado" : "售罄"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="mt-4 flex justify-between">
                  <div>
                    <h3 className="text-sm text-gray-700">
                      {name}
                    </h3>
                    {product.hasVariants && (
                      <p className="mt-1 text-sm text-gray-500">
                        {locale === "en" ? "Multiple options" : locale === "pt" ? "Várias opções" : locale === "ja" ? "複数オプション" : "多款可選"}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">MOP {price.toFixed(2)}</p>
                    {originalPrice && originalPrice > price && (
                      <p className="mt-1 text-sm text-gray-400 line-through">MOP {originalPrice.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Mobile view all link */}
        {showViewAll && (
          <div className="mt-8 text-sm sm:hidden">
            <a href={viewAllLink} className="font-semibold text-sf-accent hover:text-sf-accent-hover">
              {locale === "en" ? "Browse all products" : locale === "pt" ? "Ver todos" : locale === "ja" ? "すべて見る" : "查看全部"}
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
