import { getProducts, getCategories } from "@/lib/queries";
import ItemsClient, { type Product } from "./items-client";

export const metadata = { title: "Items & services" };

export default async function ItemsPage() {
  let dbProducts: Product[] = [];
  let categoryNames: string[] = ["All items"];

  try {
    const [rawProducts, rawCategories] = await Promise.all([
      getProducts(),
      getCategories(),
    ]);

    // Transform DB rows to client Product shape
    dbProducts = rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      nameCn: p.nameCn,
      sku: p.sku,
      price: parseFloat(p.sellingPrice),
      cost: p.originalPrice ? parseFloat(p.originalPrice) : null,
      stock: p.stock,
      category: p.categoryNameEn || p.categoryName || "Uncategorized",
      status: p.status as Product["status"],
      image: p.image,
      updatedAt: p.updatedAt,
    }));

    categoryNames = [
      "All items",
      ...rawCategories.map((c) => c.nameEn || c.name),
    ];
  } catch (error) {
    console.error("Failed to fetch products from DB, using empty state:", error);
  }

  return <ItemsClient products={dbProducts} categories={categoryNames} />;
}
