/**
 * Seed storefront data:
 * 1. Generate slugs for categories and products
 * 2. Create storefront config
 * 3. Create delivery zones
 */
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, and, isNull, sql } from "drizzle-orm";
import {
  tenants,
  categories,
  products,
  storefrontConfigs,
  storefrontPages,
  deliveryZones,
  locations,
} from "./schema";

const { Pool } = pg;

function slugify(text: string): string {
  // Try to extract English name from translations or use pinyin-like fallback
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff-]/g, "") // keep CJK + alphanum
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

// Better slug generator that uses English translations when available
function generateSlug(name: string, translations?: Record<string, string> | null): string {
  // Prefer English name for URL-friendly slugs
  const en = translations?.en || translations?.EN;
  if (en) {
    return en
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);
  }
  // Fallback to Chinese name slugified
  return slugify(name);
}

async function seedStorefront() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("🌱 Seeding storefront data...\n");

  // Get demo tenant
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, "countingstars"))
    .limit(1);

  if (!tenant) {
    console.error("❌ Tenant 'countingstars' not found. Run seed.ts first.");
    process.exit(1);
  }

  const tenantId = tenant.id;
  console.log(`✅ Tenant: ${tenant.name} (${tenantId})\n`);

  // ============================================================
  // 1. Generate category slugs
  // ============================================================
  console.log("📁 Generating category slugs...");
  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.tenantId, tenantId));

  const catSlugs = new Set<string>();
  for (const cat of allCategories) {
    if (cat.slug) {
      catSlugs.add(cat.slug);
      continue;
    }
    let slug = generateSlug(cat.name, cat.translations as Record<string, string>);
    if (!slug) slug = `category-${cat.id.substring(0, 8)}`;
    // Deduplicate
    let finalSlug = slug;
    let counter = 2;
    while (catSlugs.has(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    catSlugs.add(finalSlug);

    await db
      .update(categories)
      .set({ slug: finalSlug })
      .where(eq(categories.id, cat.id));
    console.log(`  ${cat.name} → /${finalSlug}`);
  }
  console.log(`  ✅ ${allCategories.length} categories updated\n`);

  // ============================================================
  // 2. Generate product slugs
  // ============================================================
  console.log("📦 Generating product slugs...");
  const allProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenantId), isNull(products.deletedAt)));

  const prodSlugs = new Set<string>();
  for (const prod of allProducts) {
    if (prod.slug) {
      prodSlugs.add(prod.slug);
      continue;
    }
    let slug = generateSlug(prod.name, prod.translations as Record<string, string>);
    if (!slug) slug = `product-${prod.id.substring(0, 8)}`;
    let finalSlug = slug;
    let counter = 2;
    while (prodSlugs.has(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    prodSlugs.add(finalSlug);

    await db
      .update(products)
      .set({ slug: finalSlug })
      .where(eq(products.id, prod.id));
    console.log(`  ${prod.name} → /${finalSlug}`);
  }
  console.log(`  ✅ ${allProducts.length} products updated\n`);

  // ============================================================
  // 3. Storefront config
  // ============================================================
  console.log("🎨 Seeding storefront config...");
  const existingConfig = await db
    .select()
    .from(storefrontConfigs)
    .where(and(eq(storefrontConfigs.tenantId, tenantId), isNull(storefrontConfigs.locationId)))
    .limit(1);

  if (existingConfig.length === 0) {
    await db.insert(storefrontConfigs).values({
      tenantId,
      locationId: null,
      branding: {
        accentColor: "#4f46e5",
        fontFamily: "inter",
        headerStyle: "dark",
        logo: null,
      },
      header: {
        showSearch: true,
        showLanguageSwitcher: true,
        showCartIcon: true,
        navLinks: [],
      },
      homepageSections: [],  // empty = use defaults from page.tsx
      footer: {
        columns: [],
        socialLinks: { facebook: "#", instagram: "#", whatsapp: "#" },
        copyright: `© ${new Date().getFullYear()} ${tenant.name}`,
        showPaymentIcons: true,
        showNewsletter: true,
      },
    });
    console.log("  ✅ Storefront config created\n");
  } else {
    console.log("  ⏭️  Storefront config already exists\n");
  }

  // ============================================================
  // 4. Storefront pages
  // ============================================================
  console.log("📄 Seeding storefront pages...");
  const pages = [
    {
      slug: "about",
      title: "About Us",
      titleTranslations: { tc: "關於我們", sc: "关于我们", en: "About Us", pt: "Sobre Nós", ja: "私たちについて" },
      content: [
        { type: "heading", level: 2, text: "Our Story" },
        { type: "paragraph", text: "CountingStars is a convenience store in Macau, bringing quality products to our community." },
      ],
      contentTranslations: {
        tc: [
          { type: "heading", level: 2, text: "我們的故事" },
          { type: "paragraph", text: "CountingStars 是澳門的便利店，為社區提供優質商品。" },
        ],
      },
      isPublished: true,
      sortOrder: 1,
    },
    {
      slug: "terms",
      title: "Terms & Conditions",
      titleTranslations: { tc: "條款及細則", sc: "条款及细则", en: "Terms & Conditions", pt: "Termos e Condições", ja: "利用規約" },
      content: [{ type: "paragraph", text: "Terms and conditions content coming soon." }],
      isPublished: true,
      sortOrder: 2,
    },
    {
      slug: "privacy",
      title: "Privacy Policy",
      titleTranslations: { tc: "私隱政策", sc: "隐私政策", en: "Privacy Policy", pt: "Política de Privacidade", ja: "プライバシーポリシー" },
      content: [{ type: "paragraph", text: "Privacy policy content coming soon." }],
      isPublished: true,
      sortOrder: 3,
    },
    {
      slug: "returns",
      title: "Returns & Exchanges",
      titleTranslations: { tc: "退換貨政策", sc: "退换货政策", en: "Returns & Exchanges", pt: "Devoluções e Trocas", ja: "返品・交換" },
      content: [{ type: "paragraph", text: "Returns policy content coming soon." }],
      isPublished: true,
      sortOrder: 4,
    },
    {
      slug: "contact",
      title: "Contact Us",
      titleTranslations: { tc: "聯絡我們", sc: "联络我们", en: "Contact Us", pt: "Contacte-nos", ja: "お問い合わせ" },
      content: [
        { type: "heading", level: 2, text: "Get in Touch" },
        { type: "paragraph", text: "Email: hello@countingstars.mo | WhatsApp: +853 6XXX XXXX" },
      ],
      contentTranslations: {
        tc: [
          { type: "heading", level: 2, text: "聯繫方式" },
          { type: "paragraph", text: "電郵: hello@countingstars.mo | WhatsApp: +853 6XXX XXXX" },
        ],
      },
      isPublished: true,
      sortOrder: 5,
    },
  ];

  for (const page of pages) {
    const exists = await db
      .select({ id: storefrontPages.id })
      .from(storefrontPages)
      .where(and(eq(storefrontPages.tenantId, tenantId), eq(storefrontPages.slug, page.slug)))
      .limit(1);

    if (exists.length === 0) {
      await db.insert(storefrontPages).values({ tenantId, ...page });
      console.log(`  + ${page.slug}`);
    }
  }
  console.log("  ✅ Pages seeded\n");

  // ============================================================
  // 5. Delivery zones
  // ============================================================
  console.log("🚚 Seeding delivery zones...");
  const locs = await db
    .select()
    .from(locations)
    .where(eq(locations.tenantId, tenantId));

  if (locs.length > 0) {
    const locationId = locs[0].id;
    const existingZones = await db
      .select()
      .from(deliveryZones)
      .where(eq(deliveryZones.tenantId, tenantId))
      .limit(1);

    if (existingZones.length === 0) {
      await db.insert(deliveryZones).values([
        {
          tenantId,
          locationId,
          name: "Macau Peninsula",
          nameTranslations: { tc: "澳門半島", sc: "澳门半岛", en: "Macau Peninsula", pt: "Península de Macau", ja: "マカオ半島" },
          fee: "15.00",
          minOrder: "50.00",
          freeAbove: "200.00",
          estimatedMinutes: 45,
          isActive: true,
          sortOrder: 1,
        },
        {
          tenantId,
          locationId,
          name: "Taipa",
          nameTranslations: { tc: "氹仔", sc: "氹仔", en: "Taipa", pt: "Taipa", ja: "タイパ" },
          fee: "20.00",
          minOrder: "80.00",
          freeAbove: "300.00",
          estimatedMinutes: 60,
          isActive: true,
          sortOrder: 2,
        },
        {
          tenantId,
          locationId,
          name: "Coloane",
          nameTranslations: { tc: "路環", sc: "路环", en: "Coloane", pt: "Coloane", ja: "コロアン" },
          fee: "30.00",
          minOrder: "100.00",
          freeAbove: "500.00",
          estimatedMinutes: 90,
          isActive: true,
          sortOrder: 3,
        },
      ]);
      console.log("  ✅ 3 delivery zones created (Macau Peninsula, Taipa, Coloane)\n");
    } else {
      console.log("  ⏭️  Delivery zones already exist\n");
    }
  } else {
    console.log("  ⚠️  No locations found, skipping delivery zones\n");
  }

  console.log("🎉 Storefront seed complete!");
  await pool.end();
}

seedStorefront().catch(console.error);
