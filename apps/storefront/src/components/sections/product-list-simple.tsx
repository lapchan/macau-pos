import { getDisplayName } from "@macau-pos/database";
import { getStorefrontProducts } from "@/lib/storefront-queries";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default async function ProductListSimple({ data, locale, tenantId }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const limit = (data.limit as number) || 6;

  const { products } = await getStorefrontProducts(tenantId, { pageSize: limit, sortBy: "newest" });
  if (products.length === 0) return null;

  return (
    <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-10">
      {title && <h2 className="text-xl font-semibold text-sf-text mb-6">{title}</h2>}
      <div className="divide-y divide-sf-border border border-sf-border rounded-[var(--radius-lg)] overflow-hidden">
        {products.map((product) => {
          const name = getDisplayName(product.name, product.translations as Record<string, string>, locale);
          const price = parseFloat(String(product.sellingPrice));
          return (
            <a
              key={product.id}
              href={product.slug ? `/${locale}/products/${product.slug}` : "#"}
              className="flex items-center gap-4 p-4 bg-white hover:bg-sf-surface-hover transition-colors"
            >
              <div className="h-16 w-16 rounded-[var(--radius-md)] bg-sf-surface overflow-hidden shrink-0">
                {product.image ? (
                  <img src={product.image} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sf-text-muted">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-medium text-sf-text truncate">{name}</h3>
                <p className="text-[13px] text-sf-text-secondary mt-0.5">
                  {getDisplayName(product.categoryName || "", product.categoryTranslations as Record<string, string>, locale)}
                </p>
              </div>
              <span className="text-[15px] font-semibold text-sf-text shrink-0">MOP {price.toFixed(2)}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
