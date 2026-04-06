import Image from "next/image";

type ContentBlock = { type: string; text?: string; level?: number; src?: string; alt?: string; caption?: string; items?: { q: string; a: string }[] };
type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default function RichText({ data, locale }: Props) {
  const content = ((data.contentTranslations as Record<string, ContentBlock[]>)?.[locale]) || (data.content as ContentBlock[]) || [];

  if (content.length === 0) return null;

  return (
    <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto prose prose-gray">
        {content.map((block, i) => {
          switch (block.type) {
            case "heading":
              const Tag = `h${block.level || 2}` as keyof React.JSX.IntrinsicElements;
              return <Tag key={i} className="text-sf-text font-bold mt-6 mb-3">{block.text}</Tag>;
            case "paragraph":
              return <p key={i} className="text-[15px] text-sf-text-secondary leading-relaxed mb-4">{block.text}</p>;
            case "image":
              return (
                <figure key={i} className="my-6">
                  <div className="relative w-full aspect-[16/9]">
                    <Image src={block.src!} alt={block.alt || ""} fill sizes="(max-width: 768px) 100vw, 768px" className="rounded-[var(--radius-lg)] object-cover" />
                  </div>
                  {block.caption && <figcaption className="text-[12px] text-sf-text-muted text-center mt-2">{block.caption}</figcaption>}
                </figure>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
