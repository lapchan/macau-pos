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

async function getTenantId(): Promise<string> {
  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, DEMO_TENANT_SLUG))
    .limit(1);
  if (!tenant) throw new Error(`Tenant '${DEMO_TENANT_SLUG}' not found`);
  return tenant.id;
}

export async function getActiveProducts() {
  const tenantId = await getTenantId();
  return db
    .select({
      id: products.id,
      name: products.name,
      nameCn: products.nameCn,
      nameJa: products.nameJa,
      namePt: products.namePt,
      sellingPrice: products.sellingPrice,
      stock: products.stock,
      status: products.status,
      isPopular: products.isPopular,
      image: products.image,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categoryNameEn: categories.nameEn,
      categoryIcon: categories.icon,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.tenantId, tenantId),
        isNull(products.deletedAt)
      )
    )
    .orderBy(asc(products.sortOrder));
}

export async function getActiveCategories() {
  const tenantId = await getTenantId();
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.tenantId, tenantId), eq(categories.isActive, true)))
    .orderBy(asc(categories.sortOrder));
}
