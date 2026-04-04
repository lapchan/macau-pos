"use client";

type Props = { data: Record<string, unknown>; locale: string; tenantId: string };

export default function Newsletter({ data, locale }: Props) {
  const title = ((data.titleTranslations as Record<string, string>)?.[locale]) || (data.title as string) || "";
  const subtitle = ((data.subtitleTranslations as Record<string, string>)?.[locale]) || (data.subtitle as string) || "";
  const placeholder = ((data.placeholderTranslations as Record<string, string>)?.[locale]) || (data.placeholder as string) || "email@example.com";
  const buttonText = locale === "en" ? "Subscribe" : locale === "pt" ? "Assinar" : locale === "ja" ? "登録" : "訂閱";

  return (
    <div className="bg-sf-surface py-12">
      <div className="max-w-lg mx-auto px-4 text-center">
        {title && <h2 className="text-xl font-bold text-sf-text">{title}</h2>}
        {subtitle && <p className="text-[14px] text-sf-text-secondary mt-2">{subtitle}</p>}
        <form
          onSubmit={(e) => { e.preventDefault(); /* TODO: newsletter signup action */ }}
          className="mt-5 flex gap-2"
        >
          <input
            type="email"
            placeholder={placeholder}
            required
            className="flex-1 h-11 px-4 rounded-[var(--radius-full)] border border-sf-border bg-white text-[14px] text-sf-text placeholder:text-sf-text-muted focus:outline-none focus:border-sf-accent focus:ring-1 focus:ring-sf-accent/30"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-[var(--radius-full)] bg-sf-accent text-white text-[14px] font-medium hover:bg-sf-accent-hover transition-colors shrink-0"
          >
            {buttonText}
          </button>
        </form>
      </div>
    </div>
  );
}
