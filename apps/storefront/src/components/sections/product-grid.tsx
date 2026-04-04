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
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  }[columns] || "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-10">
      {(title || showViewAll) && (
        <div className="flex items-center justify-between mb-6">
          <div>
            {title && <h2 className="text-xl font-semibold text-sf-text">{title}</h2>}
            {subtitle && <p className="text-[14px] text-sf-text-secondary mt-1">{subtitle}</p>}
          </div>
          {showViewAll && (
            <a href={viewAllLink} className="text-[13px] font-medium text-sf-accent hover:underline shrink-0">
              {locale === "en" ? "View All" : locale === "pt" ? "Ver Todos" : locale === "ja" ? "すべて見る" : "查看全部"} &rarr;
            </a>
          )}
        </div>
      )}
      <div className={`grid ${gridCols} gap-4`}>
        {products.map((product) => {
          const name = getDisplayName(product.name, product.translations as Record<string, string>, locale);
          const price = parseFloat(String(product.sellingPrice));
          const originalPrice = product.originalPrice ? parseFloat(String(product.originalPrice)) : null;
          const inStock = product.stock === null || product.stock > 0;

          return (
            <a
              key={product.id}
              href={product.slug ? `/${locale}/products/${product.slug}` : "#"}
              className="group block rounded-[var(--radius-lg)] border border-sf-border bg-white overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-sf-surface relative overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sf-text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                )}
                {!inStock && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <span className="text-[12px] font-medium text-sf-danger bg-sf-danger-light px-3 py-1 rounded-[var(--radius-full)]">
                      {locale === "en" ? "Sold Out" : locale === "pt" ? "Esgotado" : "售罄"}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-[13px] font-medium text-sf-text line-clamp-2 leading-snug">{name}</h3>
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="text-[15px] font-semibold text-sf-text">MOP {price.toFixed(2)}</span>
                  {originalPrice && originalPrice > price && (
                    <span className="text-[12px] text-sf-text-muted line-through">MOP {originalPrice.toFixed(2)}</span>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
