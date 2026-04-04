import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontConfig, getStorefrontCategories } from "@/lib/storefront-queries";
import { getCart } from "@/lib/actions/cart";
import { getDisplayName } from "@macau-pos/database";
import StoreHeader from "@/components/layout/store-header";
import StoreFooter from "@/components/layout/store-footer";
import { notFound } from "next/navigation";

const VALID_LOCALES = ["tc", "sc", "en", "pt", "ja"];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!VALID_LOCALES.includes(locale)) {
    notFound();
  }

  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const [config, categories, cart] = await Promise.all([
    getStorefrontConfig(tenant.id),
    getStorefrontCategories(tenant.id),
    getCart(),
  ]);

  const cartCount = cart?.itemCount || 0;
  const cartItems = (cart?.items || []).map((item) => ({
    id: item.id,
    name: getDisplayName(item.name, item.translations, locale),
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    slug: item.slug,
  }));

  const branding = config.branding as Record<string, unknown>;
  const accentColor = (branding?.accentColor as string) || tenant.accentColor || "#0071e3";
  const accentHover = accentColor + "dd";
  const accentLight = accentColor + "10";

  return (
    <div
      style={{
        "--tenant-accent": accentColor,
        "--tenant-accent-hover": accentHover,
        "--tenant-accent-light": accentLight,
      } as React.CSSProperties}
    >
      <StoreHeader
        locale={locale}
        tenantName={tenant.name}
        tenantLogo={(branding?.logo as string) || null}
        accentColor={accentColor}
        categories={categories as any}
        cartCount={cartCount}
        cartItems={cartItems}
      />

      <main>{children}</main>

      <StoreFooter
        locale={locale}
        tenantName={tenant.name}
        categories={categories as any}
      />
    </div>
  );
}
