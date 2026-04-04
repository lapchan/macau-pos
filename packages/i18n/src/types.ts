// ─── Supported Locales ─────────────────────────────────────
export type Locale = "tc" | "sc" | "en" | "pt" | "ja";

export const localeNames: Record<Locale, string> = {
  tc: "繁體中文",
  sc: "简体中文",
  en: "English",
  pt: "Português",
  ja: "日本語",
};

export const localeFlags: Record<Locale, string> = {
  tc: "🇭🇰",
  sc: "🇨🇳",
  en: "🇬🇧",
  pt: "🇵🇹",
  ja: "🇯🇵",
};

export const DEFAULT_LOCALE: Locale = "tc";
