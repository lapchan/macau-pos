import { getDisplayName } from "@macau-pos/database";
import { getStorefrontProducts } from "@/lib/storefront-queries";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default async function ProductGrid({ data, locale, tenantId }: Props) {
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

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  }[columns] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
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
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 group-hover:opacity-75 transition-opacity">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={name}
                      className="size-full object-cover object-center"
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
