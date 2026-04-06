import Image from "next/image";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default function SplitPromo({ data, locale }: Props) {
  const image = data.image as string | undefined;
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const body = ((data.bodyTranslations as Record<string, string>)?.[locale]) || (data.body as string) || "";
  const ctaText = ((data.ctaTranslations as Record<string, string>)?.[locale]) || (data.ctaText as string) || "";
  const ctaLink = (data.ctaLink as string) || `/${locale}/products`;
  const imagePosition = (data.imagePosition as string) || "right";

  return (
    <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-12">
      <div className={`flex flex-col ${imagePosition === "left" ? "md:flex-row-reverse" : "md:flex-row"} gap-8 md:gap-12 items-center`}>
        {/* Text */}
        <div className="flex-1">
          {title && <h2 className="text-2xl md:text-3xl font-bold text-sf-text">{title}</h2>}
          {body && <p className="mt-4 text-[15px] text-sf-text-secondary leading-relaxed">{body}</p>}
          {ctaText && (
            <a
              href={ctaLink}
              className="inline-flex items-center justify-center h-10 px-5 mt-6 rounded-[var(--radius-full)] bg-sf-accent text-white text-[13px] font-medium hover:bg-sf-accent-hover transition-colors"
            >
              {ctaText}
            </a>
          )}
        </div>
        {/* Image */}
        <div className="flex-1 w-full">
          {image ? (
            <Image src={image} alt={title} width={800} height={600} sizes="(max-width: 768px) 100vw, 50vw" className="w-full rounded-[var(--radius-lg)] object-cover aspect-[4/3]" />
          ) : (
            <div className="w-full aspect-[4/3] rounded-[var(--radius-lg)] bg-sf-surface flex items-center justify-center text-sf-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
