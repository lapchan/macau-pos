import { getDisplayName } from "@macau-pos/database";
import { getStorefrontCategories } from "@/lib/storefront-queries";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default async function CategoryGrid({ data, locale, tenantId }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const subtitle = ((data.subtitleTranslations as Record<string, string>)?.[locale]) || (data.subtitle as string) || "";
  const columns = (data.columns as number) || 3;
  const categoryIds = data.categoryIds as string[] | undefined;

  let categories = await getStorefrontCategories(tenantId);
  if (categoryIds?.length) categories = categories.filter((c) => categoryIds.includes(c.id));
  if (categories.length === 0) return null;

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Header */}
        {(title || subtitle) && (
          <div className="sm:flex sm:items-baseline sm:justify-between">
            <div>
              {title && <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>}
              {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
        )}

        {/* Category tiles — Tailwind UI style with overlapping images */}
        <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 lg:gap-8">
          {categories.slice(0, columns === 6 ? 6 : columns * 2).map((cat, i) => {
            const name = getDisplayName(cat.name, cat.translations as Record<string, string>, locale);
            const isLarge = i === 0 && columns >= 3;

            return (
              <a
                key={cat.id}
                href={cat.slug ? `/${locale}/categories/${cat.slug}` : `/${locale}/products`}
                className={`group relative overflow-hidden rounded-lg ${isLarge ? "sm:col-span-2 sm:row-span-2 sm:aspect-[2/1] lg:aspect-square" : "aspect-[3/2]"}`}
              >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />

                {/* Accent overlay */}
                <div className="absolute inset-0 bg-sf-accent/10 mix-blend-multiply" />

                {/* Decorative circle */}
                <div className="absolute -right-12 -top-12 size-48 rounded-full bg-white/5" />
                <div className="absolute -left-8 -bottom-8 size-32 rounded-full bg-white/5" />

                {/* Content */}
                <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
                  <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-white/10 text-white text-lg font-bold backdrop-blur-sm">
                    {name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-300 group-hover:text-white transition-colors">
                    {locale === "en" ? "Shop now" : locale === "pt" ? "Comprar" : locale === "ja" ? "今すぐ購入" : "立即選購"}
                    <span aria-hidden="true"> &rarr;</span>
                  </p>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-sf-accent/0 group-hover:bg-sf-accent/10 transition-colors" />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
