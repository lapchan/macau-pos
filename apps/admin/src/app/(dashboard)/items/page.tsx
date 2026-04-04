import { getProducts, getCategories, getCategoriesForManager } from "@/lib/queries";
import type { CategoryForManager } from "@/lib/queries";
import ItemsClient, { type Product, type CategoryOption } from "./items-client";
import { getDisplayName } from "@macau-pos/database";

export const metadata = { title: "Items & services" };

export default async function ItemsPage() {
  let dbProducts: Product[] = [];
  let categoryNames: string[] = ["All items"];
  let categoryOptions: CategoryOption[] = [];
  let categoriesForManager: CategoryForManager[] = [];

  try {
    const [rawProducts, rawCategories, managerCategories] = await Promise.all([
      getProducts(),
      getCategories(),
      getCategoriesForManager(),
    ]);

    categoriesForManager = managerCategories;

    // Transform DB rows to client Product shape
    dbProducts = rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      translations: p.translations as Record<string, string> | null,
      sku: p.sku,
      barcode: p.barcode,
      price: parseFloat(p.sellingPrice),
      sellingPrice: p.sellingPrice,
      originalPrice: p.originalPrice,
      cost: p.originalPrice ? parseFloat(p.originalPrice) : null,
      stock: p.stock,
      // Use getDisplayName for category display with English fallback
      category: p.categoryName
        ? getDisplayName(p.categoryName, p.categoryTranslations as Record<string, string> | null, "en")
        : "Uncategorized",
      categoryId: p.categoryId,
      status: p.status as Product["status"],
      image: p.image,
      isPopular: p.isPopular,
      hasVariants: p.hasVariants,
      variantCount: p.variantCount,
      version: p.version,
      updatedAt: p.updatedAt,
    }));

    categoryNames = [
      "All items",
      ...rawCategories.map((c) =>
        getDisplayName(c.name, c.translations as Record<string, string> | null, "en")
      ),
    ];

    categoryOptions = rawCategories.map((c) => ({
      id: c.id,
      name: getDisplayName(c.name, c.translations as Record<string, string> | null, "en"),
      nameCn: c.name,
    }));
  } catch (error) {
    console.error("Failed to fetch products from DB, using empty state:", error);
  }

  return (
    <ItemsClient
      products={dbProducts}
      categories={categoryNames}
      categoryOptions={categoryOptions}
      categoriesForManager={categoriesForManager}
    />
  );
}
