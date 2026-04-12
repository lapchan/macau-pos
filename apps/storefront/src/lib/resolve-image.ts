export function resolveStorefrontImage(src: string | null | undefined): string {
  if (!src) return "";
  return src.replace("/products/pos/", "/products/storefront/");
}
