type TestimonialItem = { quote: string; quoteTranslations?: Record<string, string>; author: string; role?: string; avatar?: string; rating?: number };
type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default function Testimonials({ data, locale }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const items = (data.items as TestimonialItem[]) || [];

  if (items.length === 0) return null;

  return (
    <div className="bg-sf-surface py-12">
      <div className="max-w-[var(--sf-max-width)] mx-auto px-4">
        {title && <h2 className="text-2xl font-bold text-sf-text text-center mb-8">{title}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => {
            const quote = item.quoteTranslations?.[locale] || item.quote;
            return (
              <div key={i} className="bg-white rounded-[var(--radius-lg)] border border-sf-border p-6">
                {/* Stars */}
                {item.rating && (
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <svg key={s} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={s < item.rating! ? "#f59e0b" : "#e5e7eb"} stroke="none">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                )}
                <blockquote className="text-[14px] text-sf-text-secondary leading-relaxed italic">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <div className="mt-4 flex items-center gap-3">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.author} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-sf-accent-light flex items-center justify-center text-sf-accent font-semibold text-sm">
                      {item.author.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-[13px] font-semibold text-sf-text">{item.author}</p>
                    {item.role && <p className="text-[12px] text-sf-text-muted">{item.role}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
