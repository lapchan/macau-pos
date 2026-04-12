function asciiStem(src: string): { ascii: string; ext: string } | null {
  const filename = src.split("/").pop() ?? "";
  const m = filename.match(/^(.*?)(\.(?:jpe?g|png|webp))$/i);
  if (!m) return null;
  const ascii = m[1]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!ascii) return null;
  return { ascii, ext: m[2].toLowerCase() };
}

export function resolveStorefrontImage(src: string | null | undefined): string {
  if (!src) return "";
  if (!src.startsWith("/products/")) return src;
  const parsed = asciiStem(src);
  if (!parsed) return src;
  return `/products/storefront/${parsed.ascii}${parsed.ext}`;
}

export function resolveStorefrontThumb(src: string | null | undefined): string {
  if (!src) return "";
  if (!src.startsWith("/products/")) return src;
  const parsed = asciiStem(src);
  if (!parsed) return src;
  return `/products/storefront/sm/${parsed.ascii}${parsed.ext}`;
}
