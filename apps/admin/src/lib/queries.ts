import "server-only";
import {
  db,
  products,
  categories,
  orders,
  orderItems,
  payments,
  shopSettings,
  tenants,
  users,
  locations,
  userLocations,
  eq,
  and,
  isNull,
  isNotNull,
  asc,
  desc,
  sql,
  count,
  sum,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";
import { getSelectedLocationId } from "./location-actions";

async function getTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("No active session");
  return session.tenantId;
}

/** Get the currently selected location ID from cookie (null = all locations) */
async function getLocationFilter(): Promise<string | null> {
  return getSelectedLocationId();
}

export async function getProducts() {
  const tenantId = await getTenantId();
  return db
    .select({
      id: products.id,
      name: products.name,
      translations: products.translations,
      description: products.description,
      sku: products.sku,
      barcode: products.barcode,
      sellingPrice: products.sellingPrice,
      originalPrice: products.originalPrice,
      stock: products.stock,
      status: products.status,
      isPopular: products.isPopular,
      hasVariants: products.hasVariants,
      variantCount: sql<number>`(SELECT count(*)::int FROM product_variants WHERE product_id = ${products.id})`,
      version: products.version,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categoryTranslations: categories.translations,
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

export async function getCategoriesForManager() {
  const tenantId = await getTenantId();
  const result = await db
    .select({
      id: categories.id,
      name: categories.name,
      translations: categories.translations,
      parentCategoryId: categories.parentCategoryId,
      icon: categories.icon,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      productCount: sql<number>`COALESCE((
        SELECT COUNT(*)::int FROM products
        WHERE products.category_id = categories.id
        AND products.tenant_id = categories.tenant_id
        AND products.deleted_at IS NULL
      ), 0)`,
    })
    .from(categories)
    .where(eq(categories.tenantId, tenantId))
    .orderBy(asc(categories.sortOrder));
  return result;
}

export type CategoryForManager = Awaited<ReturnType<typeof getCategoriesForManager>>[number];

export async function getProductById(id: string) {
  const tenantId = await getTenantId();
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId), isNull(products.deletedAt)))
    .limit(1);
  return product ?? null;
}

export type OrderFilters = {
  dateFrom?: string;      // ISO datetime string
  dateTo?: string;        // ISO datetime string
  status?: string;        // order_status enum value
  paymentMethod?: string; // payment_method enum value
  limit?: number;
};

export async function getOrders(filters: OrderFilters = {}) {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();

  const conditions: ReturnType<typeof eq>[] = [eq(orders.tenantId, tenantId)];
  if (locationId) conditions.push(eq(orders.locationId, locationId));

  // Date range filter
  if (filters.dateFrom) {
    conditions.push(sql`${orders.createdAt} >= ${filters.dateFrom}`);
  }
  if (filters.dateTo) {
    conditions.push(sql`${orders.createdAt} <= ${filters.dateTo}`);
  }

  // Status filter
  if (filters.status) {
    conditions.push(eq(orders.status, filters.status as "pending" | "completed" | "refunded" | "voided"));
  }

  const query = db
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
    .limit(filters.limit ?? 500);

  const results = await query;

  // Payment method filter — applied after join (can't push into WHERE easily with left join)
  if (filters.paymentMethod) {
    return results.filter((r) => r.paymentMethod === filters.paymentMethod);
  }

  return results;
}

export async function getOrderStats() {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = now.getDay();
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const baseConditions = [eq(orders.tenantId, tenantId)];
  if (locationId) baseConditions.push(eq(orders.locationId, locationId));

  const [todayResult] = await db
    .select({
      count: count(),
      revenue: sum(orders.total),
    })
    .from(orders)
    .where(
      and(
        ...baseConditions,
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
        ...baseConditions,
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

// ─── Order Detail ─────────────────────────────────────────
export async function getOrderDetail(orderId: string) {
  const tenantId = await getTenantId();

  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      subtotal: orders.subtotal,
      discountAmount: orders.discountAmount,
      taxAmount: orders.taxAmount,
      total: orders.total,
      itemCount: orders.itemCount,
      currency: orders.currency,
      notes: orders.notes,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
    .limit(1);

  if (!order) return null;

  const items = await db
    .select({
      id: orderItems.id,
      name: orderItems.name,
      translations: orderItems.translations,
      variantName: orderItems.variantName,
      optionCombo: orderItems.optionCombo,
      unitPrice: orderItems.unitPrice,
      quantity: orderItems.quantity,
      lineTotal: orderItems.lineTotal,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const [payment] = await db
    .select({
      id: payments.id,
      method: payments.method,
      amount: payments.amount,
      cashReceived: payments.cashReceived,
      changeGiven: payments.changeGiven,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .limit(1);

  return { order, items, payment: payment || null };
}

// ─── Shop Settings ─────────────────────────────────────────
export async function getShopSettings() {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();

  // If a specific location is selected, get that location's settings
  // Otherwise get the default location's settings
  const conditions = [eq(shopSettings.tenantId, tenantId)];
  if (locationId) {
    conditions.push(eq(shopSettings.locationId, locationId));
  }

  const [row] = await db
    .select({
      // Per-location fields from shop_settings
      shopName: shopSettings.shopName,
      address: shopSettings.address,
      phone: shopSettings.phone,
      email: shopSettings.email,
      logo: shopSettings.logo,
      businessHours: shopSettings.businessHours,
      taxRate: shopSettings.taxRate,
      paymentCash: shopSettings.paymentCash,
      paymentCard: shopSettings.paymentCard,
      paymentMpay: shopSettings.paymentMpay,
      paymentAlipay: shopSettings.paymentAlipay,
      paymentWechat: shopSettings.paymentWechat,
      receiptHeader: shopSettings.receiptHeader,
      receiptFooter: shopSettings.receiptFooter,
      receiptShowAddress: shopSettings.receiptShowAddress,
      receiptShowPhone: shopSettings.receiptShowPhone,
      receiptShowTax: shopSettings.receiptShowTax,
      // Org-wide fields from tenants
      currency: tenants.currency,
      defaultLocale: tenants.defaultLocale,
      accentColor: tenants.accentColor,
      theme: tenants.theme,
    })
    .from(shopSettings)
    .innerJoin(tenants, eq(tenants.id, shopSettings.tenantId))
    .where(and(...conditions))
    .limit(1);
  return row || null;
}

// ─── Staff (Users) ─────────────────────────────────────────
export async function getStaffList() {
  const tenantId = await getTenantId();

  const staffRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      posRole: users.posRole,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), isNull(users.deletedAt)))
    .orderBy(asc(users.name));

  // Fetch location assignments for all staff
  const locationRows = await db
    .select({
      userId: userLocations.userId,
      locationId: userLocations.locationId,
      locationName: locations.name,
    })
    .from(userLocations)
    .innerJoin(locations, eq(userLocations.locationId, locations.id));

  const locMap = new Map<string, { id: string; name: string }[]>();
  for (const row of locationRows) {
    if (!locMap.has(row.userId)) locMap.set(row.userId, []);
    locMap.get(row.userId)!.push({ id: row.locationId, name: row.locationName });
  }

  return staffRows.map((s) => ({
    ...s,
    locations: locMap.get(s.id) || [],
  }));
}

// ─── Payment Transactions ──────────────────────────────────
export async function getPaymentTransactions(limit = 200) {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();

  const conditions = [eq(orders.tenantId, tenantId)];
  if (locationId) conditions.push(eq(orders.locationId, locationId));

  return db
    .select({
      paymentId: payments.id,
      orderId: payments.orderId,
      orderNumber: orders.orderNumber,
      method: payments.method,
      amount: payments.amount,
      cashReceived: payments.cashReceived,
      changeGiven: payments.changeGiven,
      orderTotal: orders.total,
      orderStatus: orders.status,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(and(...conditions))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

export async function getPaymentStats() {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const baseConditions = [eq(orders.tenantId, tenantId)];
  if (locationId) baseConditions.push(eq(orders.locationId, locationId));

  const [todayResult] = await db
    .select({
      totalAmount: sum(payments.amount),
      transactionCount: count(),
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(
      and(
        ...baseConditions,
        sql`${payments.createdAt} >= ${todayStart.toISOString()}`
      )
    );

  // Payment method breakdown (all time)
  const methodBreakdown = await db
    .select({
      method: payments.method,
      total: sum(payments.amount),
      count: count(),
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(and(...baseConditions))
    .groupBy(payments.method);

  return {
    todayAmount: todayResult?.totalAmount || "0",
    todayCount: todayResult?.transactionCount || 0,
    methodBreakdown: methodBreakdown.map((m) => ({
      method: m.method,
      total: m.total || "0",
      count: m.count,
    })),
  };
}

// ─── Analytics (AI Insights) ───────────────────────────────
export async function getSalesTrend(days = 30) {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const conditions = [eq(orders.tenantId, tenantId), sql`${orders.createdAt} >= ${startDate.toISOString()}`];
  if (locationId) conditions.push(eq(orders.locationId, locationId));

  return db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`.as("date"),
      revenue: sum(orders.total),
      orderCount: count(),
    })
    .from(orders)
    .where(and(...conditions))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(sql`DATE(${orders.createdAt})`);
}

export async function getTopProducts(limit = 10) {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();

  const conditions = [eq(orders.tenantId, tenantId)];
  if (locationId) conditions.push(eq(orders.locationId, locationId));

  return db
    .select({
      name: orderItems.name,
      totalRevenue: sum(orderItems.lineTotal),
      totalQuantity: sum(orderItems.quantity),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(...conditions))
    .groupBy(orderItems.name)
    .orderBy(desc(sum(orderItems.lineTotal)))
    .limit(limit);
}

export async function getAnalyticsOverview() {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();

  const orderConditions = [eq(orders.tenantId, tenantId)];
  if (locationId) orderConditions.push(eq(orders.locationId, locationId));

  const [totals] = await db
    .select({
      totalRevenue: sum(orders.total),
      totalOrders: count(),
      avgOrderValue: sql<string>`ROUND(AVG(${orders.total}), 2)`,
    })
    .from(orders)
    .where(and(...orderConditions));

  const [productCount] = await db
    .select({ count: count() })
    .from(products)
    .where(and(eq(products.tenantId, tenantId), isNull(products.deletedAt)));

  return {
    totalRevenue: totals?.totalRevenue || "0",
    totalOrders: totals?.totalOrders || 0,
    avgOrderValue: totals?.avgOrderValue || "0",
    totalProducts: productCount?.count || 0,
  };
}

// ─── Type exports ──────────────────────────────────────────
// ─── Report Queries ────────────────────────────────────────

export async function getReportSummary() {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();
  const conditions = [eq(orders.tenantId, tenantId)];
  if (locationId) conditions.push(eq(orders.locationId, locationId));

  const [result] = await db
    .select({
      totalOrders: count(),
      totalRevenue: sql<string>`COALESCE(sum(${orders.total}::numeric), 0)`,
      avgOrderValue: sql<string>`COALESCE(avg(${orders.total}::numeric), 0)`,
    })
    .from(orders)
    .where(and(...conditions));
  return {
    totalOrders: Number(result.totalOrders),
    totalRevenue: parseFloat(result.totalRevenue || "0"),
    avgOrderValue: parseFloat(result.avgOrderValue || "0"),
  };
}

export async function getSalesByDate(days = 30) {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();
  const conditions = [eq(orders.tenantId, tenantId), sql`${orders.createdAt} >= NOW() - INTERVAL '${sql.raw(String(days))} days'`];
  if (locationId) conditions.push(eq(orders.locationId, locationId));

  return db
    .select({
      date: sql<string>`DATE(${orders.createdAt})`,
      orders: count(),
      revenue: sql<string>`COALESCE(sum(${orders.total}::numeric), 0)`,
    })
    .from(orders)
    .where(and(...conditions))
    .groupBy(sql`DATE(${orders.createdAt})`)
    .orderBy(asc(sql`DATE(${orders.createdAt})`));
}

export async function getTopProductsByRevenue(limit = 10) {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();
  const conditions = [eq(orders.tenantId, tenantId)];
  if (locationId) conditions.push(eq(orders.locationId, locationId));

  return db
    .select({
      name: sql<string>`${orderItems.name}`,
      quantity: sql<string>`sum(${orderItems.quantity})`,
      revenue: sql<string>`sum(${orderItems.lineTotal}::numeric)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(...conditions))
    .groupBy(orderItems.name)
    .orderBy(desc(sql`sum(${orderItems.lineTotal}::numeric)`))
    .limit(limit);
}

export async function getSalesByCategory() {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();
  const conditions = [eq(orders.tenantId, tenantId)];
  if (locationId) conditions.push(eq(orders.locationId, locationId));

  return db
    .select({
      category: sql<string>`COALESCE(${categories.name}, 'Uncategorized')`,
      categoryEn: sql<string>`COALESCE(${categories.translations}->>'en', ${categories.name}, 'Uncategorized')`,
      orders: count(),
      revenue: sql<string>`COALESCE(sum(${orders.total}::numeric), 0)`,
    })
    .from(orders)
    .leftJoin(
      orderItems,
      eq(orderItems.orderId, orders.id)
    )
    .leftJoin(
      products,
      eq(orderItems.productId, products.id)
    )
    .leftJoin(
      categories,
      eq(products.categoryId, categories.id)
    )
    .where(and(...conditions))
    .groupBy(categories.name, categories.translations);
}

export async function getPaymentMethodBreakdown() {
  const tenantId = await getTenantId();
  const locationId = await getLocationFilter();
  const conditions = [eq(orders.tenantId, tenantId)];
  if (locationId) conditions.push(eq(orders.locationId, locationId));

  return db
    .select({
      method: payments.method,
      count: count(),
      total: sql<string>`COALESCE(sum(${payments.amount}::numeric), 0)`,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(and(...conditions))
    .groupBy(payments.method);
}

export type ReportSummary = Awaited<ReturnType<typeof getReportSummary>>;
export type SalesByDate = Awaited<ReturnType<typeof getSalesByDate>>[number];
export type TopProduct = Awaited<ReturnType<typeof getTopProductsByRevenue>>[number];
export type SalesByCategory = Awaited<ReturnType<typeof getSalesByCategory>>[number];
export type PaymentMethodBreakdown = Awaited<ReturnType<typeof getPaymentMethodBreakdown>>[number];

export type ProductRow = Awaited<ReturnType<typeof getProducts>>[number];
export type CategoryRow = Awaited<ReturnType<typeof getCategories>>[number];
export type OrderRow = Awaited<ReturnType<typeof getOrders>>[number];
export type OrderStats = Awaited<ReturnType<typeof getOrderStats>>;
export type PaymentTransaction = Awaited<ReturnType<typeof getPaymentTransactions>>[number];
export type PaymentStats = Awaited<ReturnType<typeof getPaymentStats>>;
export type StaffMember = Awaited<ReturnType<typeof getStaffList>>[number];
export type ShopSettingsRow = Awaited<ReturnType<typeof getShopSettings>>;
export type OrderDetail = NonNullable<Awaited<ReturnType<typeof getOrderDetail>>>;
