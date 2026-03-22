import { getActiveProducts, getActiveCategories } from "@/lib/queries";
import POSClient from "./pos-client";
import { categories as mockCategories, products as mockProducts } from "@/data/mock";
import type { Product, Category } from "@/data/mock";

export default async function POSPage() {
  let productList: Product[] = mockProducts;
  let categoryList: { id: string; nameKey: string; icon: string }[] = mockCategories;

  try {
    const [dbProducts, dbCategories] = await Promise.all([
      getActiveProducts(),
      getActiveCategories(),
    ]);

    // Transform DB products to cashier Product shape
    productList = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      nameCn: p.nameCn || p.name,
      nameJa: p.nameJa || undefined,
      namePt: p.namePt || undefined,
      price: parseFloat(p.sellingPrice),
      category: p.categoryId || "all",
      image: p.image || undefined,
      inStock: p.status !== "sold_out" && (p.stock === null || p.stock > 0),
      popular: p.isPopular,
    }));

    // Build category list: "all" + "popular" + DB categories
    categoryList = [
      { id: "all", nameKey: "all", icon: "LayoutGrid" },
      { id: "popular", nameKey: "popular", icon: "Flame" },
      ...dbCategories.map((c) => ({
        id: c.id,
        nameKey: c.nameEn?.toLowerCase() || c.name,
        icon: c.icon || "LayoutGrid",
      })),
    ];
  } catch (error) {
    console.error("Failed to fetch from DB, using mock data:", error);
  }

  return <POSClient initialProducts={productList} initialCategories={categoryList} />;
}
