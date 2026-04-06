import Image from "next/image";
import { getDisplayName } from "@macau-pos/database";
import { getStorefrontProducts } from "@/lib/storefront-queries";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default async function ProductCarousel({ data, locale, tenantId }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const subtitle = ((data.subtitleTranslations as Record<string, string>)?.[locale]) || (data.subtitle as string) || "";
  const limit = (data.limit as number) || 10;
  const sortBy = (data.sortBy as string) || "popular";
  const categorySlug = data.categorySlug as string | undefined;
  const viewAllLink = (data.viewAllLink as string) || `/${locale}/products`;

  const { products } = await getStorefrontProducts(tenantId, { pageSize: limit, sortBy: sortBy as any, categorySlug });
  if (products.length === 0) return null;

  return (
    <div className="bg-white">
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              {title && <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>}
              {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
            </div>
            <a href={viewAllLink} className="hidden text-sm font-semibold text-sf-accent hover:text-sf-accent-hover sm:block">
              {locale === "en" ? "See everything" : locale === "pt" ? "Ver tudo" : locale === "ja" ? "すべて見る" : "查看全部"}
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </div>
        </div>

        {/* Scrollable product row */}
        <div className="relative mt-8">
          <div className="flex space-x-6 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8 hide-scrollbar">
            {products.map((product) => {
              const name = getDisplayName(product.name, product.translations as Record<string, string>, locale);
              const price = parseFloat(String(product.sellingPrice));
              return (
                <a
                  key={product.id}
                  href={product.slug ? `/${locale}/products/${product.slug}` : "#"}
                  className="group relative shrink-0 w-56 sm:w-64"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 group-hover:opacity-75 transition-opacity">
                    {product.image ? (
                      <Image src={product.image} alt={name} fill sizes="(max-width: 640px) 224px, 256px" className="object-cover object-center" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm text-gray-700 line-clamp-1">{name}</h3>
                    <p className="mt-1 text-sm font-medium text-gray-900">MOP {price.toFixed(2)}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
