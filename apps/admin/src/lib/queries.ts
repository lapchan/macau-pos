import "server-only";
import {
  db,
  products,
  categories,
  tenants,
  eq,
  and,
  isNull,
  asc,
  DEMO_TENANT_SLUG,
} from "@macau-pos/database";

// Get the demo tenant ID (cached per request)
async function getTenantId(): Promise<string> {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, DEMO_TENANT_SLUG))
    .limit(1);

  if (!tenant) throw new Error(`Tenant '${DEMO_TENANT_SLUG}' not found. Run db:seed first.`);
  return tenant.id;
}

export async function getProducts() {
  const tenantId = await getTenantId();
  return db
    .select({
      id: products.id,
      name: products.name,
      nameCn: products.nameCn,
      nameJa: products.nameJa,
      namePt: products.namePt,
      sku: products.sku,
      sellingPrice: products.sellingPrice,
      originalPrice: products.originalPrice,
      stock: products.stock,
      status: products.status,
      isPopular: products.isPopular,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categoryNameEn: categories.nameEn,
      image: products.image,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.tenantId, tenantId), isNull(products.deletedAt)))
    .orderBy(asc(products.sortOrder));
}

export async function getCategories() {
  const tenantId = await getTenantId();
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.tenantId, tenantId), eq(categories.isActive, true)))
    .orderBy(asc(categories.sortOrder));
}

export type ProductRow = Awaited<ReturnType<typeof getProducts>>[number];
export type CategoryRow = Awaited<ReturnType<typeof getCategories>>[number];
