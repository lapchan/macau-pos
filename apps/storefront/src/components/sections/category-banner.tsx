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
    <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-10">
      {title && <h2 className="text-xl font-semibold text-sf-text mb-6">{title}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.slice(0, 6).map((cat) => {
          const name = getDisplayName(cat.name, cat.translations as Record<string, string>, locale);
          const bannerImage = bannerImages[cat.id];
          return (
            <a
              key={cat.id}
              href={cat.slug ? `/${locale}/categories/${cat.slug}` : `/${locale}/products`}
              className="group relative rounded-[var(--radius-lg)] overflow-hidden aspect-[16/9] bg-sf-surface"
            >
              {bannerImage ? (
                <img src={bannerImage} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-sf-accent/20 to-sf-accent/5" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-[16px] font-semibold text-white">{name}</h3>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
