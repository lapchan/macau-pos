import { resolveTenant } from "@/lib/tenant-resolver";
import { getProductBySlug, getStorefrontProducts } from "@/lib/storefront-queries";
import { notFound } from "next/navigation";
import ProductDetailClient from "./client";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const product = await getProductBySlug(tenant.id, slug);
  if (!product) notFound();

  // Parse images from JSONB
  const images = Array.isArray(product.images)
    ? (product.images as { url: string; alt?: string }[])
    : product.image
    ? [{ url: product.image, alt: product.name }]
    : [];

  // Fetch related products (same category, exclude current)
  const { products: related } = await getStorefrontProducts(tenant.id, {
    categorySlug: product.categorySlug || undefined,
    pageSize: 4,
    sortBy: "popular",
  });

  const relatedProducts = related
    .filter((p) => p.id !== product.id)
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
    />
  );
}
