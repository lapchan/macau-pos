import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontConfig } from "@/lib/storefront-queries";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import SectionRenderer, { type SectionConfig } from "@/components/sections/section-renderer";
import { getThemeById, getDefaultTheme } from "@/lib/themes";

// Default sections: dark hero + category scroll + products + featured + collections + more featured
// Matches the Tailwind Plus "With dark nav and footer" storefront layout
function getDefaultSections(locale: string, tenantName: string): SectionConfig[] {
  const t = (tc: string, en: string, pt: string, ja: string) => {
    const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
    return m[locale] || en;
  };

  return [
    // 1. Hero banner — dark overlay, full-width
    {
      id: "hero-default",
      type: "hero_banner",
      enabled: true,
      data: {
        title: t("全新商品 現已登場", "New arrivals are here", "Novidades chegaram", "新着商品が登場"),
        subtitle: t(
          "最新精選商品已經上架，把握機會選購限量商品。",
          "The new arrivals have, well, newly arrived. Check out the latest options from our summer small-batch release while they're still in stock.",
          "As novidades chegaram. Confira as últimas opções enquanto ainda estão disponíveis.",
          "新着商品が入荷しました。在庫があるうちにチェックしてください。"
        ),
        ctaText: t("選購新品", "Shop New Arrivals", "Comprar Novidades", "新着を見る"),
        ctaLink: `/${locale}/products`,
        height: "xl",
        overlayOpacity: 0.5,
        image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-hero-full-width.jpg",
      },
    },

    // 2. Category scroll — horizontal cards
    {
      id: "categories-scroll",
      type: "category_scroll",
      enabled: true,
      data: {
        title: t("按分類瀏覽", "Shop by Category", "Comprar por Categoria", "カテゴリーで探す"),
        showBrowseAll: true,
      },
    },

    // 3. Featured section — "Level up your desk" style
    {
      id: "featured-1",
      type: "featured_section",
      enabled: true,
      data: {
        title: t("品質升級\n日常必備", "Level up\nyour desk", "Melhore\nsua mesa", "デスクを\nアップグレード"),
        subtitle: t(
          "讓您的空間煥然一新。精選生活用品，品質有保證。",
          "Make your desk beautiful and organized. Post a picture to social media and watch it get more likes than life-changing announcements.",
          "Torne sua mesa bonita e organizada.",
          "デスクを美しく整理整頓しましょう。"
        ),
        ctaText: t("選購精品", "Shop Workspace", "Comprar", "ワークスペースを見る"),
        ctaLink: `/${locale}/products`,
        image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-feature-section-01.jpg",
      },
    },

    // 4. Popular products grid
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

    // 5. Collection grid — 3 cards
    {
      id: "collections-default",
      type: "collection_grid",
      enabled: true,
      data: {
        title: t("精選系列", "Shop by Collection", "Comprar por Coleção", "コレクションで探す"),
        subtitle: t(
          "每一季，我們與供應商合作，精選最優質的商品系列。",
          "Each season, we collaborate with world-class designers to create a collection inspired by the natural world.",
          "A cada temporada, criamos coleções inspiradas no mundo natural.",
          "毎シーズン、自然からインスピレーションを得たコレクションをお届けします。"
        ),
        items: [
          {
            title: t("日常便利", "Daily Essentials", "Essenciais Diários", "デイリーエッセンシャル"),
            description: t("每天的好夥伴，讓生活更便利。", "Keep your phone, keys, and wallet together, so you can lose everything at once.", "Mantenha tudo junto.", "毎日の必需品をひとまとめに。"),
            image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-collection-01.jpg",
            href: `/${locale}/products`,
          },
          {
            title: t("零食天地", "Snack Corner", "Canto dos Lanches", "スナックコーナー"),
            description: t("嚴選各地零食，滿足你的味蕾。", "The rest of the house will still be a mess, but your desk will look great.", "Lanches selecionados.", "厳選スナックをお届けします。"),
            image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-collection-02.jpg",
            href: `/${locale}/products`,
          },
          {
            title: t("新品推薦", "New Picks", "Novidades", "新着ピック"),
            description: t("最新精選商品，搶先體驗。", "Be more productive than enterprise project managers with a single piece of paper.", "Mais produtivo.", "最新のおすすめ商品。"),
            image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-collection-03.jpg",
            href: `/${locale}/products`,
          },
        ],
      },
    },

    // 6. Another featured section
    {
      id: "featured-2",
      type: "featured_section",
      enabled: true,
      data: {
        title: t("簡單高效", "Simple productivity", "Produtividade simples", "シンプルな生産性"),
        subtitle: t(
          "精選商品讓您的生活更加便利。立即選購。",
          "Endless tasks, limited hours, a single piece of paper. Just the undeniable urge to fill empty circles.",
          "Tarefas infinitas, horas limitadas.",
          "シンプルなツールで最大の成果を。"
        ),
        ctaText: t("立即選購", "Shop Focus", "Comprar", "フォーカスを見る"),
        ctaLink: `/${locale}/products`,
        image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-feature-section-02.jpg",
      },
    },

    // 7. Incentive grid
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
  ];
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const h = await headers();
  const tenant = await resolveTenant();
  console.log("[HomePage] host=", h.get("host"), "locale=", locale, "resolved tenant=", tenant?.slug);
  if (!tenant) notFound();

  const config = await getStorefrontConfig(tenant.id);
  const sections = (config.homepageSections as SectionConfig[]) || [];
  const branding = config.branding as Record<string, unknown>;
  const themeId = (branding?.themeId as string) || "modern";

  // Get defaults from the active theme, fallback to hardcoded
  const theme = getThemeById(themeId) || getDefaultTheme();
  const defaults = theme.defaultSections.length > 0
    ? theme.defaultSections
    : getDefaultSections(locale, tenant.name);

  // If tenant has explicitly saved sections, use only those (no merging).
  // Only fall back to theme defaults when there are NO saved sections at all.
  const activeSections = sections.length > 0
    ? sections
    : defaults;

  return (
    <SectionRenderer
      sections={activeSections}
      locale={locale}
      tenantId={tenant.id}
      themeId={themeId}
    />
  );
}
