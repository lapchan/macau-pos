type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default function HeroBanner({ data, locale }: Props) {
  const image = data.image as string | undefined;
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const subtitle = ((data.subtitleTranslations as Record<string, string>)?.[locale]) || (data.subtitle as string) || "";
  const ctaText = ((data.ctaTranslations as Record<string, string>)?.[locale]) || (data.ctaText as string) || "";
  const ctaLink = (data.ctaLink as string) || `/${locale}/products`;
  const overlayOpacity = (data.overlayOpacity as number) ?? 0.4;
  const height = (data.height as string) || "lg"; // sm, md, lg, xl

  const heightClass = {
    sm: "py-12 md:py-16",
    md: "py-16 md:py-24",
    lg: "py-20 md:py-32",
    xl: "py-28 md:py-40",
  }[height] || "py-20 md:py-32";

  return (
    <div className="relative overflow-hidden">
      {image ? (
        <>
          <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
        </>
      ) : (
        <div className="absolute inset-0 bg-sf-surface" />
      )}
      <div className={`relative max-w-[var(--sf-max-width)] mx-auto px-4 ${heightClass} text-center`}>
        {title && (
          <h1 className={`text-3xl md:text-5xl font-bold tracking-tight ${image ? "text-white" : "text-sf-text"}`}>
            {title}
          </h1>
        )}
        {subtitle && (
          <p className={`mt-3 text-[16px] md:text-[18px] max-w-xl mx-auto ${image ? "text-white/80" : "text-sf-text-secondary"}`}>
            {subtitle}
          </p>
        )}
        {ctaText && (
          <a
            href={ctaLink}
            className="inline-flex items-center justify-center h-11 px-6 mt-6 rounded-[var(--radius-full)] bg-sf-accent text-white text-[14px] font-medium hover:bg-sf-accent-hover transition-colors"
          >
            {ctaText}
          </a>
        )}
      </div>
    </div>
  );
}
