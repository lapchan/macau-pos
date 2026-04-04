export type Category = {
  id: string;
  nameKey: string;
  icon: string;
};

export type Product = {
  id: string;
  name: string;                          // Default product name (always displayed as fallback)
  translations?: Record<string, string>; // { en: "...", tc: "...", sc: "...", ja: "...", pt: "..." }
  price: number;
  category: string;
  image?: string;
  inStock: boolean;
  popular?: boolean;
  hasVariants?: boolean;
};

export type CartItem = Product & {
  quantity: number;
  variantOptions?: string[]; // e.g. ["河津櫻 Sakura"] or ["M 標準碼", "暗魂黑 DarkSoul Black"]
};

export const categories: Category[] = [
  { id: "all", nameKey: "all", icon: "LayoutGrid" },
  { id: "popular", nameKey: "popular", icon: "Flame" },
  { id: "beverages", nameKey: "beverages", icon: "Coffee" },
  { id: "snacks", nameKey: "snacks", icon: "Cookie" },
  { id: "frozen", nameKey: "frozen", icon: "Snowflake" },
  { id: "dairy", nameKey: "dairy", icon: "Milk" },
  { id: "household", nameKey: "household", icon: "Home" },
  { id: "personal", nameKey: "care", icon: "Heart" },
];

export const products: Product[] = [
  { id: "P001", name: "寶礦力水特", translations: { en: "Pocari Sweat 500ml", tc: "寶礦力水特", sc: "宝矿力水特", ja: "ポカリスエット", pt: "Pocari Sweat 500ml" }, price: 12.0, category: "beverages", inStock: true, popular: true },
  { id: "P002", name: "維他檸檬茶", translations: { en: "Vita Lemon Tea 250ml", tc: "維他檸檬茶", sc: "维他柠檬茶", ja: "ビタレモンティー", pt: "Chá Limão Vita 250ml" }, price: 6.5, category: "beverages", inStock: true, popular: true },
  { id: "P003", name: "紅牛", translations: { en: "Red Bull 250ml", tc: "紅牛", sc: "红牛", ja: "レッドブル", pt: "Red Bull 250ml" }, price: 18.0, category: "beverages", inStock: true },
  { id: "P008", name: "零度可口可樂", translations: { en: "Coca-Cola Zero 330ml", tc: "零度可口可樂", sc: "零度可口可乐", ja: "コカ・コーラゼロ", pt: "Coca-Cola Zero 330ml" }, price: 8.0, category: "beverages", inStock: true, popular: true },
  { id: "P014", name: "巴黎水", translations: { en: "Perrier Sparkling 330ml", tc: "巴黎水", ja: "ペリエ", pt: "Perrier 330ml" }, price: 15.0, category: "beverages", inStock: true },
  { id: "P015", name: "燕麥奶拿鐵", translations: { en: "Oat Milk Latte", tc: "燕麥奶拿鐵", sc: "燕麦奶拿铁", ja: "オーツミルクラテ", pt: "Latte de Aveia" }, price: 32.0, category: "beverages", inStock: true, popular: true },
  { id: "P004", name: "樂事經典薯片", translations: { en: "Lay's Classic 70g", tc: "樂事經典薯片", sc: "乐事经典薯片", ja: "レイズクラシック", pt: "Lay's Clássico 70g" }, price: 14.0, category: "snacks", inStock: true },
  { id: "P005", name: "奧利奧餅乾", translations: { en: "Oreo Cookies 137g", tc: "奧利奧餅乾", sc: "奥利奥饼干", ja: "オレオクッキー", pt: "Bolachas Oreo 137g" }, price: 16.0, category: "snacks", inStock: true },
  { id: "P009", name: "抹茶KitKat", translations: { en: "KitKat Matcha 35g", tc: "抹茶KitKat", ja: "キットカット抹茶", pt: "KitKat Matcha 35g" }, price: 12.0, category: "snacks", inStock: false },
  { id: "P016", name: "品客原味", translations: { en: "Pringles Original 110g", tc: "品客原味", ja: "プリングルズ", pt: "Pringles Original 110g" }, price: 22.0, category: "snacks", inStock: true, popular: true },
  { id: "P006", name: "哈根達斯雲呢拿", translations: { en: "Häagen-Dazs Vanilla", tc: "哈根達斯雲呢拿", ja: "ハーゲンダッツバニラ", pt: "Häagen-Dazs Baunilha" }, price: 42.0, category: "frozen", inStock: true },
  { id: "P017", name: "B&J 曲奇", translations: { en: "Ben & Jerry's Cookie", tc: "B&J 曲奇", ja: "B&J クッキー", pt: "Ben & Jerry's Cookie" }, price: 48.0, category: "frozen", inStock: true },
  { id: "P007", name: "明治鮮牛奶", translations: { en: "Meiji Fresh Milk 946ml", tc: "明治鮮牛奶", sc: "明治鲜牛奶", ja: "明治おいしい牛乳", pt: "Leite Meiji 946ml" }, price: 28.0, category: "dairy", inStock: true },
  { id: "P010", name: "益力多 5支裝", translations: { en: "Yakult 5-pack", tc: "益力多 5支裝", sc: "益力多 5支装", ja: "ヤクルト5本パック", pt: "Yakult 5 unidades" }, price: 18.0, category: "dairy", inStock: true },
  { id: "P018", name: "希臘乳酪", translations: { en: "Greek Yogurt Plain", tc: "希臘乳酪", sc: "希腊乳酪", ja: "ギリシャヨーグルト", pt: "Iogurte Grego Natural" }, price: 24.0, category: "dairy", inStock: true },
  { id: "P011", name: "得寶紙巾4層", translations: { en: "Tempo Tissue 4-ply 18pk", tc: "得寶紙巾4層", sc: "得宝纸巾4层", ja: "テンポティッシュ", pt: "Lenços Tempo 18pk" }, price: 38.0, category: "household", inStock: true },
  { id: "P019", name: "洗潔精", translations: { en: "Dishwashing Liquid 500ml", tc: "洗潔精", sc: "洗洁精", ja: "食器用洗剤", pt: "Detergente 500ml" }, price: 18.0, category: "household", inStock: true },
  { id: "P012", name: "多芬香皂", translations: { en: "Dove Soap Bar 100g", tc: "多芬香皂", ja: "ダヴ石鹸", pt: "Sabonete Dove 100g" }, price: 15.0, category: "personal", inStock: true },
];
