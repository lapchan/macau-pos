import { notFound } from "next/navigation";

const VALID_LOCALES = ["tc", "sc", "en", "pt", "ja"];

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!VALID_LOCALES.includes(locale)) notFound();

  const heading = t(locale, "最新消息", "News", "Notícias", "ニュース");
  const comingSoon = t(locale, "即將推出", "Coming soon", "Em breve", "近日公開");
  const body = t(
    locale,
    "我們正在籌備精彩內容，敬請期待。",
    "We're putting together something great. Please check back soon.",
    "Estamos a preparar algo ótimo. Volte em breve.",
    "現在コンテンツを準備中です。もうしばらくお待ちください。"
  );
  const backLabel = t(locale, "返回首頁", "Back to home", "Voltar ao início", "ホームに戻る");

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl text-center">
        <p
          className="text-sm font-semibold uppercase tracking-widest"
          style={{ color: "var(--tenant-accent, #111)" }}
        >
          {comingSoon}
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          {heading}
        </h1>
        <p className="mt-6 text-base leading-7 text-gray-600">{body}</p>
        <div className="mt-10">
          <a
            href={`/${locale}`}
            className="inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            style={{ backgroundColor: "var(--tenant-accent, #111)" }}
          >
            {backLabel}
            <span aria-hidden="true" className="ml-2">&rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
