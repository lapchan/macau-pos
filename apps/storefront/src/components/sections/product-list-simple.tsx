import Image from "next/image";
import { getDisplayName } from "@macau-pos/database";
import { getStorefrontProducts } from "@/lib/storefront-queries";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default async function ProductListSimple({ data, locale, tenantId }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const limit = (data.limit as number) || 6;

  const { products } = await getStorefrontProducts(tenantId, { pageSize: limit, sortBy: "newest" });
  if (products.length === 0) return null;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {title && <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>}
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3">
          {products.map((product) => {
            const name = getDisplayName(product.name, product.translations as Record<string, string>, locale);
            const catName = product.categoryName
              ? getDisplayName(product.categoryName, product.categoryTranslations as Record<string, string>, locale)
              : "";
            const price = parseFloat(String(product.sellingPrice));

            return (
              <a
                key={product.id}
                href={product.slug ? `/${locale}/products/${product.slug}` : "#"}
                className="group relative flex items-center gap-x-6"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {product.image ? (
                    <Image src={product.image} alt={name} fill sizes="80px" className="object-cover object-center group-hover:opacity-75 transition-opacity" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    </div>
                  )}
                </div>
                <div className="flex-auto">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-sf-accent transition-colors">
                    {name}
                  </h3>
                  {catName && <p className="mt-0.5 text-sm text-gray-500">{catName}</p>}
                  <p className="mt-1 text-sm font-medium text-gray-900">MOP {price.toFixed(2)}</p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
