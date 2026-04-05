/**
 * ProductFeatures — Tailwind Plus Product Feature sections
 *
 * 9 variants controlled by data.variant:
 *  - "image-grid"        : 2x2 image grid with feature descriptions
 *  - "header-images"     : Header + images + descriptions
 *  - "fading-image"      : Full-width image with fade overlay text
 *  - "wide-images"       : Wide landscape images with text
 *  - "split-image"       : Image left, features right (or vice versa)
 *  - "with-tabs"         : Tabbed feature sections
 *  - "alternating"       : Alternating image/text rows
 *  - "square-images"     : Square image grid
 *  - "tiered-images"     : Staggered/tiered image layout
 */

type FeatureItem = {
  title: string;
  description: string;
  image?: string;
  icon?: string;
};

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

const t = (locale: string, tc: string, en: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt: en, ja: en };
  return m[locale] || en;
};

export default function ProductFeatures({ data, locale }: Props) {
  const variant = (data.variant as string) || "split-image";
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const subtitle = ((data.subtitleTranslations as Record<string, string>)?.[locale]) || (data.subtitle as string) || "";
  const description = ((data.descriptionTranslations as Record<string, string>)?.[locale]) || (data.description as string) || "";
  const image = data.image as string;
  const features = (data.features as FeatureItem[]) || [];

  // ── Split image variant (default) ──────────────────────
  if (variant === "split-image" || variant === "wide-images") {
    const imageRight = (data.imagePosition as string) !== "left";
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 sm:py-32 lg:max-w-7xl lg:px-8">
          <div className="grid grid-cols-1 items-center gap-x-8 gap-y-16 lg:grid-cols-2">
            <div className={imageRight ? "" : "lg:order-2"}>
              {title && <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{title}</h2>}
              {subtitle && <p className="mt-4 text-gray-500">{subtitle}</p>}

              <dl className="mt-16 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-y-16 lg:gap-x-8">
                {features.map((feat, i) => (
                  <div key={i} className="border-t border-gray-200 pt-4">
                    <dt className="font-medium text-gray-900">{feat.title}</dt>
                    <dd className="mt-2 text-sm text-gray-500">{feat.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className={`overflow-hidden rounded-lg ${imageRight ? "" : "lg:order-1"}`}>
              {image ? (
                <img src={image} alt={title} className="aspect-square w-full rounded-lg bg-gray-100 object-cover" />
              ) : (
                <div className="aspect-square w-full rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Image grid variant ─────────────────────────────────
  if (variant === "image-grid" || variant === "square-images") {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 sm:py-32 lg:max-w-7xl lg:px-8">
          {title && <h2 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h2>}
          {subtitle && <p className="mt-4 max-w-3xl text-gray-500">{subtitle}</p>}

          <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat, i) => (
              <div key={i}>
                {feat.image && (
                  <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <img src={feat.image} alt={feat.title} className="size-full object-cover" />
                  </div>
                )}
                <h3 className="mt-4 text-sm font-medium text-gray-900">{feat.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Alternating sections ───────────────────────────────
  if (variant === "alternating") {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          {title && <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">{title}</h2>}
          {subtitle && <p className="mx-auto mt-4 max-w-2xl text-center text-gray-500">{subtitle}</p>}

          <div className="mt-16 space-y-24">
            {features.map((feat, i) => (
              <div key={i} className={`flex flex-col gap-8 lg:flex-row lg:items-center ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                <div className="lg:w-1/2">
                  {feat.image ? (
                    <img src={feat.image} alt={feat.title} className="w-full rounded-xl object-cover" />
                  ) : (
                    <div className="aspect-video w-full rounded-xl bg-gray-100" />
                  )}
                </div>
                <div className="lg:w-1/2">
                  <h3 className="text-2xl font-bold text-gray-900">{feat.title}</h3>
                  <p className="mt-4 text-gray-500">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Header + images + descriptions ─────────────────────
  if (variant === "header-images" || variant === "tiered-images") {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 sm:py-32 lg:max-w-7xl lg:px-8">
          <div className="max-w-3xl">
            {title && <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{title}</h2>}
            {description && <p className="mt-4 text-gray-500">{description}</p>}
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => (
              <div key={i} className="relative">
                {feat.image && (
                  <div className={`overflow-hidden rounded-lg bg-gray-100 ${variant === "tiered-images" && i === 0 ? "aspect-[4/3] sm:col-span-2 sm:row-span-2" : "aspect-square"}`}>
                    <img src={feat.image} alt={feat.title} className="size-full object-cover" />
                  </div>
                )}
                <h3 className="mt-4 text-base font-semibold text-gray-900">{feat.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Fading image ───────────────────────────────────────
  if (variant === "fading-image") {
    return (
      <div className="relative overflow-hidden bg-white">
        <div className="pt-16 pb-80 sm:pt-24 sm:pb-40 lg:pt-40 lg:pb-48">
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg">
              {title && <h2 className="text-4xl font-bold tracking-tight text-gray-900">{title}</h2>}
              {description && <p className="mt-4 text-xl text-gray-500">{description}</p>}
            </div>
          </div>
        </div>
        {image && (
          <div className="absolute inset-y-0 right-0 w-1/2">
            <img src={image} alt="" className="size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-white" />
          </div>
        )}
      </div>
    );
  }

  // ── Default: simple feature list ───────────────────────
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        {title && <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">{title}</h2>}
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-center text-gray-500">{subtitle}</p>}
        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <span className="text-lg">{feat.icon || "✨"}</span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-gray-900">{feat.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
