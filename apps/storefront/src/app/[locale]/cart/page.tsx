import { getCart } from "@/lib/actions/cart";
import { getDisplayName } from "@macau-pos/database";
import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontConfig } from "@/lib/storefront-queries";
import { notFound } from "next/navigation";
import CartPageClient from "./client";

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [cart, tenant] = await Promise.all([getCart(), resolveTenant()]);
  if (!tenant) notFound();

  const config = await getStorefrontConfig(tenant.id);
  const branding = config.branding as Record<string, unknown>;
  const themeId = (branding?.themeId as string) || "modern";

  const items = (cart?.items || []).map((item) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    name: getDisplayName(item.name, item.translations, locale),
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    inStock: item.stock == null || item.stock > 0,
    maxQuantity: item.stock ?? 10,
  }));

  return <CartPageClient items={items} locale={locale} themeId={themeId} />;
}
