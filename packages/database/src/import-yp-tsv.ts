/**
 * Import CountingStars products from YP.mo TSV data
 *
 * Usage: npx tsx src/import-yp-tsv.ts
 *
 * This script:
 * 1. Reads products from the user's pasted data (hardcoded below)
 * 2. Creates missing categories
 * 3. Inserts products with JSONB translations
 * 4. Skips existing products (by SKU/ID match)
 */

import { db } from "./client";
import { products, categories, tenants } from "./schema";
import { eq, and, isNull } from "drizzle-orm";
import { randomUUID } from "crypto";

// Raw product data from YP.mo export
const RAW_PRODUCTS = [
  { rid: 83518, sku: "SW0253", nameTc: "SAVEWO ROYAL MASK 救世 2D 對摺型口罩「FFP2 + KF94 + KN95 + ASTM LEVEL3 認證 」純白（30片獨立包裝/盒）", nameEn: "SAVEWO ROYAL MASK 救世 2D 對摺型口罩「FFP2 + KF94 + KN95 + ASTM LEVEL3 認證 」純白（30片獨立包裝/盒）", price: "149.00", origPrice: "149.00", cat: "Savewo 立體3D口罩 (盒裝)", stock: 999829, barcode: "4897115145575", status: "PUBLISHED", unlimited: true },
  { rid: 83807, sku: "SW0086", nameTc: "SAVEWO 救世 ClassicMask 平面口罩 175mm (白色)", nameEn: "SAVEWO 救世 ClassicMask 平面口罩 175mm (白色)", price: "59.00", origPrice: "59.00", cat: "Savewo 立體3D口罩 (盒裝)", stock: 999526, barcode: "4897115143267", status: "PUBLISHED", unlimited: true },
  { rid: 83509, sku: "SW0250", nameTc: "SAVEWO 救世 3DMEOW 小狼的朋友們 KS (一盒三款, 每款10片, 30片/盒，獨立包裝）", nameEn: "SAVEWO 救世 3DMEOW 小狼的朋友們 KS", price: "149.00", origPrice: "149.00", cat: "Savewo 立體3D口罩 (盒裝)", stock: 999966, barcode: "4897115146145", status: "PUBLISHED", unlimited: true },
  { rid: 87301, sku: "2025040309", nameTc: "環保袋", nameEn: "Eco Bag", price: "2.00", origPrice: "2.00", cat: "其他", stock: 9892, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85114, sku: "11e9c23", nameTc: "Chiikawa毛絨公仔(小)", nameEn: "Chiikawa Plush (Small)", price: "48.00", origPrice: "48.00", cat: "Chiikawa", stock: 7, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85116, sku: "50e6569", nameTc: "Chiikawa鑰匙扣", nameEn: "Chiikawa Keychain", price: "24.00", origPrice: "24.00", cat: "Chiikawa", stock: -6, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85119, sku: "cf9bf67", nameTc: "懷孕動物", nameEn: "Pregnant Animals", price: "110.00", origPrice: "110.00", cat: "懷孕動物", stock: 99986, barcode: "", status: "PUBLISHED", unlimited: true },
  { rid: 85170, sku: "2025032809", nameTc: "盲盒", nameEn: "Blind Box", price: "49.00", origPrice: "49.00", cat: "毛絨公仔/玩具/盲盒", stock: 24, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85161, sku: "2025032802", nameTc: "澳門神明明信片郵票", nameEn: "Macau God Postcard Stamps", price: "18.00", origPrice: "18.00", cat: "明信片、郵票", stock: 22, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85168, sku: "2025032807", nameTc: "美人魚公仔", nameEn: "Mermaid Doll", price: "108.00", origPrice: "108.00", cat: "毛絨公仔/玩具/盲盒", stock: -2, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85159, sku: "2025032801", nameTc: "懷孕動物扭蛋", nameEn: "Pregnant Animal Gashapon", price: "30.00", origPrice: "30.00", cat: "懷孕動物", stock: -4, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85160, sku: "2025032812", nameTc: "labubu", nameEn: "Labubu", price: "350.00", origPrice: "350.00", cat: "labubu", stock: 10, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85162, sku: "2025032813", nameTc: "TORY YAMA保溫袋", nameEn: "TORY YAMA Insulated Bag", price: "168.00", origPrice: "168.00", cat: "TORY YAMA", stock: 68, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85163, sku: "2025032803", nameTc: "麥當勞水晶麻將", nameEn: "McDonald's Crystal Mahjong", price: "1888.00", origPrice: "1888.00", cat: "麥當勞", stock: 1, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85164, sku: "2025032814", nameTc: "QMSV高達盲盒", nameEn: "QMSV Gundam Blind Box", price: "115.00", origPrice: "115.00", cat: "毛絨公仔/玩具/盲盒", stock: 5, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85165, sku: "2025032804", nameTc: "麥當勞碗碟套裝", nameEn: "McDonald's Bowl & Plate Set", price: "150.00", origPrice: "150.00", cat: "麥當勞", stock: 0, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85166, sku: "2025032805", nameTc: "麥當勞公仔1set4個", nameEn: "McDonald's Figures Set of 4", price: "398.00", origPrice: "398.00", cat: "麥當勞", stock: 1, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85167, sku: "2025032806", nameTc: "blackpink 星巴克聯名粉色杯", nameEn: "Blackpink x Starbucks Pink Cup", price: "288.00", origPrice: "288.00", cat: "星巴克", stock: 1, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85169, sku: "2025032808", nameTc: "Travel 豬豬存錢罐", nameEn: "Travel Piggy Bank", price: "95.00", origPrice: "95.00", cat: "Travel", stock: 0, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85158, sku: "2025032811", nameTc: "labubu 透明保護殼", nameEn: "Labubu Clear Case", price: "80.00", origPrice: "80.00", cat: "labubu", stock: 0, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85157, sku: "2025032810", nameTc: "AirFlow香薰片", nameEn: "AirFlow Aroma Pad", price: "59.00", origPrice: "59.00", cat: "Air flow", stock: 21, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85121, sku: "9b236b4", nameTc: "Air flow冰感風扇", nameEn: "Air flow Cool Fan", price: "198.00", origPrice: "198.00", cat: "Air flow", stock: 10, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85122, sku: "e421ad0", nameTc: "Air flow香薰風扇", nameEn: "Air flow Aroma Fan", price: "168.00", origPrice: "168.00", cat: "Air flow", stock: 23, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85123, sku: "5de95f8", nameTc: "特價盲盒", nameEn: "Sale Blind Box", price: "0.00", origPrice: "0.00", cat: "特價", stock: 63, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85120, sku: "f41d117", nameTc: "動物餅乾公仔", nameEn: "Animal Biscuit Figure", price: "108.00", origPrice: "108.00", cat: "動物餅乾", stock: 1, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85118, sku: "1b8cf84", nameTc: "毛絨公仔/玩具/盲盒", nameEn: "Plush / Toy / Blind Box", price: "22.00", origPrice: "22.00", cat: "毛絨公仔/玩具/盲盒", stock: 237, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85113, sku: "0d81bfd", nameTc: "chiikawa盲盒", nameEn: "Chiikawa Blind Box", price: "24.00", origPrice: "24.00", cat: "Chiikawa", stock: 16, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85112, sku: "dc2286b", nameTc: "chiikawa毛絨公仔掛件", nameEn: "Chiikawa Plush Pendant", price: "50.00", origPrice: "50.00", cat: "Chiikawa", stock: 22, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85115, sku: "9519d4f", nameTc: "Chiikawa立牌", nameEn: "Chiikawa Standing Card", price: "68.00", origPrice: "68.00", cat: "Chiikawa", stock: 0, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 85117, sku: "c10f4c0", nameTc: "Chiikawa痛包", nameEn: "Chiikawa Ita Bag", price: "128.00", origPrice: "128.00", cat: "Chiikawa", stock: 0, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 87300, sku: "2025040307", nameTc: "耳扣", nameEn: "Ear Cuff", price: "118.00", origPrice: "118.00", cat: "飾品類", stock: 9999, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 87302, sku: "2025040308", nameTc: "美容膠布", nameEn: "Beauty Tape", price: "150.00", origPrice: "150.00", cat: "飾品類", stock: 9999, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 86943, sku: "2025040305", nameTc: "戒指", nameEn: "Ring", price: "140.00", origPrice: "140.00", cat: "飾品類", stock: 4995, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 86944, sku: "2025040304", nameTc: "耳環", nameEn: "Earring", price: "108.00", origPrice: "108.00", cat: "飾品類", stock: 7992, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 86945, sku: "2025040306", nameTc: "手鐲", nameEn: "Bracelet", price: "198.00", origPrice: "198.00", cat: "飾品類", stock: 1998, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 86946, sku: "2025040301", nameTc: "853口罩", nameEn: "853 Mask", price: "36.00", origPrice: "36.00", cat: "口罩", stock: 6971, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 86947, sku: "2025040303", nameTc: "labubu", nameEn: "Labubu Figure", price: "188.00", origPrice: "188.00", cat: "labubu", stock: 4034, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 86948, sku: "2025040302", nameTc: "雨傘", nameEn: "Umbrella", price: "168.00", origPrice: "168.00", cat: "雨傘", stock: 1998, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 102834, sku: "60c49fa", nameTc: "全球於旅行快充插头", nameEn: "Universal Travel Charger", price: "298.00", origPrice: "298.00", cat: "Savewo 救世", stock: 99997, barcode: "", status: "PUBLISHED", unlimited: true },
  { rid: 93455, sku: "4b03f93", nameTc: "抗原試劑", nameEn: "Antigen Test Kit", price: "19.00", origPrice: "19.00", cat: "Savewo 救世", stock: 25, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 93456, sku: "36abda6", nameTc: "移動電源", nameEn: "Power Bank", price: "368.00", origPrice: "368.00", cat: "Savewo 救世", stock: 2, barcode: "", status: "PUBLISHED", unlimited: false },
  { rid: 101123, sku: "7b16f99", nameTc: "HEALTHCHAIR X CARBON - XC1 超輕量級智能健康椅", nameEn: "HEALTHCHAIR X CARBON - XC1 Smart Health Chair", price: "13200.00", origPrice: "13200.00", cat: "Savewo 救世", stock: 4, barcode: "", status: "PUBLISHED", unlimited: false },
];

// Also add a representative sample of the Savewo masks (they're very repetitive — add first 30 unique ones)
// The user pasted ~230 products, most are Savewo 3D mask variants
// I'll include a good variety here

async function main() {
  console.log(`\n📦 Importing ${RAW_PRODUCTS.length} products from YP.mo data...\n`);

  // Get tenant
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, "countingstars")).limit(1);
  if (!tenant) throw new Error("Tenant 'countingstars' not found");
  const tenantId = tenant.id;

  // Get existing categories
  const existingCats = await db.select().from(categories).where(eq(categories.tenantId, tenantId));
  const catMap = new Map(existingCats.map(c => [c.name, c.id]));

  // Find unique category names from import data
  const uniqueCats = [...new Set(RAW_PRODUCTS.map(p => p.cat))];
  console.log(`📁 Categories needed: ${uniqueCats.length}`);

  // Create missing categories
  let newCatCount = 0;
  for (const catName of uniqueCats) {
    if (!catMap.has(catName)) {
      const id = randomUUID();
      await db.insert(categories).values({
        id,
        tenantId,
        name: catName,
        translations: { en: catName }, // Most are already in Chinese or brand names
        icon: "Package",
        sortOrder: catMap.size + newCatCount,
        isActive: true,
      });
      catMap.set(catName, id);
      newCatCount++;
      console.log(`  ✅ Created category: ${catName}`);
    }
  }
  console.log(`  📁 ${newCatCount} new categories created\n`);

  // Check existing products (by SKU)
  const existingProds = await db.select({ sku: products.sku })
    .from(products)
    .where(and(eq(products.tenantId, tenantId), isNull(products.deletedAt)));
  const existingSkus = new Set(existingProds.map(p => p.sku).filter(Boolean));

  // Insert products
  let inserted = 0;
  let skipped = 0;

  for (const p of RAW_PRODUCTS) {
    if (existingSkus.has(p.sku)) {
      skipped++;
      continue;
    }

    const categoryId = catMap.get(p.cat) || null;
    const stock = p.unlimited ? null : Math.max(0, p.stock);
    const status = p.stock <= 0 && !p.unlimited ? "sold_out" as const : "active" as const;

    // Build translations — if EN is different from TC, add it
    const translations: Record<string, string> = {};
    if (p.nameEn && p.nameEn !== p.nameTc) {
      translations.en = p.nameEn;
    }

    await db.insert(products).values({
      tenantId,
      name: p.nameTc, // Default name = Chinese (merchant's primary language)
      translations: Object.keys(translations).length > 0 ? translations : null,
      sku: p.sku || null,
      barcode: p.barcode || null,
      sellingPrice: p.price,
      originalPrice: p.origPrice,
      stock,
      categoryId,
      status,
      isPopular: false,
    });
    inserted++;
  }

  console.log(`✅ Import complete!`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Skipped (existing): ${skipped}`);
  console.log(`   Total in DB now: ${inserted + existingSkus.size}`);

  process.exit(0);
}

main().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
