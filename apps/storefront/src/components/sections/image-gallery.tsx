import Image from "next/image";

type GalleryImage = { src: string; alt?: string; caption?: string };
type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default function ImageGallery({ data, locale }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const images = (data.images as GalleryImage[]) || [];
  const columns = (data.columns as number) || 3;

  if (images.length === 0) return null;

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }[columns] || "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-10">
      {title && <h2 className="text-xl font-semibold text-sf-text mb-6">{title}</h2>}
      <div className={`grid ${gridCols} gap-4`}>
        {images.map((img, i) => (
          <figure key={i} className="overflow-hidden rounded-[var(--radius-lg)]">
            <Image src={img.src} alt={img.alt || ""} width={600} height={600} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-300" />
            {img.caption && <figcaption className="text-[12px] text-sf-text-muted text-center mt-2">{img.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </div>
  );
}
