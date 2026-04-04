import { getDisplayName } from "@macau-pos/database";
import { getStorefrontCategories } from "@/lib/storefront-queries";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

// Placeholder images for categories (gradient backgrounds with icons)
const CATEGORY_COLORS = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-sky-500 to-blue-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-yellow-600",
];

export default async function CategoryScroll({ data, locale, tenantId }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const showBrowseAll = data.showBrowseAll !== false;

  const categories = await getStorefrontCategories(tenantId);
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="category-heading" className="pt-24 sm:pt-32 xl:mx-auto xl:max-w-7xl xl:px-8">
      <div className="px-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8 xl:px-0">
        {title && (
          <h2 id="category-heading" className="text-2xl font-bold tracking-tight text-gray-900">
            {title}
          </h2>
        )}
        {showBrowseAll && (
          <a href={`/${locale}/products`} className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-500 sm:block">
            {t(locale, "瀏覽所有分類", "Browse all categories", "Ver todas as categorias", "すべてのカテゴリー")}
            <span aria-hidden="true"> &rarr;</span>
          </a>
        )}
      </div>

      <div className="mt-4 flow-root">
        <div className="-my-2">
          <div className="relative box-content h-80 overflow-x-auto py-2 xl:overflow-visible">
            <div className="absolute flex space-x-8 px-4 sm:px-6 lg:px-8 xl:relative xl:grid xl:grid-cols-5 xl:gap-x-8 xl:space-x-0 xl:px-0">
              {categories.slice(0, 5).map((cat, i) => {
                const name = getDisplayName(cat.name, cat.translations as Record<string, string>, locale);
                const colorClass = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

                return (
                  <a
                    key={cat.id}
                    href={cat.slug ? `/${locale}/categories/${cat.slug}` : `/${locale}/products`}
                    className="relative flex h-80 w-56 flex-col overflow-hidden rounded-lg p-6 hover:opacity-75 xl:w-auto"
                  >
                    {/* Gradient background */}
                    <span aria-hidden="true" className="absolute inset-0">
                      <div className={`size-full bg-gradient-to-br ${colorClass}`} />
                    </span>
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-800 opacity-50" />
                    <span className="relative mt-auto text-center text-xl font-bold text-white">{name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showBrowseAll && (
        <div className="mt-6 px-4 sm:hidden">
          <a href={`/${locale}/products`} className="block text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            {t(locale, "瀏覽所有分類", "Browse all categories", "Ver todas as categorias", "すべてのカテゴリー")}
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
      )}
    </section>
  );
}
