type FeatureItem = { icon?: string; title: string; titleTranslations?: Record<string, string>; description: string; descTranslations?: Record<string, string> };
type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

const ICONS: Record<string, string> = {
  truck: "M1 3.993C1 3.445 1.445 3 1.993 3h16.014c.548 0 .993.445.993.993v16.014a.994.994 0 01-.993.993H1.993A.994.994 0 011 20.007V3.993z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  clock: "M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  gift: "M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 110-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 100-5C13 2 12 7 12 7z",
  heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
};

export default function FeatureGrid({ data, locale }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const subtitle = ((data.subtitleTranslations as Record<string, string>)?.[locale]) || (data.subtitle as string) || "";
  const items = (data.items as FeatureItem[]) || [];
  const columns = (data.columns as number) || 3;

  if (items.length === 0) return null;

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[columns] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-12">
      {(title || subtitle) && (
        <div className="text-center mb-8">
          {title && <h2 className="text-2xl font-bold text-sf-text">{title}</h2>}
          {subtitle && <p className="text-[15px] text-sf-text-secondary mt-2 max-w-2xl mx-auto">{subtitle}</p>}
        </div>
      )}
      <div className={`grid ${gridCols} gap-6`}>
        {items.map((item, i) => {
          const itemTitle = item.titleTranslations?.[locale] || item.title;
          const itemDesc = item.descTranslations?.[locale] || item.description;
          return (
            <div key={i} className="text-center p-6">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-sf-accent-light flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-sf-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={ICONS[item.icon || "star"] || ICONS.star} />
                </svg>
              </div>
              <h3 className="text-[15px] font-semibold text-sf-text">{itemTitle}</h3>
              <p className="text-[13px] text-sf-text-secondary mt-2 leading-relaxed">{itemDesc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
