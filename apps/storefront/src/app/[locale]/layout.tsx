import type { Metadata } from "next";
import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontConfig, getStorefrontCategories } from "@/lib/storefront-queries";
import { getCart } from "@/lib/actions/cart";
import { getCurrentCustomer } from "@/lib/actions/auth";
import { getDisplayName } from "@macau-pos/database";
import StoreHeader from "@/components/layout/store-header";
import StoreFooter from "@/components/layout/store-footer";
import CookieBanner from "@/components/layout/cookie-banner";
import PendingPaymentBar from "@/components/layout/pending-payment-bar";
import { notFound } from "next/navigation";

const VALID_LOCALES = ["tc", "sc", "en", "pt", "ja"];

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenant();
  if (!tenant) return {};

  const config = await getStorefrontConfig(tenant.id);
  const branding = config.branding as Record<string, unknown>;

  const seoTitle = (branding?.seoTitle as string) || tenant.name;
  const seoDescription = (branding?.seoDescription as string) || `Shop at ${tenant.name}`;
  const ogImage = (branding?.ogImage as string) || undefined;

  const favicon = (branding?.favicon as string) || undefined;

  return {
    title: {
      template: `%s | ${tenant.name}`,
      default: seoTitle,
    },
    description: seoDescription,
    ...(favicon ? { icons: { icon: favicon } } : {}),
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      siteName: tenant.name,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
  };
}

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

  const [config, categories, cart, customer] = await Promise.all([
    getStorefrontConfig(tenant.id),
    getStorefrontCategories(tenant.id),
    getCart(),
    getCurrentCustomer(),
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
  const accentLight = accentColor + "15";
  const headerConfig = config.header as Record<string, unknown>;
  const headerStyle = (branding?.headerStyle as string) || "dark";
  const customNavLinks = (headerConfig?.navLinks as { label: string; href: string }[]) || [];
  const fontFamily = (branding?.fontFamily as string) || "inter";
  const borderRadius = (branding?.borderRadius as string) || "md";
  const themeId = (branding?.themeId as string) || "modern";

  // Map border radius to CSS values
  const radiusMap: Record<string, string> = { none: "0px", sm: "4px", md: "8px", lg: "16px" };
  const radiusValue = radiusMap[borderRadius] || "8px";

  // Map font family to CSS
  const fontMap: Record<string, string> = {
    inter: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    "dm-sans": '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    avenir: '"avenir-next-lt-pro", "Avenir Next", -apple-system, BlinkMacSystemFont, sans-serif',
  };
  const fontValue = fontMap[fontFamily] || fontMap.inter;

  // Announcement bar config
  const announcementBar = branding?.announcementBar as { enabled?: boolean; text?: string; link?: string; bgColor?: string; textColor?: string } | undefined;
  const showAnnouncement = announcementBar?.enabled !== false; // show by default
  const announcementText = announcementBar?.text || "Welcome to our store";
  const announcementLink = announcementBar?.link || "";
  const announcementBg = announcementBar?.bgColor || accentColor;
  const announcementTextColor = announcementBar?.textColor || "#ffffff";

  const useAvenir = fontFamily === "avenir";

  return (
    <div
      style={{
        "--tenant-accent": accentColor,
        "--tenant-accent-hover": accentHover,
        "--tenant-accent-light": accentLight,
        "--radius-sm": radiusValue,
        "--radius-md": radiusValue,
        "--font-sans": fontValue,
        ...(useAvenir ? { letterSpacing: "0.03em" } : {}),
      } as React.CSSProperties}
    >
      {useAvenir && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href="https://use.typekit.net/fmb3drh.css" />
      )}

      <CookieBanner locale={locale} themeId={themeId} />

      <PendingPaymentBar locale={locale} />

      {/* Announcement bar — hidden for humanmade theme */}
      {showAnnouncement && themeId !== "humanmade" && (
        announcementLink ? (
          <a
            href={announcementLink}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: announcementBg, color: announcementTextColor }}
          >
            <span>{announcementText}</span>
            <svg className="size-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </a>
        ) : (
          <div
            className="flex items-center justify-center px-4 py-2.5 text-sm font-medium"
            style={{ backgroundColor: announcementBg, color: announcementTextColor }}
          >
            <span>{announcementText}</span>
          </div>
        )
      )}

      <StoreHeader
        locale={locale}
        tenantName={tenant.name}
        tenantLogo={(branding?.logo as string) || null}
        accentColor={accentColor}
        headerStyle={headerStyle as "dark" | "light"}
        themeId={themeId}
        categories={categories as any}
        customNavLinks={customNavLinks}
        cartCount={cartCount}
        cartItems={cartItems}
        customer={customer ? { name: customer.name } : null}
      />

      <main>{children}</main>

      <StoreFooter
        locale={locale}
        tenantName={tenant.name}
        categories={categories as any}
        accentColor={accentColor}
        themeId={themeId}
      />
    </div>
  );
}
