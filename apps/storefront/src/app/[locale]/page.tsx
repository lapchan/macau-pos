import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontProducts, getStorefrontCategories, getStorefrontConfig } from "@/lib/storefront-queries";
import { notFound } from "next/navigation";
import type { Locale } from "@macau-pos/i18n";
import { getDisplayName } from "@macau-pos/database";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const [{ products }, categories] = await Promise.all([
    getStorefrontProducts(tenant.id, { pageSize: 12, sortBy: "popular" }),
    getStorefrontCategories(tenant.id),
  ]);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      shopNow: { tc: "立即選購", sc: "立即选购", en: "Shop Now", pt: "Comprar", ja: "今すぐ購入" },
      featuredProducts: { tc: "精選商品", sc: "精选商品", en: "Featured Products", pt: "Produtos em Destaque", ja: "おすすめ商品" },
      browseByCategory: { tc: "按分類瀏覽", sc: "按分类浏览", en: "Browse by Category", pt: "Navegar por Categoria", ja: "カテゴリーで探す" },
      viewAll: { tc: "查看全部", sc: "查看全部", en: "View All", pt: "Ver Todos", ja: "すべて見る" },
      outOfStock: { tc: "售罄", sc: "售罄", en: "Sold Out", pt: "Esgotado", ja: "売り切れ" },
    };
    return translations[key]?.[locale] || translations[key]?.en || key;
  };

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-sf-surface">
        <div className="max-w-[var(--sf-max-width)] mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-sf-text tracking-tight">
            {tenant.name}
          </h1>
          <p className="text-sf-text-secondary mt-3 text-[16px] md:text-[18px] max-w-lg mx-auto">
            {locale === "en"
              ? "Quality products, delivered to your door"
              : locale === "pt"
                ? "Produtos de qualidade, entregues na sua porta"
                : locale === "ja"
                  ? "品質の高い商品をお届けします"
                  : "優質商品，送到你家門口"}
          </p>
          <a
            href={`/${locale}/products`}
            className="inline-flex items-center justify-center h-11 px-6 mt-6 rounded-[var(--radius-full)] bg-sf-accent text-white text-[14px] font-medium hover:bg-sf-accent-hover transition-colors"
          >
            {t("shopNow")}
          </a>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-[var(--sf-max-width)] mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-sf-text">{t("browseByCategory")}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat) => {
              const name = getDisplayName(cat.name, cat.translations as Record<string, string>, locale);
              return (
                <a
                  key={cat.id}
                  href={cat.slug ? `/${locale}/categories/${cat.slug}` : `/${locale}/products`}
                  className="flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] bg-sf-surface hover:bg-sf-surface-hover border border-sf-border transition-colors text-center"
                >
                  <div className="h-10 w-10 rounded-full bg-sf-accent-light flex items-center justify-center text-sf-accent font-bold text-sm">
                    {name.charAt(0)}
                  </div>
                  <span className="text-[13px] font-medium text-sf-text-secondary">{name}</span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="max-w-[var(--sf-max-width)] mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-sf-text">{t("featuredProducts")}</h2>
          <a
            href={`/${locale}/products`}
            className="text-[13px] font-medium text-sf-accent hover:underline"
          >
            {t("viewAll")} &rarr;
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => {
            const name = getDisplayName(product.name, product.translations as Record<string, string>, locale);
            const price = parseFloat(String(product.sellingPrice));
            const originalPrice = product.originalPrice ? parseFloat(String(product.originalPrice)) : null;
            const inStock = product.stock === null || product.stock > 0;
            const imageUrl = product.image || "/placeholder.svg";

            return (
              <a
                key={product.id}
                href={product.slug ? `/${locale}/products/${product.slug}` : "#"}
                className="group block rounded-[var(--radius-lg)] border border-sf-border bg-white overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="aspect-square bg-sf-surface relative overflow-hidden">
                  {product.image ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sf-text-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    </div>
                  )}
                  {!inStock && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="text-[12px] font-medium text-sf-danger bg-sf-danger-light px-3 py-1 rounded-[var(--radius-full)]">
                        {t("outOfStock")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-[13px] font-medium text-sf-text line-clamp-2 leading-snug">
                    {name}
                  </h3>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-[15px] font-semibold text-sf-text">
                      MOP {price.toFixed(2)}
                    </span>
                    {originalPrice && originalPrice > price && (
                      <span className="text-[12px] text-sf-text-muted line-through">
                        MOP {originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
