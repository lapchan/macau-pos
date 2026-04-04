/**
 * Get the display name for a product/category.
 *
 * Logic:
 * - If translations[locale] exists → show translation
 * - Otherwise → show name as-is (the merchant's default name)
 *
 * The `name` is NOT tied to any language — it's just the name.
 * Translations are optional alternatives for specific locales.
 */
export function getDisplayName(
  name: string,
  translations: Record<string, string> | null | undefined,
  locale: string
): string {
  if (translations && locale in translations && translations[locale]) {
    return translations[locale];
  }
  return name;
}
