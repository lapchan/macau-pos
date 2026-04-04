import { getDisplayName } from "@macau-pos/database";
import { getStorefrontProducts } from "@/lib/storefront-queries";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default async function ProductCarousel({ data, locale, tenantId }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const limit = (data.limit as number) || 10;
  const sortBy = (data.sortBy as string) || "popular";
  const categorySlug = data.categorySlug as string | undefined;

  const { products } = await getStorefrontProducts(tenantId, { pageSize: limit, sortBy: sortBy as any, categorySlug });
  if (products.length === 0) return null;

  return (
    <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-10">
      {title && <h2 className="text-xl font-semibold text-sf-text mb-6">{title}</h2>}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
        {products.map((product) => {
          const name = getDisplayName(product.name, product.translations as Record<string, string>, locale);
          const price = parseFloat(String(product.sellingPrice));
          return (
            <a
              key={product.id}
              href={product.slug ? `/${locale}/products/${product.slug}` : "#"}
              className="group shrink-0 w-[180px] md:w-[220px] rounded-[var(--radius-lg)] border border-sf-border bg-white overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-sf-surface overflow-hidden">
                {product.image ? (
                  <img src={product.image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sf-text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-[13px] font-medium text-sf-text line-clamp-1">{name}</h3>
                <span className="text-[14px] font-semibold text-sf-text mt-1 block">MOP {price.toFixed(2)}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
