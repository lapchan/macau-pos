export function resolveStorefrontImage(src: string | null | undefined): string {
  if (!src) return "";
  if (!src.startsWith("/products/")) return src;
  const filename = src.split("/").pop() ?? "";
  const m = filename.match(/^(.*?)(\.(?:jpe?g|png|webp))$/i);
  if (!m) return src;
  const ascii = m[1]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!ascii) return src;
  return `/products/storefront/${ascii}${m[2].toLowerCase()}`;
}
