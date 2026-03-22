import "server-only";
import {
  db,
  products,
  categories,
  tenants,
  orders,
  payments,
  eq,
  and,
  isNull,
  asc,
  desc,
  sql,
  count,
  sum,
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

export async function getOrders(limit = 100) {
  const tenantId = await getTenantId();
  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      subtotal: orders.subtotal,
      total: orders.total,
      itemCount: orders.itemCount,
      currency: orders.currency,
      createdAt: orders.createdAt,
      paymentMethod: payments.method,
    })
    .from(orders)
    .leftJoin(payments, eq(orders.id, payments.orderId))
    .where(eq(orders.tenantId, tenantId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getOrderStats() {
  const tenantId = await getTenantId();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = now.getDay();
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const [todayResult] = await db
    .select({
      count: count(),
      revenue: sum(orders.total),
    })
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, tenantId),
        sql`${orders.createdAt} >= ${todayStart.toISOString()}`
      )
    );

  const [weekResult] = await db
    .select({
      count: count(),
      revenue: sum(orders.total),
    })
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, tenantId),
        sql`${orders.createdAt} >= ${weekStart.toISOString()}`
      )
    );

  return {
    todayOrders: todayResult?.count ?? 0,
    todayRevenue: parseFloat(todayResult?.revenue ?? "0"),
    weekOrders: weekResult?.count ?? 0,
    weekRevenue: parseFloat(weekResult?.revenue ?? "0"),
  };
}

export type ProductRow = Awaited<ReturnType<typeof getProducts>>[number];
export type CategoryRow = Awaited<ReturnType<typeof getCategories>>[number];
export type OrderRow = Awaited<ReturnType<typeof getOrders>>[number];
export type OrderStats = Awaited<ReturnType<typeof getOrderStats>>;
