import Image from "next/image";
import { getDisplayName } from "@macau-pos/database";
import { getStorefrontCategories } from "@/lib/storefront-queries";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default async function CategoryBanner({ data, locale, tenantId }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const categoryIds = data.categoryIds as string[] | undefined;
  const bannerImages = (data.bannerImages as Record<string, string>) || {};

  let categories = await getStorefrontCategories(tenantId);
  if (categoryIds?.length) categories = categories.filter((c) => categoryIds.includes(c.id));
  if (categories.length === 0) return null;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {title && (
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
        )}
        <div className="mt-6 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:space-y-0">
          {categories.slice(0, 3).map((cat) => {
            const name = getDisplayName(cat.name, cat.translations as Record<string, string>, locale);
            const bannerImage = bannerImages[cat.id];
            return (
              <a
                key={cat.id}
                href={cat.slug ? `/${locale}/categories/${cat.slug}` : `/${locale}/products`}
                className="group block"
              >
                <div className="relative h-80 w-full overflow-hidden rounded-lg sm:aspect-[2/1] sm:h-auto lg:aspect-square">
                  {bannerImage ? (
                    <Image
                      src={bannerImage}
                      alt={name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover object-center group-hover:opacity-75 transition-opacity"
                    />
                  ) : (
                    <div className="size-full bg-gradient-to-br from-gray-200 to-gray-300 group-hover:opacity-75 transition-opacity" />
                  )}
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">{name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {locale === "en" ? "Shop the collection" : locale === "pt" ? "Ver coleção" : locale === "ja" ? "コレクションを見る" : "瀏覽系列"}
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
