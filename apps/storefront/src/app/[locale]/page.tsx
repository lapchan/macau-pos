import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontConfig } from "@/lib/storefront-queries";
import { notFound } from "next/navigation";
import SectionRenderer, { type SectionConfig } from "@/components/sections/section-renderer";

// Default sections shown when merchant hasn't customized yet
function getDefaultSections(locale: string, tenantName: string): SectionConfig[] {
  const t = (tc: string, en: string, pt: string, ja: string) => {
    const m: Record<string, string> = { tc, sc: tc.replace(/體/g, "体").replace(/區/g, "区"), en, pt, ja };
    return m[locale] || en;
  };

  return [
    {
      id: "hero-default",
      type: "hero_banner",
      enabled: true,
      data: {
        title: tenantName,
        subtitle: t("優質商品，送到你家門口", "Quality products, delivered to your door", "Produtos de qualidade, entregues na sua porta", "品質の高い商品をお届けします"),
        ctaText: t("立即選購", "Shop Now", "Comprar", "今すぐ購入"),
        ctaLink: `/${locale}/products`,
        height: "lg",
      },
    },
    {
      id: "categories-default",
      type: "category_grid",
      enabled: true,
      data: {
        title: t("按分類瀏覽", "Browse by Category", "Navegar por Categoria", "カテゴリーで探す"),
        columns: 6,
      },
    },
    {
      id: "popular-default",
      type: "product_grid",
      enabled: true,
      data: {
        title: t("精選商品", "Featured Products", "Produtos em Destaque", "おすすめ商品"),
        limit: 8,
        columns: 4,
        sortBy: "popular",
        showViewAll: true,
        viewAllLink: `/${locale}/products`,
      },
    },
    {
      id: "incentives-default",
      type: "incentive_grid",
      enabled: true,
      data: {
        items: [
          { icon: "truck", title: t("本地送貨", "Local Delivery", "Entrega Local", "地元配送"), description: t("澳門全區送達", "Delivery across Macau", "Entrega em todo Macau", "マカオ全域配送") },
          { icon: "shield", title: t("安全付款", "Secure Payment", "Pagamento Seguro", "安全な支払い"), description: t("MPay · 支付寶 · 微信", "MPay · Alipay · WeChat", "MPay · Alipay · WeChat", "MPay · Alipay · WeChat") },
          { icon: "refresh", title: t("輕鬆退換", "Easy Returns", "Devoluções Fáceis", "簡単返品"), description: t("7天退換保障", "7-day return policy", "Política de 7 dias", "7日間返品保証") },
          { icon: "clock", title: t("快速出貨", "Fast Shipping", "Envio Rápido", "迅速配送"), description: t("下單即日處理", "Same-day processing", "Processamento no dia", "当日処理") },
        ],
      },
    },
    {
      id: "new-arrivals-default",
      type: "product_carousel",
      enabled: true,
      data: {
        title: t("最新商品", "New Arrivals", "Novidades", "新着商品"),
        limit: 10,
        sortBy: "newest",
      },
    },
  ];
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const config = await getStorefrontConfig(tenant.id);
  const sections = (config.homepageSections as SectionConfig[]);

  // Use merchant-configured sections if any, otherwise show defaults
  const activeSections = sections && sections.length > 0
    ? sections
    : getDefaultSections(locale, tenant.name);

  return (
    <SectionRenderer
      sections={activeSections}
      locale={locale}
      tenantId={tenant.id}
    />
  );
}
