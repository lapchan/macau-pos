/**
 * Seed variants for existing YP products.
 * Consolidates color variants from separate products into a parent + variant structure.
 *
 * Usage: cd packages/database && npx tsx src/seed-variants.ts
 */

import "dotenv/config";
import { db } from "./client";
import { products, optionGroups, optionValues, productVariants, tenants } from "./schema";
import { eq, and, sql, isNull } from "drizzle-orm";

const VARIANT_GROUPS = [
  {
    parentName: "SAVEWO MagCell 5000mAh PowerBank",
    parentNameEn: "SAVEWO MagCell 5000mAh PowerBank",
    searchPattern: "%MagCell 5000mAh Wireless PowerBank%",
    optionGroupName: "顏色",
    optionGroupEn: "Color",
    price: "398.00",
    extractColor: (name: string) => {
      const m = name.match(/\((.+)\)$/);
      return m ? m[1] : name.split(" ").pop() || name;
    },
  },
  {
    parentName: "SAVEWO AirFlow 掛頸風扇",
    parentNameEn: "SAVEWO AirFlow Neck Fan",
    searchPattern: "%AirFlow 掛頸%",
    optionGroupName: "顏色",
    optionGroupEn: "Color",
    price: "299.00",
    extractColor: (name: string) => {
      // "SAVEWO AirFlow 掛頸⾵扇 奶茶⾊" → "奶茶⾊"
      return name.split(" ").pop() || name;
    },
  },
  {
    parentName: "SAVEWO RAINEC AIR 折疊傘",
    parentNameEn: "SAVEWO RAINEC AIR Foldable Umbrella",
    searchPattern: "%RAINEC AIR Foldable Umbrella%",
    optionGroupName: "顏色",
    optionGroupEn: "Color",
    price: "168.00",
    extractColor: (name: string) => {
      const m = name.match(/\((.+)\)$/);
      return m ? m[1] : name;
    },
  },
  {
    parentName: "SAVEWO RAINEC MINI PRO 折疊傘",
    parentNameEn: "SAVEWO RAINEC MINI PRO Foldable Umbrella",
    searchPattern: "%RAINEC MINI PRO Foldable Umbrella%",
    optionGroupName: "顏色",
    optionGroupEn: "Color",
    price: "238.00",
    extractColor: (name: string) => {
      const m = name.match(/\((.+)\)$/);
      return m ? m[1] : name;
    },
  },
  {
    parentName: "SAVEWO PowerCable USB-C 磁吸充電線",
    parentNameEn: "SAVEWO PowerCable USB-C Magnetic 1M",
    searchPattern: "%PowerCable USB-C Magnetic%",
    optionGroupName: "顏色",
    optionGroupEn: "Color",
    price: "129.00",
    extractColor: (name: string) => {
      return name.split(" - ").pop() || name;
    },
  },
];

async function main() {
  console.log("\n🎨 Seeding product variants...\n");

  // Get tenant
  const [tenant] = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, "countingstars")).limit(1);
  if (!tenant) throw new Error("Tenant not found");
  const tenantId = tenant.id;

  for (const group of VARIANT_GROUPS) {
    console.log(`\n📦 ${group.parentName}`);

    // Find matching products
    const matchingProducts = await db
      .select({ id: products.id, name: products.name, sku: products.sku, barcode: products.barcode, categoryId: products.categoryId })
      .from(products)
      .where(and(
        eq(products.tenantId, tenantId),
        sql`${products.name} LIKE ${group.searchPattern}`,
        isNull(products.deletedAt)
      ));

    if (matchingProducts.length < 2) {
      console.log(`  ⏭️  Only ${matchingProducts.length} products found, skipping`);
      continue;
    }

    console.log(`  Found ${matchingProducts.length} color variants`);

    // Use first product as parent, mark it as has_variants
    const parent = matchingProducts[0];
    await db.update(products).set({
      name: group.parentName,
      translations: { en: group.parentNameEn },
      hasVariants: true,
      sellingPrice: group.price,
    }).where(eq(products.id, parent.id));

    console.log(`  ✅ Parent: ${group.parentName} (${parent.id})`);

    // Create option group
    const [optGroup] = await db.insert(optionGroups).values({
      tenantId,
      productId: parent.id,
      name: group.optionGroupName,
      translations: { en: group.optionGroupEn },
      sortOrder: 0,
    }).returning({ id: optionGroups.id });

    // Create option values + variants
    for (let i = 0; i < matchingProducts.length; i++) {
      const mp = matchingProducts[i];
      const colorName = group.extractColor(mp.name);

      // Add option value
      await db.insert(optionValues).values({
        groupId: optGroup.id,
        value: colorName,
        translations: {},
        sortOrder: i,
      });

      // Create product variant
      await db.insert(productVariants).values({
        tenantId,
        productId: parent.id,
        name: `${group.parentName} · ${colorName}`,
        sku: mp.sku,
        barcode: mp.barcode,
        sellingPrice: group.price,
        stock: null, // unlimited
        optionCombo: { [group.optionGroupName]: colorName },
        isActive: true,
        sortOrder: i,
      });

      console.log(`  + ${colorName}`);

      // Soft-delete the child product (except parent)
      if (mp.id !== parent.id) {
        await db.update(products).set({ deletedAt: new Date() }).where(eq(products.id, mp.id));
      }
    }

    console.log(`  ✅ ${matchingProducts.length} variants created`);
  }

  console.log("\n✅ Variant seeding complete!\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
