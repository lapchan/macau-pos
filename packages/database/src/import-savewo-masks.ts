/**
 * Import Savewo facemask products from store.savewo.com scraped data.
 * Downloads product images and stores them as static files.
 *
 * Usage: npx tsx packages/database/src/import-savewo-masks.ts
 */

import "dotenv/config";
import { db } from "./client";
import { products, categories, tenants } from "./schema";
import { eq, and, isNull } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data/savewo-facemask-products.json");
const IMAGE_DIR = path.resolve(__dirname, "../../../apps/cashier/public/products");

type ScrapedProduct = {
  slug: string;
  img: string;
  name: string;
  price: string;
};

// Download image from URL to local file
function downloadImage(url: string, filepath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url || fs.existsSync(filepath)) {
      resolve(fs.existsSync(filepath));
      return;
    }
    const file = fs.createWriteStream(filepath);
    https.get(url, (res) => {
      if (res.statusCode !== 200) { file.close(); resolve(false); return; }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(true); });
    }).on("error", () => { file.close(); resolve(false); });
  });
}

// Clean up product name
function cleanName(raw: string): string {
  return raw
    .replace(/^\*[^*]+\*\s*/, "") // Remove *R 標準碼* prefix
    .replace(/[「」]/g, "")
    .trim();
}

// Determine sub-category from product name
function categorize(name: string): string {
  if (name.includes("REGAL")) return "regal";
  if (name.includes("ROYAL")) return "royal";
  if (name.includes("ULTRA")) return "ultra";
  if (name.includes("3DMEOW") || name.includes("立體喵")) return "3dmeow";
  if (name.includes("3DBEAR") || name.includes("立體啤")) return "3dbear";
  if (name.includes("3DMASK") && name.includes("Kids")) return "kids";
  if (name.includes("3DMASK") && name.includes("Kuro")) return "kuro";
  if (name.includes("3DMASK") && name.includes("Hana")) return "hana";
  if (name.includes("3DMASK") && name.includes("Memories")) return "memories";
  if (name.includes("3DMASK")) return "3dmask";
  if (name.includes("ClassicMask") || name.includes("平面")) return "classic";
  return "other";
}

async function main() {
  console.log("\n🎭 Importing Savewo facemask products...\n");

  // 1. Load scraped data
  const rawData: ScrapedProduct[] = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  console.log(`📦 Loaded ${rawData.length} products from JSON`);

  // 2. Get tenant
  const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, "countingstars")).limit(1);
  if (!tenant) throw new Error("Tenant not found");
  const tenantId = tenant.id;

  // 3. Get/create categories
  const existingCats = await db.select().from(categories).where(eq(categories.tenantId, tenantId));
  const catMap = new Map(existingCats.map((c) => [c.name, c.id]));

  // Find parent category
  let parentCatId = existingCats.find((c) => c.name === "口罩/呼吸器")?.id;
  if (!parentCatId) {
    const [newCat] = await db.insert(categories).values({
      tenantId, name: "口罩/呼吸器", translations: { en: "Facemask & Respirator" }, icon: "Shield", sortOrder: 0, isActive: true,
    }).returning({ id: categories.id });
    parentCatId = newCat.id;
    catMap.set("口罩/呼吸器", parentCatId);
  }

  // Ensure "Savewo 立體3D口罩 (盒裝)" exists as child
  let cat3dId = catMap.get("Savewo 立體3D口罩 (盒裝)");
  if (!cat3dId) {
    const [c] = await db.insert(categories).values({
      tenantId, name: "Savewo 立體3D口罩 (盒裝)", parentCategoryId: parentCatId, translations: { en: "Savewo 3D Masks (Boxed)" }, icon: "Shield", sortOrder: 1, isActive: true,
    }).returning({ id: categories.id });
    cat3dId = c.id;
  }

  let catFlatId = catMap.get("Savewo 平⾯⼝罩 (盒裝)") || catMap.get("Savewo 平面口罩 (盒裝)");
  if (!catFlatId) {
    const [c] = await db.insert(categories).values({
      tenantId, name: "Savewo 平面口罩 (盒裝)", parentCategoryId: parentCatId, translations: { en: "Savewo Flat Masks (Boxed)" }, icon: "Shield", sortOrder: 2, isActive: true,
    }).returning({ id: categories.id });
    catFlatId = c.id;
  }

  // 4. Create image directory
  fs.mkdirSync(IMAGE_DIR, { recursive: true });

  // 5. Get existing SKUs to avoid duplicates
  const existingProducts = await db.select({ sku: products.sku }).from(products).where(and(eq(products.tenantId, tenantId), isNull(products.deletedAt)));
  const existingSkus = new Set(existingProducts.map((p) => p.sku).filter(Boolean));
  const existingSlugs = new Set<string>();

  // 6. Import products
  let imported = 0;
  let skipped = 0;
  let imagesDownloaded = 0;

  for (const item of rawData) {
    // Use slug as SKU
    const sku = item.slug;
    if (existingSkus.has(sku) || existingSlugs.has(sku)) {
      skipped++;
      continue;
    }
    existingSlugs.add(sku);

    const name = cleanName(item.name);
    const price = item.price || "0";
    const cat = categorize(item.name);
    const categoryId = cat === "classic" ? catFlatId : cat3dId;

    // Download image if available
    let imagePath: string | null = null;
    if (item.img) {
      const ext = item.img.includes(".png") ? ".png" : ".jpg";
      const filename = `${sku}${ext}`;
      const localPath = path.join(IMAGE_DIR, filename);
      // Use resized version (300px wide) for thumbnail
      const imgUrl = item.img + "/300x";
      const ok = await downloadImage(imgUrl, localPath);
      if (ok) {
        imagePath = `/products/${filename}`;
        imagesDownloaded++;
      }
    }

    try {
      await db.insert(products).values({
        tenantId,
        name,
        translations: {},
        sku,
        sellingPrice: price,
        originalPrice: null,
        stock: null, // unlimited
        categoryId,
        status: "active",
        isPopular: false,
        image: imagePath,
      });
      imported++;
      if (imported % 10 === 0) process.stdout.write(`  ${imported}...`);
    } catch (err) {
      console.error(`\n  ❌ Failed: ${name}: ${err}`);
    }
  }

  console.log(`\n\n📊 Import complete:`);
  console.log(`  ✅ Imported: ${imported}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  🖼️  Images: ${imagesDownloaded}`);
  console.log(`  📦 Total products: ${existingProducts.length + imported}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
