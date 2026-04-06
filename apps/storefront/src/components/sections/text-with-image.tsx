import Image from "next/image";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default function TextWithImage({ data, locale }: Props) {
  const image = data.image as string | undefined;
  const heading = ((data.headingTranslations as Record<string, string>)?.[locale]) || (data.heading as string) || "";
  const body = ((data.bodyTranslations as Record<string, string>)?.[locale]) || (data.body as string) || "";
  const imagePosition = (data.imagePosition as string) || "right";
  const ctaText = ((data.ctaTranslations as Record<string, string>)?.[locale]) || (data.ctaText as string) || "";
  const ctaLink = (data.ctaLink as string) || "";

  return (
    <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-12">
      <div className={`flex flex-col ${imagePosition === "left" ? "md:flex-row-reverse" : "md:flex-row"} gap-8 items-center`}>
        <div className="flex-1">
          {heading && <h2 className="text-2xl font-bold text-sf-text">{heading}</h2>}
          {body && <p className="mt-4 text-[15px] text-sf-text-secondary leading-relaxed whitespace-pre-line">{body}</p>}
          {ctaText && ctaLink && (
            <a href={ctaLink} className="inline-flex items-center mt-4 text-[14px] font-medium text-sf-accent hover:underline">
              {ctaText} &rarr;
            </a>
          )}
        </div>
        <div className="flex-1 w-full">
          {image ? (
            <Image src={image} alt={heading} width={800} height={600} sizes="(max-width: 768px) 100vw, 50vw" className="w-full rounded-[var(--radius-lg)] object-cover aspect-[4/3]" />
          ) : (
            <div className="w-full aspect-[4/3] rounded-[var(--radius-lg)] bg-sf-surface" />
          )}
        </div>
      </div>
    </div>
  );
}
