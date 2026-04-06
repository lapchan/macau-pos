type IncentiveItem = { icon?: string; title: string; titleTranslations?: Record<string, string>; description: string; descTranslations?: Record<string, string> };
type Props = { data: Record<string, unknown>; locale: string; tenantId: string; themeId?: string };

export default function IncentiveGrid({ data, locale, tenantId, themeId }: Props) {
  const items = (data.items as IncentiveItem[]) || [];
  if (items.length === 0) return null;

  /* ─── HUMAN MADE variant — skip incentives, keep homepage clean ─── */
  if (themeId === "humanmade") {
    return null;
  }

  return (
    <div className="bg-sf-surface border-y border-sf-border">
      <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-[var(--radius-md)] bg-sf-accent-light flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-sf-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon === "truck" && <><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></>}
                  {item.icon === "shield" && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
                  {item.icon === "clock" && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
                  {item.icon === "refresh" && <><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></>}
                  {(!item.icon || !["truck","shield","clock","refresh"].includes(item.icon)) && <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>}
                </svg>
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-sf-text">
                  {item.titleTranslations?.[locale] || item.title}
                </h3>
                <p className="text-[13px] text-sf-text-secondary mt-1 leading-relaxed">
                  {item.descTranslations?.[locale] || item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
