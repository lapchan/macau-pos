import Image from "next/image";

type Feature = { title: string; titleTranslations?: Record<string, string>; description: string; descTranslations?: Record<string, string> };
type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default function FeatureSplit({ data, locale }: Props) {
  const image = data.image as string | undefined;
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const features = (data.features as Feature[]) || [];
  const imagePosition = (data.imagePosition as string) || "left";

  if (features.length === 0) return null;

  return (
    <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-12">
      <div className={`flex flex-col ${imagePosition === "right" ? "md:flex-row-reverse" : "md:flex-row"} gap-10 items-center`}>
        <div className="flex-1 w-full">
          {image ? (
            <div className="relative w-full aspect-[4/3]">
              <Image src={image} alt={title} fill sizes="(max-width: 768px) 100vw, 50vw" className="rounded-[var(--radius-lg)] object-cover" />
            </div>
          ) : (
            <div className="w-full aspect-[4/3] rounded-[var(--radius-lg)] bg-sf-surface" />
          )}
        </div>
        <div className="flex-1">
          {title && <h2 className="text-2xl font-bold text-sf-text mb-6">{title}</h2>}
          <dl className="space-y-5">
            {features.map((f, i) => (
              <div key={i}>
                <dt className="text-[15px] font-semibold text-sf-text">{f.titleTranslations?.[locale] || f.title}</dt>
                <dd className="text-[13px] text-sf-text-secondary mt-1 leading-relaxed">{f.descTranslations?.[locale] || f.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
