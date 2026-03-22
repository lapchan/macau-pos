import "server-only";
import {
  db,
  products,
  categories,
  tenants,
  orders,
  orderItems,
  payments,
  eq,
  and,
  isNull,
  asc,
  desc,
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

export async function getRecentOrders(limit = 50) {
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

export async function getOrderWithItems(orderId: string) {
  const tenantId = await getTenantId();

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
    .limit(1);

  if (!order) return null;

  const [items, [payment]] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    db.select().from(payments).where(eq(payments.orderId, orderId)).limit(1),
  ]);

  return { order, items, payment: payment ?? null };
}

export async function getActiveCategories() {
  const tenantId = await getTenantId();
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.tenantId, tenantId), eq(categories.isActive, true)))
    .orderBy(asc(categories.sortOrder));
}
