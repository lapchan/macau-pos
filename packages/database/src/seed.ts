import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { tenants, locations, categories, products, shopSettings, users, sessions, terminals, pricingStrategies, pricingStrategyItems } from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

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

  // 2. Create locations
  await db.delete(locations).where(eq(locations.tenantId, tenantId));
  const insertedLocations = await db
    .insert(locations)
    .values([
      {
        tenantId,
        name: "Main Store",
        slug: "main",
        code: "L-001",
        address: "Rua do Campo 123, Macau",
        phone: "85328001234",
        email: "main@countingstars.mo",
        isDefault: true,
      },
      {
        tenantId,
        name: "Airport Kiosk",
        slug: "airport",
        code: "L-002",
        address: "Macau International Airport, Departure Hall",
        phone: "85328005678",
        email: "airport@countingstars.mo",
        isDefault: false,
      },
    ])
    .returning();

  const mainLocationId = insertedLocations[0].id;
  const airportLocationId = insertedLocations[1].id;
  console.log(`✅ Locations: Main Store (${mainLocationId}), Airport Kiosk (${airportLocationId})`);

  // 3. Create shop settings per location
  await db.delete(shopSettings).where(eq(shopSettings.tenantId, tenantId));
  await db.insert(shopSettings).values([
    {
      tenantId,
      locationId: mainLocationId,
      shopName: "CountingStars Main Store",
      address: "Rua do Campo 123, Macau",
      phone: "85328001234",
      email: "main@countingstars.mo",
      paymentCash: true,
      paymentCard: true,
      paymentMpay: true,
      paymentAlipay: true,
      paymentWechat: true,
    },
    {
      tenantId,
      locationId: airportLocationId,
      shopName: "CountingStars Airport Kiosk",
      address: "Macau International Airport, Departure Hall",
      phone: "85328005678",
      email: "airport@countingstars.mo",
      paymentCash: true,
      paymentCard: true,
      paymentMpay: false,
      paymentAlipay: true,
      paymentWechat: false,
    },
  ]);
  console.log("✅ Shop settings: 2 location configs created");

  // 3. Create categories
  const categoryData = [
    { name: "飲品", translations: { en: "Beverages", pt: "Bebidas", ja: "ドリンク" }, icon: "Coffee", sortOrder: 1 },
    { name: "零食", translations: { en: "Snacks", pt: "Lanches", ja: "スナック" }, icon: "Cookie", sortOrder: 2 },
    { name: "冷凍", translations: { en: "Frozen", pt: "Congelados", ja: "冷凍" }, icon: "Snowflake", sortOrder: 3 },
    { name: "乳製品", translations: { en: "Dairy", pt: "Laticínios", ja: "乳製品" }, icon: "Milk", sortOrder: 4 },
    { name: "家居", translations: { en: "Household", pt: "Casa", ja: "日用品" }, icon: "Home", sortOrder: 5 },
    { name: "護理", translations: { en: "Care", pt: "Cuidados", ja: "ケア" }, icon: "Heart", sortOrder: 6 },
  ];

  // Delete existing categories for this tenant then re-insert
  await db.delete(products).where(eq(products.tenantId, tenantId));
  await db.delete(categories).where(eq(categories.tenantId, tenantId));

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData.map((c) => ({ ...c, tenantId })))
    .returning();

  const catMap = Object.fromEntries(
    insertedCategories.map((c) => {
      const trans = c.translations as Record<string, string> | null;
      return [trans?.en || c.name, c.id];
    })
  );

  console.log(`✅ Categories: ${insertedCategories.length} created`);

  // 4. Create products (merged from admin + cashier mock data)
  // Products: name = default (Chinese), translations = { en, ja, pt }
  const productData = [
    // Beverages
    { name: "寶礦力水特", translations: { en: "Pocari Sweat 500ml", ja: "ポカリスエット", pt: "Pocari Sweat 500ml" }, sellingPrice: "12.00", originalPrice: "8.50", stock: 120, sku: "BEV-001", category: "Beverages", isPopular: true },
    { name: "維他檸檬茶", translations: { en: "Vita Lemon Tea 250ml", ja: "ビタレモンティー", pt: "Chá Limão Vita 250ml" }, sellingPrice: "6.50", originalPrice: "4.20", stock: 200, sku: "BEV-002", category: "Beverages", isPopular: true },
    { name: "紅牛", translations: { en: "Red Bull 250ml", ja: "レッドブル", pt: "Red Bull 250ml" }, sellingPrice: "18.00", originalPrice: "13.50", stock: 80, sku: "BEV-003", category: "Beverages", isPopular: false },
    { name: "零度可口可樂", translations: { en: "Coca-Cola Zero 330ml", ja: "コカ・コーラゼロ", pt: "Coca-Cola Zero 330ml" }, sellingPrice: "8.00", originalPrice: "5.00", stock: 150, sku: "BEV-004", category: "Beverages", isPopular: true },
    { name: "巴黎水", translations: { en: "Perrier Sparkling 330ml", ja: "ペリエ", pt: "Perrier 330ml" }, sellingPrice: "15.00", originalPrice: "10.00", stock: 60, sku: "BEV-005", category: "Beverages", isPopular: false },
    { name: "燕麥奶拿鐵", translations: { en: "Oat Milk Latte", ja: "オーツミルクラテ", pt: "Latte de Aveia" }, sellingPrice: "32.00", originalPrice: "18.00", stock: 40, sku: "BEV-006", category: "Beverages", isPopular: true },

    // Snacks
    { name: "樂事經典薯片", translations: { en: "Lay's Classic 70g", ja: "レイズクラシック", pt: "Lay's Clássico 70g" }, sellingPrice: "14.00", originalPrice: "9.00", stock: 100, sku: "SNK-001", category: "Snacks", isPopular: false },
    { name: "奧利奧餅乾", translations: { en: "Oreo Cookies 137g", ja: "オレオクッキー", pt: "Bolachas Oreo 137g" }, sellingPrice: "16.00", originalPrice: "10.50", stock: 85, sku: "SNK-002", category: "Snacks", isPopular: false },
    { name: "抹茶KitKat", translations: { en: "KitKat Matcha 35g", ja: "キットカット抹茶", pt: "KitKat Matcha 35g" }, sellingPrice: "12.00", originalPrice: "8.00", stock: 0, sku: "SNK-003", category: "Snacks", isPopular: false, status: "sold_out" as const },
    { name: "品客原味", translations: { en: "Pringles Original 110g", ja: "プリングルズ", pt: "Pringles Original 110g" }, sellingPrice: "22.00", originalPrice: "15.00", stock: 70, sku: "SNK-004", category: "Snacks", isPopular: true },

    // Frozen
    { name: "哈根達斯雲呢拿", translations: { en: "Häagen-Dazs Vanilla", ja: "ハーゲンダッツバニラ", pt: "Häagen-Dazs Baunilha" }, sellingPrice: "42.00", originalPrice: "30.00", stock: 25, sku: "FRZ-001", category: "Frozen", isPopular: false },
    { name: "B&J 曲奇", translations: { en: "Ben & Jerry's Cookie", ja: "B&J クッキー", pt: "Ben & Jerry's Cookie" }, sellingPrice: "48.00", originalPrice: "35.00", stock: 20, sku: "FRZ-002", category: "Frozen", isPopular: false },

    // Dairy
    { name: "明治鮮牛奶", translations: { en: "Meiji Fresh Milk 946ml", ja: "明治おいしい牛乳", pt: "Leite Meiji 946ml" }, sellingPrice: "28.00", originalPrice: "20.00", stock: 45, sku: "DAI-001", category: "Dairy", isPopular: false },
    { name: "益力多 5支裝", translations: { en: "Yakult 5-pack", ja: "ヤクルト5本パック", pt: "Yakult 5 unidades" }, sellingPrice: "18.00", originalPrice: "12.00", stock: 90, sku: "DAI-002", category: "Dairy", isPopular: false },
    { name: "希臘乳酪", translations: { en: "Greek Yogurt Plain", ja: "ギリシャヨーグルト", pt: "Iogurte Grego Natural" }, sellingPrice: "24.00", originalPrice: "16.00", stock: 35, sku: "DAI-003", category: "Dairy", isPopular: false },

    // Household
    { name: "得寶紙巾4層", translations: { en: "Tempo Tissue 4-ply 18pk", ja: "テンポティッシュ", pt: "Lenços Tempo 18pk" }, sellingPrice: "38.00", originalPrice: "28.00", stock: 50, sku: "HOU-001", category: "Household", isPopular: false },
    { name: "洗潔精", translations: { en: "Dishwashing Liquid 500ml", ja: "食器用洗剤", pt: "Detergente 500ml" }, sellingPrice: "18.00", originalPrice: "11.00", stock: 60, sku: "HOU-002", category: "Household", isPopular: false },

    // Personal Care
    { name: "多芬香皂", translations: { en: "Dove Soap Bar 100g", ja: "ダヴ石鹸", pt: "Sabonete Dove 100g" }, sellingPrice: "15.00", originalPrice: "9.50", stock: 75, sku: "CAR-001", category: "Care", isPopular: false },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(
      productData.map((p, i) => ({
        tenantId,
        categoryId: catMap[p.category],
        name: p.name,
        translations: p.translations,
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

  // 4b. Create pricing strategies
  await db.delete(pricingStrategyItems).where(eq(pricingStrategyItems.strategyId, pricingStrategyItems.strategyId)); // clear all
  await db.delete(pricingStrategies).where(eq(pricingStrategies.tenantId, tenantId));

  const [standardStrategy, airportStrategy] = await db
    .insert(pricingStrategies)
    .values([
      {
        tenantId,
        name: "Standard",
        description: "Default catalog pricing — no overrides",
      },
      {
        tenantId,
        name: "Airport Premium",
        description: "Premium pricing for airport location with markup on beverages",
      },
    ])
    .returning();

  // Build a product lookup by SKU for easy reference
  const productBySku = Object.fromEntries(
    insertedProducts.map((p) => [p.sku, p])
  );

  // Airport Premium: markup on popular beverages, hide out-of-stock item
  await db.insert(pricingStrategyItems).values([
    { strategyId: airportStrategy.id, productId: productBySku["BEV-001"].id, sellingPrice: "15.00", isAvailable: true },  // Pocari: 12 → 15
    { strategyId: airportStrategy.id, productId: productBySku["BEV-002"].id, sellingPrice: "8.00", isAvailable: true },   // Vita: 6.50 → 8
    { strategyId: airportStrategy.id, productId: productBySku["BEV-003"].id, sellingPrice: "22.00", isAvailable: true },  // Red Bull: 18 → 22
    { strategyId: airportStrategy.id, productId: productBySku["BEV-004"].id, sellingPrice: "10.00", isAvailable: true },  // Coke Zero: 8 → 10
    { strategyId: airportStrategy.id, productId: productBySku["BEV-006"].id, sellingPrice: "38.00", isAvailable: true },  // Oat Latte: 32 → 38
    { strategyId: airportStrategy.id, productId: productBySku["SNK-003"].id, isAvailable: false },                        // KitKat Matcha: hidden
    { strategyId: airportStrategy.id, productId: productBySku["HOU-001"].id, isAvailable: false },                        // Tissue: not sold at airport
    { strategyId: airportStrategy.id, productId: productBySku["HOU-002"].id, isAvailable: false },                        // Dish soap: not sold at airport
  ]);

  // Assign strategies to locations
  await db.update(locations).set({ pricingStrategyId: standardStrategy.id }).where(eq(locations.id, mainLocationId));
  await db.update(locations).set({ pricingStrategyId: airportStrategy.id }).where(eq(locations.id, airportLocationId));

  console.log(`✅ Pricing strategies: Standard (${standardStrategy.id}), Airport Premium (${airportStrategy.id})`);
  console.log("   - Airport Premium: 5 beverage markups + 3 items hidden");

  // 5. Create demo users
  // Clear existing sessions + users for idempotent seeding
  await db.delete(sessions);
  await db.delete(users);

  const passwordHash = await hashPassword("demo1234");
  const adminPasswordHash = await hashPassword("admin1234");
  const pinHash = await hashPassword("1234");

  await db.insert(users).values([
    {
      tenantId: null,
      email: "admin@retailos.mo",
      name: "Platform Admin",
      passwordHash: adminPasswordHash,
      role: "platform_admin",
      posRole: null,
    },
    {
      tenantId,
      email: "owner@countingstars.mo",
      phone: "85312340001",
      name: "Chan Siu Man",
      passwordHash,
      pin: pinHash,
      role: "merchant_owner",
      posRole: "store_manager",
    },
    {
      tenantId,
      phone: "85312345678",
      name: "Wong Ah Ming",
      passwordHash,
      pin: pinHash,
      role: "cashier",
      posRole: "store_manager",
    },
    {
      tenantId,
      phone: "85398765432",
      name: "Lei Mei Ling",
      passwordHash,
      pin: pinHash,
      role: "cashier",
      posRole: "store_manager",
    },
    {
      tenantId,
      email: "acct@countingstars.mo",
      name: "Ho Ka Wai",
      passwordHash,
      role: "accountant",
      posRole: null,
    },
  ]);

  console.log("✅ Users: 5 demo users created");
  console.log("   - admin@retailos.mo / admin1234 (platform_admin)");
  console.log("   - owner@countingstars.mo / demo1234 + PIN 1234 (merchant_owner + store_manager)");
  console.log("   - 85312345678 / demo1234 + PIN 1234 (store_manager POS)");
  console.log("   - 85398765432 / demo1234 + PIN 1234 (cashier POS)");
  console.log("   - acct@countingstars.mo / demo1234 (accountant, no POS access)");

  // ─── Seed Terminals ───
  await db.delete(terminals);
  await db.insert(terminals).values([
    {
      tenantId,
      locationId: mainLocationId,
      name: "Counter 1",
      code: "T-001",
      location: "G/F Main Counter",
      status: "active",
      activatedAt: new Date(),
      lastHeartbeatAt: new Date(),
    },
    {
      tenantId,
      locationId: mainLocationId,
      name: "Counter 2",
      code: "T-002",
      location: "G/F Side Counter",
      status: "active",
      activatedAt: new Date(),
      lastHeartbeatAt: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago = offline
    },
    {
      tenantId,
      locationId: airportLocationId,
      name: "Airport Kiosk POS",
      code: "T-003",
      location: "Airport Departure Hall",
      status: "active",
      activationCode: "A3K9M2", // Not yet activated — for testing
    },
  ]);
  console.log("✅ Seeded 3 terminals (2 Main Store + 1 Airport Kiosk)");

  console.log(`\n🎉 Seed complete! Tenant ID: ${tenantId}\n`);

  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
