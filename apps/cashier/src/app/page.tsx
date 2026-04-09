import { getActiveProducts, getActiveCategories, getTaxRate } from "@/lib/queries";
import { getAuthSession } from "@/lib/auth-actions";
import { getActiveShift } from "@/lib/shift-actions";
import { getDisplayName, db, users, eq } from "@macau-pos/database";
import POSClient, { type CategoryData } from "./pos-client";
import { categories as mockCategories, products as mockProducts } from "@/data/mock";
import type { Product } from "@/data/mock";

export default async function POSPage() {
  let productList: Product[] = mockProducts;
  let categoryList: CategoryData[] = mockCategories;
  let userName: string | null = null;
  let userAvatar: string | null = null;
  let userId: string | null = null;
  let terminalName: string | null = null;
  let terminalCode: string | null = null;
  let activeShiftId: string | null = null;
  let userPinHash: string | null = null;
  let taxRate = 0;
  let currency = "MOP";

  try {
    const session = await getAuthSession();
    userName = session?.userName || null;
    userAvatar = session?.userAvatar || null;
    userId = session?.userId || null;
    terminalName = session?.terminalName || null;
    terminalCode = session?.terminalCode || null;
    currency = session?.tenantCurrency || "MOP";

    // Check for active shift
    const activeShift = await getActiveShift();
    activeShiftId = activeShift?.id || null;

    // Fetch PIN hash for offline lock screen verification
    if (userId) {
      const [u] = await db.select({ pin: users.pin }).from(users).where(eq(users.id, userId)).limit(1);
      userPinHash = u?.pin || null;
    }

    const [dbProducts, dbCategories, dbTaxRate] = await Promise.all([
      getActiveProducts(),
      getActiveCategories(),
      getTaxRate(),
    ]);
    taxRate = dbTaxRate;

    // Transform DB products to cashier Product shape
    // name = merchant's default product name (always displayed as fallback)
    // translations = JSONB with locale-specific names (shown when matching user's locale)
    productList = dbProducts.map((p) => {
      const trans = p.translations as Record<string, string> | null;
      return {
        id: p.id,
        name: p.name,                   // Merchant's default product name (always fallback)
        translations: trans || undefined, // JSONB: { en, tc, sc, ja, pt }
        price: parseFloat(p.sellingPrice),
        category: p.categoryId || "all",
        image: p.image || undefined,
        inStock: p.status !== "sold_out" && (p.stock === null || p.stock > 0),
        popular: p.isPopular,
        hasVariants: p.hasVariants,
        brand: p.brandName || undefined,
      };
    });

    // Build hierarchical category list: "all" + "popular" + DB categories (tree)
    const allDbCats = dbCategories.map((c) => {
      const trans = c.translations as Record<string, string> | null;
      return {
        id: c.id,
        nameKey: c.name,
        name: c.name,
        translations: trans,
        icon: c.icon || "LayoutGrid",
        parentId: c.parentCategoryId,
      };
    });

    // Build tree: top-level categories with children nested
    const topCats = allDbCats.filter((c) => !c.parentId);
    const childMap = new Map<string, typeof allDbCats>();
    for (const c of allDbCats) {
      if (c.parentId) {
        const siblings = childMap.get(c.parentId) || [];
        siblings.push(c);
        childMap.set(c.parentId, siblings);
      }
    }

    categoryList = [
      { id: "all", nameKey: "all", name: "全部", translations: { en: "All", tc: "全部", sc: "全部", pt: "Tudo", ja: "すべて" }, icon: "LayoutGrid" },
      { id: "popular", nameKey: "popular", name: "熱賣", translations: { en: "Popular", tc: "熱賣", sc: "热卖", pt: "Popular", ja: "人気" }, icon: "Flame" },
      ...topCats.map((parent) => ({
        ...parent,
        children: childMap.get(parent.id) || undefined,
      })),
    ];
  } catch (error) {
    console.error("Failed to fetch from DB, using mock data:", error);
  }

  return <POSClient initialProducts={productList} initialCategories={categoryList} userName={userName} userAvatar={userAvatar} userId={userId} userPinHash={userPinHash} terminalName={terminalName} terminalCode={terminalCode} activeShiftId={activeShiftId} taxRate={taxRate} currency={currency} />;
}
