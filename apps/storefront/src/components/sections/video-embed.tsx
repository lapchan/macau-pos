type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export default function VideoEmbed({ data, locale }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const url = data.url as string;
  const caption = ((data.captionTranslations as Record<string, string>)?.[locale]) || (data.caption as string) || "";

  if (!url) return null;
  const embedUrl = getEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {title && <h2 className="text-xl font-semibold text-sf-text mb-4">{title}</h2>}
      <div className="aspect-video rounded-[var(--radius-lg)] overflow-hidden bg-sf-surface">
        <iframe
          src={embedUrl}
          title={title || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
      {caption && <p className="text-[13px] text-sf-text-muted text-center mt-3">{caption}</p>}
    </div>
  );
}
