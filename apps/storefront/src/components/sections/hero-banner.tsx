type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default function HeroBanner({ data, locale }: Props) {
  const image = data.image as string | undefined;
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const subtitle = ((data.subtitleTranslations as Record<string, string>)?.[locale]) || (data.subtitle as string) || "";
  const ctaText = ((data.ctaTranslations as Record<string, string>)?.[locale]) || (data.ctaText as string) || "";
  const ctaLink = (data.ctaLink as string) || `/${locale}/products`;
  const overlayOpacity = (data.overlayOpacity as number) ?? 0.5;
  const height = (data.height as string) || "lg";

  const heightClass = {
    sm: "py-24 sm:py-32",
    md: "py-32 sm:py-40",
    lg: "py-32 sm:py-48 lg:py-56",
    xl: "py-32 sm:py-48 lg:py-64",
    full: "min-h-screen flex items-center",
  }[height] || "py-32 sm:py-48 lg:py-56";

  return (
    <div className="relative bg-gray-900">
      {/* Background image with overlay */}
      {image && (
        <>
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
            <img src={image} alt="" className="size-full object-cover" />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gray-900"
            style={{ opacity: overlayOpacity }}
          />
        </>
      )}

      {/* Content */}
      <div className={`relative mx-auto flex max-w-3xl flex-col items-center px-6 text-center ${heightClass} sm:px-12 lg:px-0`}>
        {title && (
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-4 text-xl text-white">
            {subtitle}
          </p>
        )}
        {ctaText && (
          <a
            href={ctaLink}
            className="mt-8 inline-block rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100"
          >
            {ctaText}
          </a>
        )}
      </div>
    </div>
  );
}
