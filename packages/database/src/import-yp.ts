/**
 * Import products from YP.mo Excel export into the database.
 * Updated for JSONB translations schema.
 *
 * Usage:
 *   npx tsx src/import-yp.ts /path/to/export.xlsx
 */

import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import XLSX from "xlsx";
import { tenants, categories, products } from "./schema";
import { eq } from "drizzle-orm";

const { Pool } = pg;

// Category → icon mapping
const CATEGORY_ICONS: Record<string, string> = {
  "Savewo 立體3D口罩 (盒裝)": "Shield",
  "Savewo 救世": "Shield",
  "Savewo 平⾯⼝罩 (盒裝)": "Shield",
  Chiikawa: "Cat",
  飾品類: "Gem",
  "毛絨公仔/玩具/盲盒": "Gift",
  labubu: "Smile",
  "Air flow": "Wind",
  麥當勞: "Utensils",
  懷孕動物: "Baby",
  其他: "MoreHorizontal",
  口罩: "Shield",
  "明信片、郵票": "Mail",
  動物餅乾: "Cookie",
  特價: "Tag",
  雨傘: "Umbrella",
  "TORY YAMA": "Mountain",
  星巴克: "Coffee",
  Travel: "Plane",
};

interface ExcelRow {
  nameTc: string;
  nameEn: string;
  status: string;
  sellingPrice: number;
  originalPrice: number;
  unlimitedStock: boolean;
  category: string;
  descTc: string;
  descEn: string;
  sortOrder: number;
  stock: number;
  barcode: string;
  sku: string;
}

function parseXlsx(filePath: string): ExcelRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  return rows.map((row) => ({
    sku: String(row["ID"] || ""),
    nameTc: String(row["招牌名TC"] || ""),
    nameEn: String(row["招牌名EN"] || ""),
    status: String(row["狀態"] || ""),
    sellingPrice: Number(row["售價"]) || 0,
    originalPrice: Number(row["原價"]) || 0,
    unlimitedStock: row["是否不限庫存"] === true || row["是否不限庫存"] === "True",
    category: String(row["自定義分類"] || "(uncategorized)"),
    descTc: String(row["簡介TC"] || ""),
    descEn: String(row["簡介EN"] || ""),
    sortOrder: Number(row["排序"]) || 0,
    stock: Number(row["庫存"]) || 0,
    barcode: String(row["條碼"] || ""),
  }));
}

async function importProducts() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx src/import-yp.ts <path-to-xlsx>");
    process.exit(1);
  }

  console.log(`📂 Reading: ${filePath}`);
  const rows = parseXlsx(filePath);
  console.log(`📋 Found ${rows.length} products\n`);

  // Connect to DB
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  // Get tenant
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, "countingstars"));

  if (!tenant) {
    console.error("❌ Tenant 'countingstars' not found. Run db:seed first.");
    process.exit(1);
  }
  const tenantId = tenant.id;
  console.log(`🏪 Tenant: CountingStars (${tenantId})\n`);

  // Extract unique categories
  const uniqueCategories = [...new Set(rows.map((r) => r.category))].filter(
    (c) => c !== "(uncategorized)"
  );
  console.log(`📁 Categories (${uniqueCategories.length}):`);
  uniqueCategories.forEach((c) =>
    console.log(`   - ${c} (${rows.filter((r) => r.category === c).length} products)`)
  );

  // Clear existing data for this tenant
  await db.delete(products).where(eq(products.tenantId, tenantId));
  await db.delete(categories).where(eq(categories.tenantId, tenantId));
  console.log(`\n🗑  Cleared existing products and categories`);

  // Insert categories with JSONB translations
  const insertedCategories = await db
    .insert(categories)
    .values(
      uniqueCategories.map((name, i) => ({
        tenantId,
        name, // Chinese name as default
        translations: {}, // No English translation for brand names like "Chiikawa", "labubu"
        icon: CATEGORY_ICONS[name] || "Package",
        sortOrder: i,
      }))
    )
    .returning();

  const catMap = Object.fromEntries(
    insertedCategories.map((c) => [c.name, c.id])
  );
  console.log(`✅ Inserted ${insertedCategories.length} categories`);

  // Insert products in batches of 50 with JSONB translations
  const BATCH_SIZE = 50;
  let totalInserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = batch.map((row, idx) => {
      // Build translations JSONB — only include non-empty values
      const translations: Record<string, string> = {};
      if (row.nameEn && row.nameEn.trim()) translations.en = row.nameEn.trim();

      return {
        tenantId,
        categoryId: catMap[row.category] || null,
        // Chinese name as default (or English if no Chinese)
        name: row.nameTc || row.nameEn,
        translations,
        description: row.descTc || null,
        descTranslations: row.descEn ? { en: row.descEn } : {},
        sku: row.sku || null,
        barcode: row.barcode || null,
        sellingPrice: row.sellingPrice.toFixed(2),
        originalPrice: row.originalPrice.toFixed(2),
        stock: row.unlimitedStock ? null : row.stock,
        status: row.status === "PUBLISHED" ? ("active" as const) : ("draft" as const),
        isPopular: false,
        sortOrder: i + idx,
      };
    });

    await db.insert(products).values(values);
    totalInserted += batch.length;
    process.stdout.write(
      `\r📦 Imported ${totalInserted}/${rows.length} products`
    );
  }

  console.log(`\n\n🎉 Import complete!`);
  console.log(`   Tenant:     CountingStars (${tenantId})`);
  console.log(`   Categories: ${insertedCategories.length}`);
  console.log(`   Products:   ${totalInserted}`);

  await pool.end();
}

importProducts().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
