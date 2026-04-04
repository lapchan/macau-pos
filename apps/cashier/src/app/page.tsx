import { getActiveProducts, getActiveCategories } from "@/lib/queries";
import { getAuthSession } from "@/lib/auth-actions";
import { getActiveShift } from "@/lib/shift-actions";
import { getDisplayName } from "@macau-pos/database";
import POSClient from "./pos-client";
import { categories as mockCategories, products as mockProducts } from "@/data/mock";
import type { Product, Category } from "@/data/mock";

export default async function POSPage() {
  let productList: Product[] = mockProducts;
  let categoryList: { id: string; nameKey: string; icon: string }[] = mockCategories;
  let userName: string | null = null;
  let userId: string | null = null;
  let terminalName: string | null = null;
  let terminalCode: string | null = null;
  let activeShiftId: string | null = null;

  try {
    const session = await getAuthSession();
    userName = session?.userName || null;
    userId = session?.userId || null;
    terminalName = session?.terminalName || null;
    terminalCode = session?.terminalCode || null;

    // Check for active shift
    const activeShift = await getActiveShift();
    activeShiftId = activeShift?.id || null;

    const [dbProducts, dbCategories] = await Promise.all([
      getActiveProducts(),
      getActiveCategories(),
    ]);

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
      };
    });

    // Build category list: "all" + "popular" + DB categories
    categoryList = [
      { id: "all", nameKey: "all", icon: "LayoutGrid" },
      { id: "popular", nameKey: "popular", icon: "Flame" },
      ...dbCategories.map((c) => {
        const trans = c.translations as Record<string, string> | null;
        return {
          id: c.id,
          nameKey: getDisplayName(c.name, trans, "en")?.toLowerCase() || c.name,
          icon: c.icon || "LayoutGrid",
        };
      }),
    ];
  } catch (error) {
    console.error("Failed to fetch from DB, using mock data:", error);
  }

  return <POSClient initialProducts={productList} initialCategories={categoryList} userName={userName} userId={userId} terminalName={terminalName} terminalCode={terminalCode} activeShiftId={activeShiftId} />;
}
