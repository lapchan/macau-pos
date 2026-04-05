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
  const headerConfig = config.header as Record<string, unknown>;
  const headerStyle = (branding?.headerStyle as string) || "dark";
  const customNavLinks = (headerConfig?.navLinks as { label: string; href: string }[]) || [];
  const fontFamily = (branding?.fontFamily as string) || "inter";
  const borderRadius = (branding?.borderRadius as string) || "md";

  // Map border radius to CSS values
  const radiusMap: Record<string, string> = { none: "0px", sm: "4px", md: "8px", lg: "16px" };
  const radiusValue = radiusMap[borderRadius] || "8px";

  // Map font family to CSS
  const fontMap: Record<string, string> = {
    inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    "dm-sans": '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };
  const fontValue = fontMap[fontFamily] || fontMap.inter;

  return (
    <div
      style={{
        "--tenant-accent": accentColor,
        "--tenant-accent-hover": accentHover,
        "--tenant-accent-light": accentLight,
        "--radius-sm": radiusValue,
        "--radius-md": radiusValue,
        "--font-sans": fontValue,
      } as React.CSSProperties}
    >
      <StoreHeader
        locale={locale}
        tenantName={tenant.name}
        tenantLogo={(branding?.logo as string) || null}
        accentColor={accentColor}
        headerStyle={headerStyle as "dark" | "light"}
        categories={categories as any}
        customNavLinks={customNavLinks}
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
