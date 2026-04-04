import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontConfig, getStorefrontCategories } from "@/lib/storefront-queries";
import type { Locale } from "@macau-pos/i18n";
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

  const config = await getStorefrontConfig(tenant.id);
  const categories = await getStorefrontCategories(tenant.id);

  const branding = config.branding as Record<string, unknown>;
  const accentColor = (branding?.accentColor as string) || tenant.accentColor || "#0071e3";

  // Derive hover color (slightly lighter)
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-sf-border">
        <div className="max-w-[var(--sf-max-width)] mx-auto px-4 h-[var(--sf-header-height)] flex items-center gap-4">
          {/* Logo / shop name */}
          <a href={`/${locale}`} className="flex items-center gap-2.5 shrink-0">
            <div
              className="h-9 w-9 rounded-[var(--radius-md)] flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: accentColor }}
            >
              {tenant.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[16px] font-semibold text-sf-text hidden sm:block">
              {tenant.name}
            </span>
          </a>

          {/* Category nav (desktop) */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            <a
              href={`/${locale}/products`}
              className="px-3 py-1.5 text-[13px] font-medium text-sf-text-secondary hover:text-sf-text rounded-[var(--radius-sm)] hover:bg-sf-surface-hover transition-colors"
            >
              {locale === "en" ? "All Products" : locale === "pt" ? "Produtos" : locale === "ja" ? "全商品" : "全部商品"}
            </a>
            {categories.slice(0, 5).map((cat) => {
              const name = (cat.translations as Record<string, string>)?.[locale] || cat.name;
              return (
                <a
                  key={cat.id}
                  href={cat.slug ? `/${locale}/categories/${cat.slug}` : `/${locale}/products`}
                  className="px-3 py-1.5 text-[13px] font-medium text-sf-text-secondary hover:text-sf-text rounded-[var(--radius-sm)] hover:bg-sf-surface-hover transition-colors"
                >
                  {name}
                </a>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Search (placeholder for now) */}
          <a
            href={`/${locale}/products`}
            className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-sm)] text-sf-text-secondary hover:bg-sf-surface-hover transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </a>

          {/* Cart icon */}
          <a
            href={`/${locale}/cart`}
            className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-sm)] text-sf-text-secondary hover:bg-sf-surface-hover transition-colors relative"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </a>

          {/* Account */}
          <a
            href={`/${locale}/account`}
            className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-sm)] text-sf-text-secondary hover:bg-sf-surface-hover transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="min-h-[calc(100vh-var(--sf-header-height))]">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-sf-surface border-t border-sf-border mt-16">
        <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="h-7 w-7 rounded-[var(--radius-sm)] flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: accentColor }}
              >
                {tenant.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[14px] font-medium text-sf-text-secondary">
                {tenant.name}
              </span>
            </div>
            <p className="text-[12px] text-sf-text-muted">
              &copy; {new Date().getFullYear()} {tenant.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
