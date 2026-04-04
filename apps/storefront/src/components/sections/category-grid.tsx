import { getDisplayName } from "@macau-pos/database";
import { getStorefrontCategories } from "@/lib/storefront-queries";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default async function CategoryGrid({ data, locale, tenantId }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const columns = (data.columns as number) || 3;
  const categoryIds = data.categoryIds as string[] | undefined;

  let categories = await getStorefrontCategories(tenantId);
  if (categoryIds?.length) {
    categories = categories.filter((c) => categoryIds.includes(c.id));
  }
  if (categories.length === 0) return null;

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
    6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
  }[columns] || "grid-cols-2 sm:grid-cols-3";

  return (
    <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-10">
      {title && <h2 className="text-xl font-semibold text-sf-text mb-6">{title}</h2>}
      <div className={`grid ${gridCols} gap-3`}>
        {categories.map((cat) => {
          const name = getDisplayName(cat.name, cat.translations as Record<string, string>, locale);
          const image = (cat as any).image as string | undefined;
          return (
            <a
              key={cat.id}
              href={cat.slug ? `/${locale}/categories/${cat.slug}` : `/${locale}/products`}
              className="group relative flex flex-col items-center gap-3 p-6 rounded-[var(--radius-lg)] bg-sf-surface hover:bg-sf-surface-hover border border-sf-border transition-all text-center overflow-hidden"
            >
              {image ? (
                <img src={image} alt={name} className="h-16 w-16 object-cover rounded-full" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-sf-accent-light flex items-center justify-center text-sf-accent font-bold text-lg">
                  {name.charAt(0)}
                </div>
              )}
              <span className="text-[14px] font-medium text-sf-text group-hover:text-sf-accent transition-colors">{name}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
