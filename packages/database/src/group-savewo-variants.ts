/**
 * Group Savewo products into parent + variants
 * Usage: cd packages/database && DATABASE_URL="..." npx tsx src/group-savewo-variants.ts
 */
import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

type VariantGroup = {
  parentName: string;
  optionGroupName: string;
  optionGroupNameEn: string;
  variants: {
    optionValue: string;
    skus: string[]; // find by any of these SKUs
  }[];
};

// ─── Define all variant groups ─────────────────────────────
const GROUPS: VariantGroup[] = [
  // 1. 3DBEAR 立體啤幼兒 (Color)
  {
    parentName: "SAVEWO 3DBEAR 立體啤幼兒 6-24月",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "粉紅色 Pink", skus: ["SW0016"] },
      { optionValue: "粉藍色 Blue", skus: ["SW0017"] },
      { optionValue: "純白色 White", skus: ["SW0018"] },
    ],
  },
  // 2. 3DMASK Hana S Collection (Flower)
  {
    parentName: "SAVEWO 3DMASK Hana S Collection",
    optionGroupName: "花色", optionGroupNameEn: "Flower",
    variants: [
      { optionValue: "河津櫻 Sakura", skus: ["SW0015"] },
      { optionValue: "綠桔梗 Eustoma", skus: ["SW0012"] },
      { optionValue: "薰衣草 Lavender", skus: ["SW0013"] },
      { optionValue: "藍雪花 Plumbago", skus: ["SW0011"] },
      { optionValue: "風鈴木 Yellow Pui", skus: ["SW0014"] },
    ],
  },
  // 3. Hana R Collection — already created, skip (SW0010 is parent)

  // 4. 3DMASK Kids (Size)
  {
    parentName: "SAVEWO 3DMASK Kids 超立體兒童防護口罩",
    optionGroupName: "尺碼", optionGroupNameEn: "Size",
    variants: [
      { optionValue: "S 細碼 2-6歲", skus: ["SW0049"] },
      { optionValue: "L2 大碼 7-13歲", skus: ["SW0051"] },
    ],
  },
  // 5. 3DMASK Kuro Collection (Color × Size)
  // These have 2 option groups: Color + Size
  // M碼: SW0001(黑), SW0002(灰), SW0003(綠), SW0004(藍)
  // L碼: SW0056(黑), SW0059(灰), SW0060(綠), SW0061(藍)
  {
    parentName: "SAVEWO 3DMASK Kuro Collection",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "暗魂黑 DarkSoul Black", skus: ["SW0001", "SW0056"] },
      { optionValue: "城堡灰 Castle Grey", skus: ["SW0002", "SW0059"] },
      { optionValue: "森林綠 Forest Green", skus: ["SW0003", "SW0060"] },
      { optionValue: "深海藍 Deepsea Blue", skus: ["SW0004", "SW0061"] },
    ],
  },
  // 6. 3DMASK Memories 30pcs (Scent)
  {
    parentName: "SAVEWO 3DMASK Memories R 30pcs",
    optionGroupName: "香味", optionGroupNameEn: "Scent",
    variants: [
      { optionValue: "丁香", skus: ["SW0142"] },
      { optionValue: "乾燥玫瑰", skus: ["SW0140"] },
      { optionValue: "夜海", skus: ["SW0144"] },
      { optionValue: "晨霧", skus: ["SW0143"] },
      { optionValue: "焙茶", skus: ["SW0141"] },
      { optionValue: "紫滕", skus: ["SW0306"] },
      { optionValue: "落日珊瑚", skus: ["SW0139"] },
    ],
  },
  // 7. 3DMASK Memories 6pk (Scent)
  {
    parentName: "SAVEWO 3DMASK Memories 6pk 試用裝",
    optionGroupName: "香味", optionGroupNameEn: "Scent",
    variants: [
      { optionValue: "夜海", skus: ["SW0162"] },
      { optionValue: "晨霧", skus: ["SW0161"] },
      { optionValue: "焙茶", skus: ["SW0163"] },
    ],
  },
  // 8. 3DMASK ULTRA (Size)
  {
    parentName: "SAVEWO 3DMASK ULTRA TYPECOOL+",
    optionGroupName: "尺碼", optionGroupNameEn: "Size",
    variants: [
      { optionValue: "S", skus: ["SW0145"] },
      { optionValue: "M 標準碼", skus: ["SW0137"] },
      { optionValue: "R 標準碼", skus: ["SW0124"] },
      { optionValue: "L 大碼", skus: ["SW0123"] },
    ],
  },
  // 9. 3DMEOW FOR KIDS S2 (Color)
  {
    parentName: "SAVEWO 3DMEOW 兒童 S2 2-6歲",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "粉紅 Pink", skus: ["SW0019"] },
      { optionValue: "粉藍 Blue", skus: ["SW0020"] },
      { optionValue: "純白 White", skus: ["SW0021"] },
    ],
  },
  // 10. 3DMEOW FOR KIDS L2 (Color)
  {
    parentName: "SAVEWO 3DMEOW 兒童 L2 7-13歲",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "粉紅 Pink", skus: ["SW0022"] },
      { optionValue: "粉藍 Blue", skus: ["SW0023"] },
      { optionValue: "純白 White", skus: ["SW0024"] },
    ],
  },
  // 11. 3DMEOW 立體喵頑童 ADT (Color)
  {
    parentName: "SAVEWO 3DMEOW 立體喵頑童 ADT",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "白色", skus: ["SW0202"] },
      { optionValue: "灰色", skus: ["SW0203"] },
      { optionValue: "綠色", skus: ["SW0204"] },
      { optionValue: "黑色", skus: ["SW0201"] },
    ],
  },
  // 12. AirFlow COOL FAN (Color)
  {
    parentName: "SAVEWO AirFlow 酷冰風扇",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "白色", skus: ["SW0331"] },
      { optionValue: "黑色", skus: ["SW0330"] },
    ],
  },
  // 13. AirFlow 掛頸風扇 (Color)
  {
    parentName: "SAVEWO AirFlow 掛頸風扇",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "純白色", skus: ["SW0312"] },
      { optionValue: "奶茶色", skus: ["SW0328"] },
      { optionValue: "薄荷色", skus: ["SW0329"] },
    ],
  },
  // 14. ClassicMask 125mm 兒童細碼 (Color)
  {
    parentName: "SAVEWO ClassicMask 125mm 兒童細碼",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "白色", skus: ["SW0175"] },
      { optionValue: "灰色", skus: ["SW0177"] },
      { optionValue: "黑色", skus: ["SW0176"] },
    ],
  },
  // 15. ClassicMask 145mm 兒童大碼 (Color)
  {
    parentName: "SAVEWO ClassicMask 145mm 兒童大碼",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "白色", skus: ["SW0178"] },
      { optionValue: "灰色", skus: ["SW0180"] },
      { optionValue: "黑色", skus: ["SW0179"] },
    ],
  },
  // 16. ClassicMask 160mm 成人細碼 (Color)
  {
    parentName: "SAVEWO ClassicMask 160mm 成人細碼",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "白色", skus: ["SW0181"] },
      { optionValue: "灰色", skus: ["SW0183"] },
      { optionValue: "黑色", skus: ["SW0182"] },
    ],
  },
  // 17. ClassicMask 175mm (Color)
  {
    parentName: "SAVEWO ClassicMask 175mm",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "白色", skus: ["SW0085", "SW0086"] },
      { optionValue: "灰色", skus: ["SW0086-g"] },
      { optionValue: "黑色", skus: ["SW0084"] },
    ],
  },
  // 18. MagCell 5000mAh PowerBank (Color)
  {
    parentName: "SAVEWO MagCell 5000mAh Wireless PowerBank",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "銀灰", skus: ["SW0314"] },
      { optionValue: "冰藍", skus: ["SW0315"] },
      { optionValue: "薄荷綠", skus: ["SW0316"] },
      { optionValue: "鈦原色", skus: ["SW0317"] },
      { optionValue: "櫻花粉", skus: ["SW0318"] },
      { optionValue: "銀白", skus: ["SW0319"] },
      { optionValue: "鈦藍色", skus: ["SW0320"] },
      { optionValue: "金色", skus: ["SW0313"] },
    ],
  },
  // 19. PowerCable USB-C Magnetic (Color)
  {
    parentName: "SAVEWO PowerCable USB-C Magnetic 1M",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "Black", skus: ["SW0322"] },
      { optionValue: "Blue", skus: ["SW0321-c", "SW0321"] },
      { optionValue: "Citrine", skus: ["SW0323"] },
      { optionValue: "Mint", skus: ["SW0324"] },
      { optionValue: "Pink", skus: ["SW0325"] },
      { optionValue: "White", skus: ["SW0326"] },
    ],
  },
  // 20. RAINEC AIR (Color)
  {
    parentName: "SAVEWO RAINEC AIR Foldable Umbrella",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "Celestine", skus: ["SW0262"] },
      { optionValue: "Dusty Rose", skus: ["SW0261"] },
      { optionValue: "Green Vines", skus: ["SW0263"] },
      { optionValue: "Grey", skus: ["SW0264"] },
      { optionValue: "Nightsea", skus: ["SW0260"] },
    ],
  },
  // 21. RAINEC MINI PRO (Pattern)
  {
    parentName: "SAVEWO RAINEC MINI PRO Foldable Umbrella",
    optionGroupName: "圖案", optionGroupNameEn: "Pattern",
    variants: [
      { optionValue: "芒草 Miscanthus", skus: ["SW0257"] },
      { optionValue: "花瓣 Petal", skus: ["SW0258"] },
      { optionValue: "銀葉艾 Silver Wormwood", skus: ["SW0259"] },
    ],
  },
  // 22. ROYAL MASK 2D (Color)
  {
    parentName: "SAVEWO ROYAL MASK 2D FFP2",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "純白", skus: ["SW0253"] },
      { optionValue: "晨霧", skus: ["SW0254"] },
      { optionValue: "桂枝", skus: ["SW0255"] },
      { optionValue: "酷黑", skus: ["SW0256"] },
      { optionValue: "蝶豆花", skus: ["SW0285"] },
      { optionValue: "青檸", skus: ["SW0286"] },
    ],
  },
  // 23. AirFlow Solid Aroma (Scent)
  {
    parentName: "Savewo AirFlow Solid Aroma 10Pcs",
    optionGroupName: "香味", optionGroupNameEn: "Scent",
    variants: [
      { optionValue: "Bergamot 佛手柑", skus: ["SW0309"] },
      { optionValue: "Camellia 山茶花", skus: ["SW0310"] },
      { optionValue: "Freesia 小蒼蘭", skus: ["SW0311"] },
    ],
  },
  // 24. X EVANGELION MagCell (Design)
  {
    parentName: "SAVEWO X EVANGELION MagCell 5000mAh",
    optionGroupName: "款式", optionGroupNameEn: "Design",
    variants: [
      { optionValue: "初號機 紫綠", skus: ["SW0276"] },
      { optionValue: "緊急狀態 黑紅", skus: ["SW0277"] },
    ],
  },
  // 25. Memories ClassicMask 175mm (Color)
  {
    parentName: "SAVEWO Memories ClassicMask 175mm",
    optionGroupName: "顏色", optionGroupNameEn: "Color",
    variants: [
      { optionValue: "Evening Glow", skus: ["SW0231"] },
      { optionValue: "Forest", skus: ["SW0232"] },
      { optionValue: "The Earthy", skus: ["SW0234"] },
      { optionValue: "Twilight", skus: ["SW0233"] },
      { optionValue: "Warm", skus: ["SW0265"] },
    ],
  },
  // 26. Premium Mask TypeCool+ — complex: Color × Size
  // Skip for now — too many combos, handle manually later

  // 27. HEPA Filters (Grade)
  {
    parentName: "SAVEWO HEPA 活性碳濾網 (TGP-X系列)",
    optionGroupName: "等級", optionGroupNameEn: "Grade",
    variants: [
      { optionValue: "H12", skus: ["SW0147"] },
      { optionValue: "H13", skus: ["SW0148"] },
    ],
  },
  // 28. 抗原快測試劑 (Type)
  {
    parentName: "SAVEWO 抗原快測試劑",
    optionGroupName: "類型", optionGroupNameEn: "Type",
    variants: [
      { optionValue: "六合一", skus: ["SP00634"] },
      { optionValue: "九合一", skus: ["SP00641"] },
    ],
  },
];

async function main() {
  const client = await pool.connect();

  try {
    // Get tenant
    const { rows: [tenant] } = await client.query("SELECT id FROM tenants WHERE slug = 'countingstars'");
    const tenantId = tenant.id;

    let totalGrouped = 0;
    let totalVariants = 0;
    let totalDeleted = 0;

    for (const group of GROUPS) {
      console.log(`\n📦 ${group.parentName}`);

      // Collect all product IDs for this group
      const allSkus = group.variants.flatMap(v => v.skus);
      const { rows: products } = await client.query(
        "SELECT id, sku, name, selling_price, original_price, stock, barcode FROM products WHERE tenant_id = $1 AND sku = ANY($2) AND deleted_at IS NULL",
        [tenantId, allSkus]
      );

      if (products.length === 0) {
        console.log("  ⏭️ No matching products found, skipping");
        continue;
      }

      // Check if parent already has variants (already processed)
      const parentProduct = products[0];
      const { rows: [existing] } = await client.query(
        "SELECT has_variants FROM products WHERE id = $1",
        [parentProduct.id]
      );
      if (existing?.has_variants) {
        console.log("  ⏭️ Already has variants, skipping");
        continue;
      }

      // Use first product as parent
      const parentId = parentProduct.id;
      const basePrice = parentProduct.selling_price;

      // Update parent: rename + mark has_variants
      await client.query(
        "UPDATE products SET name = $1, has_variants = true, updated_at = NOW() WHERE id = $2",
        [group.parentName, parentId]
      );
      console.log(`  ✅ Parent: ${parentId} → "${group.parentName}"`);

      // Create option group
      const { rows: [optGroup] } = await client.query(
        "INSERT INTO option_groups (tenant_id, product_id, name, translations, sort_order) VALUES ($1, $2, $3, $4::jsonb, 0) RETURNING id",
        [tenantId, parentId, group.optionGroupName, JSON.stringify({ en: group.optionGroupNameEn })]
      );

      // Create values + variants
      for (let i = 0; i < group.variants.length; i++) {
        const v = group.variants[i];

        // Create option value
        await client.query(
          "INSERT INTO option_values (group_id, value, sort_order) VALUES ($1, $2, $3)",
          [optGroup.id, v.optionValue, i]
        );

        // Find matching product for this variant
        const matchingProduct = products.find(p => v.skus.includes(p.sku));
        const sku = matchingProduct?.sku || v.skus[0];
        const barcode = matchingProduct?.barcode || null;
        const price = matchingProduct?.selling_price || basePrice;
        const stock = matchingProduct?.stock;

        // Create variant
        const combo = JSON.stringify({ [group.optionGroupName]: v.optionValue });
        await client.query(
          "INSERT INTO product_variants (tenant_id, product_id, sku, barcode, name, selling_price, original_price, stock, option_combo, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)",
          [tenantId, parentId, sku, barcode, `${group.parentName} · ${v.optionValue}`, price, matchingProduct?.original_price, stock, combo, i]
        );
        totalVariants++;

        // Soft-delete old product (except parent)
        if (matchingProduct && matchingProduct.id !== parentId) {
          await client.query("UPDATE products SET deleted_at = NOW() WHERE id = $1", [matchingProduct.id]);
          totalDeleted++;
        }

        console.log(`  ${sku?.padEnd(10)} ${v.optionValue}`);
      }

      totalGrouped++;
    }

    // Final count
    const { rows: [{ count }] } = await client.query(
      "SELECT count(*) FROM products WHERE tenant_id = $1 AND deleted_at IS NULL",
      [tenantId]
    );

    console.log(`\n${"═".repeat(50)}`);
    console.log(`✅ Grouped: ${totalGrouped} parent products`);
    console.log(`✅ Variants created: ${totalVariants}`);
    console.log(`🗑️ Old products deleted: ${totalDeleted}`);
    console.log(`📦 Active products remaining: ${count}`);

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => { console.error("Failed:", err); process.exit(1); });
