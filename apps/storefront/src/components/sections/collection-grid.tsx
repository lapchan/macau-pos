type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

type CollectionItem = {
  title: string;
  titleTranslations?: Record<string, string>;
  description: string;
  descriptionTranslations?: Record<string, string>;
  image: string;
  href: string;
};

export default function CollectionGrid({ data, locale }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const subtitle = ((data.subtitleTranslations as Record<string, string>)?.[locale]) || (data.subtitle as string) || "";
  const items = (data.items as CollectionItem[]) || [];

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="collection-heading" className="mx-auto max-w-xl px-4 pt-24 sm:px-6 sm:pt-32 lg:max-w-7xl lg:px-8">
      {title && (
        <h2 id="collection-heading" className="text-2xl font-bold tracking-tight text-gray-900">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mt-4 text-base text-gray-500">{subtitle}</p>
      )}

      <div className="mt-10 space-y-12 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:space-y-0">
        {items.map((item, i) => {
          const itemTitle = item.titleTranslations?.[locale] || item.title;
          const itemDesc = item.descriptionTranslations?.[locale] || item.description;
          return (
            <a key={i} href={item.href || `/${locale}/products`} className="group block">
              <div className="aspect-[3/2] w-full overflow-hidden rounded-lg lg:aspect-[5/6]">
                <img
                  src={item.image}
                  alt={itemTitle}
                  className="size-full object-cover group-hover:opacity-75 transition-opacity"
                />
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900">{itemTitle}</h3>
              {itemDesc && <p className="mt-2 text-sm text-gray-500">{itemDesc}</p>}
            </a>
          );
        })}
      </div>
    </section>
  );
}
