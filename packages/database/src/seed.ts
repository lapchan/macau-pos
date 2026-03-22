import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { tenants, categories, products, shopSettings } from "./schema";
import { eq } from "drizzle-orm";

const { Pool } = pg;

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("🌱 Seeding database...\n");

  // 1. Create demo tenant
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "CountingStars",
      slug: "countingstars",
      subscriptionStatus: "active",
    })
    .onConflictDoNothing({ target: tenants.slug })
    .returning();

  const tenantId =
    tenant?.id ||
    (
      await db
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.slug, "countingstars"))
    )[0].id;

  console.log(`✅ Tenant: CountingStars (${tenantId})`);

  // 2. Create shop settings
  await db
    .insert(shopSettings)
    .values({ tenantId, currency: "MOP" })
    .onConflictDoNothing({ target: shopSettings.tenantId });

  console.log("✅ Shop settings: MOP currency");

  // 3. Create categories
  const categoryData = [
    { name: "飲品", nameEn: "Beverages", namePt: "Bebidas", nameJa: "ドリンク", icon: "Coffee", sortOrder: 1 },
    { name: "零食", nameEn: "Snacks", namePt: "Lanches", nameJa: "スナック", icon: "Cookie", sortOrder: 2 },
    { name: "冷凍", nameEn: "Frozen", namePt: "Congelados", nameJa: "冷凍", icon: "Snowflake", sortOrder: 3 },
    { name: "乳製品", nameEn: "Dairy", namePt: "Laticínios", nameJa: "乳製品", icon: "Milk", sortOrder: 4 },
    { name: "家居", nameEn: "Household", namePt: "Casa", nameJa: "日用品", icon: "Home", sortOrder: 5 },
    { name: "護理", nameEn: "Care", namePt: "Cuidados", nameJa: "ケア", icon: "Heart", sortOrder: 6 },
  ];

  // Delete existing categories for this tenant then re-insert
  await db.delete(products).where(eq(products.tenantId, tenantId));
  await db.delete(categories).where(eq(categories.tenantId, tenantId));

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData.map((c) => ({ ...c, tenantId })))
    .returning();

  const catMap = Object.fromEntries(
    insertedCategories.map((c) => [c.nameEn!, c.id])
  );

  console.log(`✅ Categories: ${insertedCategories.length} created`);

  // 4. Create products (merged from admin + cashier mock data)
  const productData = [
    // Beverages
    { name: "Pocari Sweat 500ml", nameCn: "寶礦力水特", nameJa: "ポカリスエット", namePt: "Pocari Sweat 500ml", sellingPrice: "12.00", originalPrice: "8.50", stock: 120, sku: "BEV-001", category: "Beverages", isPopular: true },
    { name: "Vita Lemon Tea 250ml", nameCn: "維他檸檬茶", nameJa: "ビタレモンティー", namePt: "Chá Limão Vita 250ml", sellingPrice: "6.50", originalPrice: "4.20", stock: 200, sku: "BEV-002", category: "Beverages", isPopular: true },
    { name: "Red Bull 250ml", nameCn: "紅牛", nameJa: "レッドブル", namePt: "Red Bull 250ml", sellingPrice: "18.00", originalPrice: "13.50", stock: 80, sku: "BEV-003", category: "Beverages", isPopular: false },
    { name: "Coca-Cola Zero 330ml", nameCn: "零度可口可樂", nameJa: "コカ・コーラゼロ", namePt: "Coca-Cola Zero 330ml", sellingPrice: "8.00", originalPrice: "5.00", stock: 150, sku: "BEV-004", category: "Beverages", isPopular: true },
    { name: "Perrier Sparkling 330ml", nameCn: "巴黎水", nameJa: "ペリエ", namePt: "Perrier 330ml", sellingPrice: "15.00", originalPrice: "10.00", stock: 60, sku: "BEV-005", category: "Beverages", isPopular: false },
    { name: "Oat Milk Latte", nameCn: "燕麥奶拿鐵", nameJa: "オーツミルクラテ", namePt: "Latte de Aveia", sellingPrice: "32.00", originalPrice: "18.00", stock: 40, sku: "BEV-006", category: "Beverages", isPopular: true },

    // Snacks
    { name: "Lay's Classic 70g", nameCn: "樂事經典薯片", nameJa: "レイズクラシック", namePt: "Lay's Clássico 70g", sellingPrice: "14.00", originalPrice: "9.00", stock: 100, sku: "SNK-001", category: "Snacks", isPopular: false },
    { name: "Oreo Cookies 137g", nameCn: "奧利奧餅乾", nameJa: "オレオクッキー", namePt: "Bolachas Oreo 137g", sellingPrice: "16.00", originalPrice: "10.50", stock: 85, sku: "SNK-002", category: "Snacks", isPopular: false },
    { name: "KitKat Matcha 35g", nameCn: "抹茶KitKat", nameJa: "キットカット抹茶", namePt: "KitKat Matcha 35g", sellingPrice: "12.00", originalPrice: "8.00", stock: 0, sku: "SNK-003", category: "Snacks", isPopular: false, status: "sold_out" as const },
    { name: "Pringles Original 110g", nameCn: "品客原味", nameJa: "プリングルズ", namePt: "Pringles Original 110g", sellingPrice: "22.00", originalPrice: "15.00", stock: 70, sku: "SNK-004", category: "Snacks", isPopular: true },

    // Frozen
    { name: "Häagen-Dazs Vanilla", nameCn: "哈根達斯雲呢拿", nameJa: "ハーゲンダッツバニラ", namePt: "Häagen-Dazs Baunilha", sellingPrice: "42.00", originalPrice: "30.00", stock: 25, sku: "FRZ-001", category: "Frozen", isPopular: false },
    { name: "Ben & Jerry's Cookie", nameCn: "B&J 曲奇", nameJa: "B&J クッキー", namePt: "Ben & Jerry's Cookie", sellingPrice: "48.00", originalPrice: "35.00", stock: 20, sku: "FRZ-002", category: "Frozen", isPopular: false },

    // Dairy
    { name: "Meiji Fresh Milk 946ml", nameCn: "明治鮮牛奶", nameJa: "明治おいしい牛乳", namePt: "Leite Meiji 946ml", sellingPrice: "28.00", originalPrice: "20.00", stock: 45, sku: "DAI-001", category: "Dairy", isPopular: false },
    { name: "Yakult 5-pack", nameCn: "益力多 5支裝", nameJa: "ヤクルト5本パック", namePt: "Yakult 5 unidades", sellingPrice: "18.00", originalPrice: "12.00", stock: 90, sku: "DAI-002", category: "Dairy", isPopular: false },
    { name: "Greek Yogurt Plain", nameCn: "希臘乳酪", nameJa: "ギリシャヨーグルト", namePt: "Iogurte Grego Natural", sellingPrice: "24.00", originalPrice: "16.00", stock: 35, sku: "DAI-003", category: "Dairy", isPopular: false },

    // Household
    { name: "Tempo Tissue 4-ply 18pk", nameCn: "得寶紙巾4層", nameJa: "テンポティッシュ", namePt: "Lenços Tempo 18pk", sellingPrice: "38.00", originalPrice: "28.00", stock: 50, sku: "HOU-001", category: "Household", isPopular: false },
    { name: "Dishwashing Liquid 500ml", nameCn: "洗潔精", nameJa: "食器用洗剤", namePt: "Detergente 500ml", sellingPrice: "18.00", originalPrice: "11.00", stock: 60, sku: "HOU-002", category: "Household", isPopular: false },

    // Personal Care
    { name: "Dove Soap Bar 100g", nameCn: "多芬香皂", nameJa: "ダヴ石鹸", namePt: "Sabonete Dove 100g", sellingPrice: "15.00", originalPrice: "9.50", stock: 75, sku: "CAR-001", category: "Care", isPopular: false },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(
      productData.map((p, i) => ({
        tenantId,
        categoryId: catMap[p.category],
        name: p.name,
        nameCn: p.nameCn,
        nameJa: p.nameJa,
        namePt: p.namePt,
        sellingPrice: p.sellingPrice,
        originalPrice: p.originalPrice,
        stock: p.stock,
        sku: p.sku,
        status: (p as any).status || ("active" as const),
        isPopular: p.isPopular,
        sortOrder: i,
      }))
    )
    .returning();

  console.log(`✅ Products: ${insertedProducts.length} created`);
  console.log(`\n🎉 Seed complete! Tenant ID: ${tenantId}`);
  console.log(`   Use this as DEMO_TENANT_ID in your apps.\n`);

  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
