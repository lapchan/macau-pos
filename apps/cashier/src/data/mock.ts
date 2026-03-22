export type Category = {
  id: string;
  nameKey: string;
  icon: string;
};

export type Product = {
  id: string;
  name: string;
  nameCn: string;
  nameJa?: string;
  namePt?: string;
  price: number;
  category: string;
  image?: string;
  inStock: boolean;
  popular?: boolean;
};

export type CartItem = Product & {
  quantity: number;
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
  { id: "P001", name: "Pocari Sweat 500ml", nameCn: "寶礦力水特", nameJa: "ポカリスエット", namePt: "Pocari Sweat 500ml", price: 12.0, category: "beverages", inStock: true, popular: true },
  { id: "P002", name: "Vita Lemon Tea 250ml", nameCn: "維他檸檬茶", nameJa: "ビタレモンティー", namePt: "Chá Limão Vita 250ml", price: 6.5, category: "beverages", inStock: true, popular: true },
  { id: "P003", name: "Red Bull 250ml", nameCn: "紅牛", nameJa: "レッドブル", namePt: "Red Bull 250ml", price: 18.0, category: "beverages", inStock: true },
  { id: "P008", name: "Coca-Cola Zero 330ml", nameCn: "零度可口可樂", nameJa: "コカ・コーラゼロ", namePt: "Coca-Cola Zero 330ml", price: 8.0, category: "beverages", inStock: true, popular: true },
  { id: "P014", name: "Perrier Sparkling 330ml", nameCn: "巴黎水", nameJa: "ペリエ", namePt: "Perrier 330ml", price: 15.0, category: "beverages", inStock: true },
  { id: "P015", name: "Oat Milk Latte", nameCn: "燕麥奶拿鐵", nameJa: "オーツミルクラテ", namePt: "Latte de Aveia", price: 32.0, category: "beverages", inStock: true, popular: true },
  { id: "P004", name: "Lay's Classic 70g", nameCn: "樂事經典薯片", nameJa: "レイズクラシック", namePt: "Lay's Clássico 70g", price: 14.0, category: "snacks", inStock: true },
  { id: "P005", name: "Oreo Cookies 137g", nameCn: "奧利奧餅乾", nameJa: "オレオクッキー", namePt: "Bolachas Oreo 137g", price: 16.0, category: "snacks", inStock: true },
  { id: "P009", name: "KitKat Matcha 35g", nameCn: "抹茶KitKat", nameJa: "キットカット抹茶", namePt: "KitKat Matcha 35g", price: 12.0, category: "snacks", inStock: false },
  { id: "P016", name: "Pringles Original 110g", nameCn: "品客原味", nameJa: "プリングルズ", namePt: "Pringles Original 110g", price: 22.0, category: "snacks", inStock: true, popular: true },
  { id: "P006", name: "Häagen-Dazs Vanilla", nameCn: "哈根達斯雲呢拿", nameJa: "ハーゲンダッツバニラ", namePt: "Häagen-Dazs Baunilha", price: 42.0, category: "frozen", inStock: true },
  { id: "P017", name: "Ben & Jerry's Cookie", nameCn: "B&J 曲奇", nameJa: "B&J クッキー", namePt: "Ben & Jerry's Cookie", price: 48.0, category: "frozen", inStock: true },
  { id: "P007", name: "Meiji Fresh Milk 946ml", nameCn: "明治鮮牛奶", nameJa: "明治おいしい牛乳", namePt: "Leite Meiji 946ml", price: 28.0, category: "dairy", inStock: true },
  { id: "P010", name: "Yakult 5-pack", nameCn: "益力多 5支裝", nameJa: "ヤクルト5本パック", namePt: "Yakult 5 unidades", price: 18.0, category: "dairy", inStock: true },
  { id: "P018", name: "Greek Yogurt Plain", nameCn: "希臘乳酪", nameJa: "ギリシャヨーグルト", namePt: "Iogurte Grego Natural", price: 24.0, category: "dairy", inStock: true },
  { id: "P011", name: "Tempo Tissue 4-ply 18pk", nameCn: "得寶紙巾4層", nameJa: "テンポティッシュ", namePt: "Lenços Tempo 18pk", price: 38.0, category: "household", inStock: true },
  { id: "P019", name: "Dishwashing Liquid 500ml", nameCn: "洗潔精", nameJa: "食器用洗剤", namePt: "Detergente 500ml", price: 18.0, category: "household", inStock: true },
  { id: "P012", name: "Dove Soap Bar 100g", nameCn: "多芬香皂", nameJa: "ダヴ石鹸", namePt: "Sabonete Dove 100g", price: 15.0, category: "personal", inStock: true },
];
