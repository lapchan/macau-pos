import "server-only";
import {
  db,
  products,
  categories,
  orders,
  orderItems,
  payments,
  optionGroups,
  optionValues,
  productVariants,
  locations,
  pricingStrategyItems,
  eq,
  and,
  or,
  isNull,
  inArray,
  asc,
  desc,
  sql,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";

async function getTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) {
    throw new Error("No active session — please log in");
  }
  return session.tenantId;
}

/** Resolve the pricing strategy for the current cashier session's location */
async function getSessionStrategyId(): Promise<string | null> {
  const session = await getAuthSession();
  if (!session?.locationId) return null;

  const [loc] = await db
    .select({ strategyId: locations.pricingStrategyId })
    .from(locations)
    .where(eq(locations.id, session.locationId))
    .limit(1);

  return loc?.strategyId ?? null;
}

export async function getActiveProducts() {
  const tenantId = await getTenantId();
  const strategyId = await getSessionStrategyId();

  // No strategy: return full catalog at catalog prices
  if (!strategyId) {
    return db
      .select({
        id: products.id,
        name: products.name,
        translations: products.translations,
        sellingPrice: products.sellingPrice,
        stock: products.stock,
        status: products.status,
        isPopular: products.isPopular,
        image: products.image,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categoryTranslations: categories.translations,
        categoryIcon: categories.icon,
        hasVariants: products.hasVariants,
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

  // Strategy-aware query: LEFT JOIN with COALESCE for price/stock overrides
  return db
    .select({
      id: products.id,
      name: products.name,
      translations: products.translations,
      sellingPrice: sql<string>`COALESCE(${pricingStrategyItems.sellingPrice}, ${products.sellingPrice})`,
      stock: sql<number | null>`COALESCE(${pricingStrategyItems.stock}, ${products.stock})`,
      status: products.status,
      isPopular: products.isPopular,
      image: products.image,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categoryTranslations: categories.translations,
      categoryIcon: categories.icon,
      hasVariants: products.hasVariants,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(
      pricingStrategyItems,
      and(
        eq(pricingStrategyItems.strategyId, strategyId),
        eq(pricingStrategyItems.productId, products.id),
        isNull(pricingStrategyItems.variantId)
      )
    )
    .where(
      and(
        eq(products.tenantId, tenantId),
        isNull(products.deletedAt),
        // Show product if: no strategy item OR strategy item says available
        or(
          isNull(pricingStrategyItems.id),
          eq(pricingStrategyItems.isAvailable, true)
        )
      )
    )
    .orderBy(asc(products.sortOrder));
}

export async function getProductVariantsForCashier(productId: string) {
  // Get option groups with values (include translations)
  const groups = await db
    .select({
      id: optionGroups.id,
      name: optionGroups.name,
      translations: optionGroups.translations,
      sortOrder: optionGroups.sortOrder,
    })
    .from(optionGroups)
    .where(eq(optionGroups.productId, productId))
    .orderBy(asc(optionGroups.sortOrder));

  const options = [];
  for (const group of groups) {
    const values = await db
      .select({
        value: optionValues.value,
        translations: optionValues.translations,
      })
      .from(optionValues)
      .where(eq(optionValues.groupId, group.id))
      .orderBy(asc(optionValues.sortOrder));
    options.push({
      groupName: group.name,
      groupTranslations: group.translations as Record<string, string> | null,
      values: values.map((v) => v.value),
      valueTranslations: values.map((v) => v.translations as Record<string, string> | null),
    });
  }

  // Get variants
  const variants = await db
    .select({
      id: productVariants.id,
      name: productVariants.name,
      sellingPrice: productVariants.sellingPrice,
      stock: productVariants.stock,
      optionCombo: productVariants.optionCombo,
      isActive: productVariants.isActive,
    })
    .from(productVariants)
    .where(and(eq(productVariants.productId, productId), eq(productVariants.isActive, true)))
    .orderBy(asc(productVariants.sortOrder));

  return { options, variants };
}

export async function getRecentOrders(limit = 50, shiftId?: string | null) {
  const tenantId = await getTenantId();
  const conditions: ReturnType<typeof eq>[] = [eq(orders.tenantId, tenantId)];
  if (shiftId) conditions.push(eq(orders.shiftId, shiftId));

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
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

export async function getOrderItemsByOrderIds(orderIds: string[]) {
  if (orderIds.length === 0) return [];
  return db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      name: orderItems.name,
      translations: orderItems.translations,
      unitPrice: orderItems.unitPrice,
      quantity: orderItems.quantity,
      lineTotal: orderItems.lineTotal,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds));
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
