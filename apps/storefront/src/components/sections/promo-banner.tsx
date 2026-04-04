type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default function PromoBanner({ data, locale }: Props) {
  const text = ((data.textTranslations as Record<string, string>)?.[locale]) || (data.text as string) || "";
  const ctaText = ((data.ctaTranslations as Record<string, string>)?.[locale]) || (data.ctaText as string) || "";
  const ctaLink = (data.ctaLink as string) || `/${locale}/products`;
  const bgColor = (data.bgColor as string) || "var(--color-sf-accent)";
  const textColor = (data.textColor as string) || "#ffffff";

  if (!text) return null;

  return (
    <div className="py-3" style={{ backgroundColor: bgColor }}>
      <div className="max-w-[var(--sf-max-width)] mx-auto px-4 flex items-center justify-center gap-4 flex-wrap">
        <p className="text-[14px] font-medium text-center" style={{ color: textColor }}>{text}</p>
        {ctaText && (
          <a
            href={ctaLink}
            className="shrink-0 h-8 px-4 flex items-center rounded-[var(--radius-full)] text-[12px] font-semibold transition-opacity hover:opacity-90"
            style={{ backgroundColor: textColor, color: bgColor }}
          >
            {ctaText}
          </a>
        )}
      </div>
    </div>
  );
}
