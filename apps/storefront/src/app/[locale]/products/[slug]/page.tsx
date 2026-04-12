import type { Metadata } from "next";
import { resolveTenant } from "@/lib/tenant-resolver";
import { getProductBySlug, getStorefrontProducts, getStorefrontConfig, getColorVariants } from "@/lib/storefront-queries";
import { getDisplayName } from "@macau-pos/database";
import { notFound } from "next/navigation";
import ProductDetailClient from "./client";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  // Next.js 16 sometimes leaves percent-encoded bytes in the slug for
  // non-ASCII characters — decode defensively so DB lookups still match.
  const slug = safeDecode(rawSlug);
  const tenant = await resolveTenant();
  if (!tenant) return {};

  const product = await getProductBySlug(tenant.id, slug);
  if (!product) return {};

  const name = getDisplayName(product.name, product.translations as Record<string, string>, locale);
  const description = product.description
    ? getDisplayName(product.description, product.descTranslations as Record<string, string>, locale)
    : undefined;
  const price = Number(product.sellingPrice).toFixed(2);
  const image = product.image || undefined;

  return {
    title: name,
    description: description || `${name} — MOP $${price}`,
    openGraph: {
      title: name,
      description: description || `${name} — MOP $${price}`,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug: rawSlug } = await params;
  const slug = safeDecode(rawSlug);
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const [product, config] = await Promise.all([
    getProductBySlug(tenant.id, slug),
    getStorefrontConfig(tenant.id),
  ]);
  if (!product) notFound();

  const branding = config.branding as Record<string, unknown>;
  const themeId = (branding?.themeId as string) || "modern";

  // Parse images from JSONB
  const images = Array.isArray(product.images)
    ? (product.images as { url: string; alt?: string }[])
    : product.image
    ? [{ url: product.image, alt: product.name }]
    : [];

  // Fetch color variants (sibling products in the same variant group)
  const colorVariants = await getColorVariants(tenant.id, product.id);

  // Fetch related products (same category first, then popular fallback)
  let { products: related } = await getStorefrontProducts(tenant.id, {
    categorySlug: product.categorySlug || undefined,
    pageSize: 8,
    sortBy: "popular",
  });

  // Exclude current product
  related = related.filter((p) => p.id !== product.id);

  // If same category has too few, backfill with popular products
  if (related.length < 4) {
    const { products: popular } = await getStorefrontProducts(tenant.id, {
      pageSize: 8,
      sortBy: "popular",
    });
    const existingIds = new Set([product.id, ...related.map((p) => p.id)]);
    const backfill = popular.filter((p) => !existingIds.has(p.id));
    related = [...related, ...backfill];
  }

  const relatedProducts = related
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: (p.translations as Record<string, string>)?.[locale] || p.name,
      price: parseFloat(String(p.sellingPrice)),
      image: p.image,
    }));

  return (
    <ProductDetailClient
      product={{
        ...product,
        images,
        translations: product.translations as Record<string, string>,
        descTranslations: product.descTranslations as Record<string, string>,
        categoryTranslations: product.categoryTranslations as Record<string, string>,
      }}
      locale={locale}
      relatedProducts={relatedProducts}
      colorVariants={colorVariants}
      themeId={themeId}
    />
  );
}
