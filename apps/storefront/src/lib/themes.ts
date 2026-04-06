/**
 * Storefront Theme Presets
 *
 * Each theme defines: colors, typography, header style, border radius,
 * and a set of default homepage sections. Merchants pick a theme from
 * the admin, which writes branding + homepageSections to storefront_configs.
 */

type SectionConfig = {
  id: string;
  type: string;
  enabled: boolean;
  data: Record<string, unknown>;
};

export type ThemeBranding = {
  themeId: string;
  accentColor: string;
  fontFamily: "inter" | "dm-sans" | "system" | "avenir";
  headerStyle: "dark" | "light";
  borderRadius: "none" | "sm" | "md" | "lg";
};

export type ThemePreset = {
  id: string;
  name: string;
  nameTranslations: Record<string, string>;
  description: string;
  descriptionTranslations: Record<string, string>;
  colors: { accent: string; bg: string; surface: string; text: string };
  branding: ThemeBranding;
  defaultSections: SectionConfig[];
};

// ============================================================
// Helper for multilingual default section text
// ============================================================
const t = (tc: string, en: string, pt: string, ja: string) => ({
  tc, sc: tc, en, pt, ja,
});

// ============================================================
// Theme Presets
// ============================================================

export const THEME_PRESETS: ThemePreset[] = [
  // ── 1. Modern (default) ────────────────────────────────
  {
    id: "modern",
    name: "Modern",
    nameTranslations: { tc: "現代", sc: "现代", en: "Modern", pt: "Moderno", ja: "モダン" },
    description: "Clean and contemporary with indigo accents. Dark navigation, rounded corners.",
    descriptionTranslations: { tc: "簡潔現代的設計，深色導航欄，圓角元素。", sc: "简洁现代的设计。", en: "Clean and contemporary with indigo accents.", pt: "Design limpo e contemporâneo.", ja: "クリーンでモダンなデザイン。" },
    colors: { accent: "#4f46e5", bg: "#ffffff", surface: "#f8f9fa", text: "#212529" },
    branding: { themeId: "modern", accentColor: "#4f46e5", fontFamily: "inter", headerStyle: "dark", borderRadius: "md" },
    defaultSections: [
      { id: "hero-modern", type: "hero_banner", enabled: true, data: { titleTranslations: t("全新商品 現已登場", "New arrivals are here", "Novidades chegaram", "新着商品が登場"), subtitleTranslations: t("最新精選商品已經上架，把握機會選購。", "Check out the latest products while they're still in stock.", "Confira os produtos mais recentes.", "最新商品をチェックしてください。"), ctaTextTranslations: t("選購新品", "Shop New Arrivals", "Comprar", "新着を見る"), ctaLink: "/tc/products", height: "xl", image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-hero-full-width.jpg" } },
      { id: "cats-modern", type: "category_scroll", enabled: true, data: { titleTranslations: t("按分類瀏覽", "Shop by Category", "Comprar por Categoria", "カテゴリーで探す"), showBrowseAll: true } },
      { id: "feat1-modern", type: "featured_section", enabled: true, data: { titleTranslations: t("品質升級\n日常必備", "Level up\nyour desk", "Melhore\nsua mesa", "デスクを\nアップグレード"), subtitleTranslations: t("讓您的空間煥然一新。", "Make your space beautiful.", "Torne seu espaço bonito.", "スペースを美しく。"), ctaTextTranslations: t("選購精品", "Shop Workspace", "Comprar", "見る"), ctaLink: "/tc/products", image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-feature-section-01.jpg" } },
      { id: "products-modern", type: "product_grid", enabled: true, data: { titleTranslations: t("精選商品", "Featured Products", "Produtos em Destaque", "おすすめ商品"), limit: 8, columns: 4, sortBy: "popular", showViewAll: true } },
      { id: "collections-modern", type: "collection_grid", enabled: true, data: { titleTranslations: t("精選系列", "Shop by Collection", "Comprar por Coleção", "コレクション"), subtitleTranslations: t("精選最優質的商品系列。", "Curated collections for you.", "Coleções selecionadas.", "厳選コレクション。"), items: [ { title: "日常便利", image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-collection-01.jpg", href: "/tc/products" }, { title: "零食天地", image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-collection-02.jpg", href: "/tc/products" }, { title: "新品推薦", image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-collection-03.jpg", href: "/tc/products" } ] } },
      { id: "incentives-modern", type: "incentive_grid", enabled: true, data: { items: [ { icon: "truck", title: "本地送貨", description: "澳門全區送達" }, { icon: "shield", title: "安全付款", description: "MPay · 支付寶 · 微信" }, { icon: "refresh", title: "輕鬆退換", description: "7天退換保障" }, { icon: "clock", title: "快速出貨", description: "下單即日處理" } ] } },
    ],
  },

  // ── 2. Classic ─────────────────────────────────────────
  {
    id: "classic",
    name: "Classic",
    nameTranslations: { tc: "經典", sc: "经典", en: "Classic", pt: "Clássico", ja: "クラシック" },
    description: "Timeless elegance with sharp corners and a light header. Clean and professional.",
    descriptionTranslations: { tc: "永恆優雅，直角設計，淺色導航欄。專業大方。", sc: "永恒优雅的设计。", en: "Timeless elegance with sharp corners.", pt: "Elegância atemporal.", ja: "タイムレスなエレガンス。" },
    colors: { accent: "#1a1a1a", bg: "#ffffff", surface: "#fafafa", text: "#111111" },
    branding: { themeId: "classic", accentColor: "#1a1a1a", fontFamily: "system", headerStyle: "light", borderRadius: "none" },
    defaultSections: [
      { id: "hero-classic", type: "hero_banner", enabled: true, data: { titleTranslations: t("歡迎光臨", "Welcome", "Bem-vindo", "ようこそ"), subtitleTranslations: t("探索我們精心挑選的商品", "Discover our curated selection", "Descubra nossa seleção", "厳選商品をご覧ください"), ctaTextTranslations: t("瀏覽商品", "Browse Products", "Ver Produtos", "商品を見る"), ctaLink: "/tc/products", height: "lg" } },
      { id: "products-classic", type: "product_grid", enabled: true, data: { titleTranslations: t("全部商品", "All Products", "Todos os Produtos", "全商品"), limit: 12, columns: 4, sortBy: "newest", showViewAll: true } },
      { id: "cats-classic", type: "category_grid", enabled: true, data: { titleTranslations: t("商品分類", "Categories", "Categorias", "カテゴリー"), columns: 3 } },
      { id: "newsletter-classic", type: "newsletter", enabled: true, data: { titleTranslations: t("訂閱電子報", "Subscribe", "Assinar", "ニュースレター"), subtitleTranslations: t("獲取最新優惠", "Get the latest deals", "Receba ofertas", "最新情報をゲット") } },
      { id: "incentives-classic", type: "incentive_grid", enabled: true, data: { items: [ { icon: "truck", title: "免費送貨", description: "滿MOP 200免運" }, { icon: "shield", title: "安全付款", description: "加密保護" }, { icon: "refresh", title: "退換保障", description: "7天無憂退換" }, { icon: "clock", title: "即日出貨", description: "工作天即日處理" } ] } },
    ],
  },

  // ── 3. Bold ────────────────────────────────────────────
  {
    id: "bold",
    name: "Bold",
    nameTranslations: { tc: "大膽", sc: "大胆", en: "Bold", pt: "Arrojado", ja: "ボールド" },
    description: "Vibrant red accents with large rounded corners. Eye-catching and energetic.",
    descriptionTranslations: { tc: "鮮明紅色調，大圓角設計。醒目活力。", sc: "鲜明红色调，大圆角设计。", en: "Vibrant red accents, eye-catching.", pt: "Acentos vermelhos vibrantes.", ja: "鮮やかな赤アクセント。" },
    colors: { accent: "#dc2626", bg: "#ffffff", surface: "#fef2f2", text: "#1a1a1a" },
    branding: { themeId: "bold", accentColor: "#dc2626", fontFamily: "dm-sans", headerStyle: "dark", borderRadius: "lg" },
    defaultSections: [
      { id: "hero-bold", type: "hero_banner", enabled: true, data: { titleTranslations: t("限時優惠", "Limited Time Deals", "Ofertas por tempo limitado", "期間限定セール"), subtitleTranslations: t("不容錯過的超值商品！", "Don't miss these amazing deals!", "Não perca!", "お見逃しなく！"), ctaTextTranslations: t("立即搶購", "Shop Now", "Comprar", "今すぐ購入"), ctaLink: "/tc/products", height: "xl" } },
      { id: "carousel-bold", type: "product_carousel", enabled: true, data: { titleTranslations: t("熱門商品", "Trending Now", "Em Alta", "トレンド"), limit: 10, sortBy: "popular" } },
      { id: "products-bold", type: "product_grid", enabled: true, data: { titleTranslations: t("精選推薦", "Recommended", "Recomendados", "おすすめ"), limit: 8, columns: 4, sortBy: "popular", showViewAll: true } },
      { id: "incentives-bold", type: "incentive_grid", enabled: true, data: { items: [ { icon: "truck", title: "極速送貨", description: "澳門當日達" }, { icon: "shield", title: "正品保證", description: "100%正貨" }, { icon: "refresh", title: "無憂退換", description: "7天退換" }, { icon: "clock", title: "24/7客服", description: "全天候服務" } ] } },
    ],
  },

  // ── 4. Minimal ─────────────────────────────────────────
  {
    id: "minimal",
    name: "Minimal",
    nameTranslations: { tc: "極簡", sc: "极简", en: "Minimal", pt: "Minimalista", ja: "ミニマル" },
    description: "Less is more. Clean product focus with subtle gray accents and light header.",
    descriptionTranslations: { tc: "少即是多。簡潔產品為主，低調灰色調。", sc: "少即是多。", en: "Less is more. Clean product focus.", pt: "Menos é mais.", ja: "レス・イズ・モア。" },
    colors: { accent: "#6b7280", bg: "#ffffff", surface: "#f9fafb", text: "#374151" },
    branding: { themeId: "minimal", accentColor: "#6b7280", fontFamily: "inter", headerStyle: "light", borderRadius: "sm" },
    defaultSections: [
      { id: "products-minimal", type: "product_grid", enabled: true, data: { titleTranslations: t("全部商品", "Products", "Produtos", "商品"), limit: 12, columns: 3, sortBy: "newest", showViewAll: true } },
      { id: "cats-minimal", type: "category_grid", enabled: true, data: { titleTranslations: t("分類", "Categories", "Categorias", "カテゴリー"), columns: 6 } },
      { id: "incentives-minimal", type: "incentive_grid", enabled: true, data: { items: [ { icon: "truck", title: "送貨服務", description: "澳門全區" }, { icon: "shield", title: "安全付款", description: "加密保護" }, { icon: "refresh", title: "退換", description: "7天保障" } ] } },
    ],
  },

  // ── 5. Warm ────────────────────────────────────────────
  {
    id: "warm",
    name: "Warm",
    nameTranslations: { tc: "溫暖", sc: "温暖", en: "Warm", pt: "Quente", ja: "ウォーム" },
    description: "Amber accents with a cozy, welcoming feel. Perfect for lifestyle and food stores.",
    descriptionTranslations: { tc: "琥珀色調，溫馨親切。適合生活、食品類商店。", sc: "琥珀色调，温馨亲切。", en: "Amber accents, cozy and welcoming.", pt: "Tons âmbar, acolhedor.", ja: "アンバーアクセント、温かみのある雰囲気。" },
    colors: { accent: "#b45309", bg: "#fffbeb", surface: "#fef3c7", text: "#451a03" },
    branding: { themeId: "warm", accentColor: "#b45309", fontFamily: "system", headerStyle: "light", borderRadius: "md" },
    defaultSections: [
      { id: "hero-warm", type: "hero_banner", enabled: true, data: { titleTranslations: t("精選好物 溫暖推薦", "Curated with Care", "Selecionado com carinho", "厳選のおすすめ"), subtitleTranslations: t("每一件商品都是我們精心挑選的好物。", "Every item is handpicked for you.", "Cada item é escolhido a dedo.", "一つ一つ厳選しました。"), ctaTextTranslations: t("探索商品", "Explore", "Explorar", "探索する"), ctaLink: "/tc/products", height: "lg" } },
      { id: "collections-warm", type: "collection_grid", enabled: true, data: { titleTranslations: t("精選系列", "Our Collections", "Nossas Coleções", "コレクション"), items: [ { title: "每日精選", image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-collection-01.jpg", href: "/tc/products" }, { title: "美食天地", image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-collection-02.jpg", href: "/tc/products" }, { title: "生活好物", image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-collection-03.jpg", href: "/tc/products" } ] } },
      { id: "products-warm", type: "product_grid", enabled: true, data: { titleTranslations: t("人氣商品", "Popular Items", "Populares", "人気商品"), limit: 8, columns: 4, sortBy: "popular", showViewAll: true } },
      { id: "feature-warm", type: "feature_grid", enabled: true, data: { titleTranslations: t("為什麼選擇我們", "Why Choose Us", "Por que nos escolher", "選ばれる理由"), items: [] } },
      { id: "newsletter-warm", type: "newsletter", enabled: true, data: { titleTranslations: t("訂閱電子報", "Stay in Touch", "Fique por dentro", "ニュースレター"), subtitleTranslations: t("最新優惠和新品資訊", "Latest deals and new arrivals", "Ofertas e novidades", "最新情報をお届け") } },
    ],
  },

  // ── 6. HUMAN MADE ─────────────────────────────────────
  {
    id: "humanmade",
    name: "HUMAN MADE",
    nameTranslations: { tc: "日系潮牌", sc: "日系潮牌", en: "HUMAN MADE", pt: "HUMAN MADE", ja: "ヒューマンメイド" },
    description: "Japanese streetwear-inspired. Ultra-minimal black & white with bold typography and zero border radius.",
    descriptionTranslations: { tc: "日系街頭風格。極簡黑白設計，大膽排版，無圓角。", sc: "日系街头风格。极简黑白设计。", en: "Japanese streetwear-inspired. Ultra-minimal black & white.", pt: "Inspirado em streetwear japonês.", ja: "日本のストリートウェアにインスパイア。" },
    colors: { accent: "#000000", bg: "#ffffff", surface: "#f5f5f5", text: "#000000" },
    branding: { themeId: "humanmade", accentColor: "#000000", fontFamily: "avenir", headerStyle: "dark", borderRadius: "none" },
    defaultSections: [
      { id: "hero-hm", type: "hero_banner", enabled: true, data: { titleTranslations: t("THE FUTURE\nIS IN THE PAST", "THE FUTURE\nIS IN THE PAST", "THE FUTURE\nIS IN THE PAST", "THE FUTURE\nIS IN THE PAST"), subtitleTranslations: t("精選商品 現已上架", "Shop our latest collection", "Compre a coleção mais recente", "最新コレクション"), ctaTextTranslations: t("SHOP NOW", "SHOP NOW", "COMPRAR", "ショップ"), ctaLink: "/tc/products", height: "xl", image: "https://www.humanmade.jp/dw/image/v2/BLSM_PRD/on/demandware.static/-/Sites-HUMANMADE-Library/default/dw970bd235/huchdsauovhaf.jpg?sw=1920&sfrm=jpg" } },
      { id: "products-hm", type: "product_grid", enabled: true, data: { titleTranslations: t("NEW ARRIVALS", "NEW ARRIVALS", "NOVIDADES", "新着商品"), limit: 8, columns: 4, sortBy: "newest", showViewAll: true } },
      { id: "collections-hm", type: "collection_grid", enabled: true, data: { titleTranslations: t("COLLECTIONS", "COLLECTIONS", "COLEÇÕES", "コレクション"), items: [ { title: "ESSENTIALS", image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-collection-01.jpg", href: "/tc/products" }, { title: "ACCESSORIES", image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-collection-02.jpg", href: "/tc/products" }, { title: "LIFESTYLE", image: "https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-collection-03.jpg", href: "/tc/products" } ] } },
      { id: "incentives-hm", type: "incentive_grid", enabled: true, data: { items: [ { icon: "truck", title: "WORLDWIDE SHIPPING", description: "全球配送" }, { icon: "shield", title: "AUTHENTIC GUARANTEE", description: "正品保證" }, { icon: "refresh", title: "EASY RETURNS", description: "7天退換" }, { icon: "clock", title: "SAME-DAY DISPATCH", description: "即日出貨" } ] } },
    ],
  },
];

export function getThemeById(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((t) => t.id === id);
}

export function getDefaultTheme(): ThemePreset {
  return THEME_PRESETS[0]; // "modern"
}
