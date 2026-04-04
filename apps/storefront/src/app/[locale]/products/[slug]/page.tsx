import { resolveTenant } from "@/lib/tenant-resolver";
import { getProductBySlug } from "@/lib/storefront-queries";
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
    />
  );
}
