import Image from "next/image";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string; themeId?: string };

export default function FeaturedSection({ data, locale, tenantId, themeId }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const subtitle = ((data.subtitleTranslations as Record<string, string>)?.[locale]) || (data.subtitle as string) || "";
  const ctaText = ((data.ctaTranslations as Record<string, string>)?.[locale]) || (data.ctaText as string) || "";
  const ctaLink = (data.ctaLink as string) || `/${locale}/products`;
  const image = data.image as string;

  /* ─── HUMAN MADE variant — skip featured sections, keep homepage clean ─── */
  if (themeId === "humanmade") {
    // HUMAN MADE homepage is minimal — no featured promo sections
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-32 lg:px-8">
      <div className="relative overflow-hidden rounded-lg">
        {/* Background image */}
        <div className="absolute inset-0">
          {image ? (
            <Image src={image} alt="" fill sizes="100vw" className="object-cover" />
          ) : (
            <div className="size-full bg-gray-900" />
          )}
        </div>
        {/* Overlay */}
        <div className="relative bg-gray-900/75 px-6 py-32 sm:px-12 sm:py-40 lg:px-16">
          <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
            {title && (
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {title.split("\n").map((line, i) => (
                  <span key={i} className="block sm:inline">
                    {line}{" "}
                  </span>
                ))}
              </h2>
            )}
            {subtitle && (
              <p className="mt-3 text-xl text-white">{subtitle}</p>
            )}
            {ctaText && (
              <a
                href={ctaLink}
                className="mt-8 block w-full rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 sm:w-auto"
              >
                {ctaText}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
