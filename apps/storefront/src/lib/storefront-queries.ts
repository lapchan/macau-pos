import "server-only";
import {
  db,
  products,
  productVariants,
  categories,
  storefrontConfigs,
  storefrontPages,
  deliveryZones,
  orders,
  orderItems,
  payments,
  eq,
  and,
  isNull,
  asc,
  desc,
  sql,
} from "@macau-pos/database";
import type { Locale } from "@macau-pos/i18n";

export async function getStorefrontProducts(
  tenantId: string,
  filters?: {
    categorySlug?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    sortBy?: "newest" | "price_asc" | "price_desc" | "popular" | "name";
    page?: number;
    pageSize?: number;
  }
) {
  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 24;
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(products.tenantId, tenantId),
    eq(products.status, "active"),
    isNull(products.deletedAt),
  ];

  if (filters?.categorySlug) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.tenantId, tenantId), eq(categories.slug, filters.categorySlug)))
      .limit(1);
    if (cat) {
      // Also include products from sub-categories when filtering by a parent category
      const childCats = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.tenantId, tenantId), eq(categories.parentCategoryId, cat.id)));
      const allCatIds = [cat.id, ...childCats.map((c) => c.id)];
      conditions.push(sql`${products.categoryId} IN (${sql.join(allCatIds.map(id => sql`${id}`), sql`, `)})`);
    }
  }

  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      sql`(${products.name} ILIKE ${term} OR ${products.translations}::text ILIKE ${term})`
    );
  }

  if (filters?.minPrice !== undefined) {
    conditions.push(sql`${products.sellingPrice}::numeric >= ${filters.minPrice}`);
  }
  if (filters?.maxPrice !== undefined) {
    conditions.push(sql`${products.sellingPrice}::numeric <= ${filters.maxPrice}`);
  }

  if (filters?.inStockOnly) {
    conditions.push(sql`(${products.stock} IS NULL OR ${products.stock} > 0)`);
  }

  // Sort
  let orderClause;
  switch (filters?.sortBy) {
    case "price_asc":
      orderClause = asc(products.sellingPrice);
      break;
    case "price_desc":
      orderClause = desc(products.sellingPrice);
      break;
    case "newest":
      orderClause = desc(products.createdAt);
      break;
    case "popular":
      orderClause = desc(products.isPopular);
      break;
    default:
      orderClause = asc(products.sortOrder);
  }

  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      translations: products.translations,
      sellingPrice: products.sellingPrice,
      originalPrice: products.originalPrice,
      image: products.image,
      images: products.images,
      stock: products.stock,
      hasVariants: products.hasVariants,
      isPopular: products.isPopular,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryTranslations: categories.translations,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(orderClause)
    .limit(pageSize)
    .offset(offset);

  // Count total for pagination
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(...conditions));

  return {
    products: rows,
    total: Number(count),
    page,
    pageSize,
    totalPages: Math.ceil(Number(count) / pageSize),
  };
}

export async function getProductBySlug(tenantId: string, slug: string) {
  const [product] = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      translations: products.translations,
      description: products.description,
      descTranslations: products.descTranslations,
      sellingPrice: products.sellingPrice,
      originalPrice: products.originalPrice,
      image: products.image,
      images: products.images,
      stock: products.stock,
      status: products.status,
      hasVariants: products.hasVariants,
      isPopular: products.isPopular,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryTranslations: categories.translations,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.tenantId, tenantId),
        eq(products.slug, slug),
        isNull(products.deletedAt)
      )
    )
    .limit(1);

  return product ?? null;
}

/** Fetch color/size variants for a product from the product_variants table.
 *  Returns all active variants for a product with hasVariants=true.
 *  Used on PDP for clickable color swatches. */
export async function getColorVariants(tenantId: string, productId: string) {
  // Check if this product has variants
  const [parent] = await db
    .select({ hasVariants: products.hasVariants })
    .from(products)
    .where(
      and(
        eq(products.id, productId),
        eq(products.tenantId, tenantId),
        isNull(products.deletedAt)
      )
    )
    .limit(1);

  if (!parent?.hasVariants) return [];

  // Fetch all active variants from the product_variants table
  const variants = await db
    .select({
      id: productVariants.id,
      name: productVariants.name,
      sku: productVariants.sku,
      image: productVariants.image,
      images: productVariants.images,
      stock: productVariants.stock,
      sellingPrice: productVariants.sellingPrice,
      optionCombo: productVariants.optionCombo,
      sortOrder: productVariants.sortOrder,
    })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.productId, productId),
        eq(productVariants.tenantId, tenantId),
        eq(productVariants.isActive, true)
      )
    )
    .orderBy(asc(productVariants.sortOrder));

  return variants.map((v, i) => {
    const gallery = Array.isArray(v.images) && (v.images as unknown[]).length > 0
      ? (v.images as { url: string; alt?: string }[])
      : v.image
      ? [{ url: v.image, alt: v.name }]
      : [];

    const combo = v.optionCombo as Record<string, string>;
    const colorName = combo?.Color || combo?.["顏色"] || null;

    return {
      id: v.id,
      slug: null, // variants don't have their own page
      name: v.name,
      colorName,
      image: v.image,
      images: gallery,
      stock: v.stock,
      price: parseFloat(String(v.sellingPrice)),
      isCurrent: i === 0, // default to first variant
    };
  });
}

export async function getStorefrontCategories(tenantId: string) {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      translations: categories.translations,
      icon: categories.icon,
      parentCategoryId: categories.parentCategoryId,
    })
    .from(categories)
    .where(and(eq(categories.tenantId, tenantId), eq(categories.isActive, true)))
    .orderBy(asc(categories.sortOrder));
}

export async function getStorefrontConfig(tenantId: string) {
  const [config] = await db
    .select()
    .from(storefrontConfigs)
    .where(and(eq(storefrontConfigs.tenantId, tenantId), isNull(storefrontConfigs.locationId)))
    .limit(1);

  return config ?? {
    branding: { themeId: "humanmade", accentColor: "#000000", fontFamily: "avenir", headerStyle: "dark", borderRadius: "none" },
    header: { showSearch: true, showLanguageSwitcher: true, showCartIcon: true, navLinks: [] },
    homepageSections: [],
    footer: { columns: [], socialLinks: {}, copyright: "", showPaymentIcons: true },
  };
}

export async function getStorefrontPage(tenantId: string, slug: string) {
  const [page] = await db
    .select()
    .from(storefrontPages)
    .where(
      and(
        eq(storefrontPages.tenantId, tenantId),
        eq(storefrontPages.slug, slug),
        eq(storefrontPages.isPublished, true)
      )
    )
    .limit(1);

  return page ?? null;
}

export async function getDeliveryZonesForCheckout(tenantId: string, locationId: string) {
  return db
    .select()
    .from(deliveryZones)
    .where(
      and(
        eq(deliveryZones.tenantId, tenantId),
        eq(deliveryZones.locationId, locationId),
        eq(deliveryZones.isActive, true)
      )
    )
    .orderBy(asc(deliveryZones.sortOrder));
}

// ── Order queries ──────────────────────────────────────────

export async function getOrderByNumber(tenantId: string, orderNumber: string) {
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
      deliveryMethod: orders.deliveryMethod,
      shippingAddress: orders.shippingAddress,
      deliveryFee: orders.deliveryFee,
      fulfillmentStatus: orders.fulfillmentStatus,
      estimatedDeliveryAt: orders.estimatedDeliveryAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, tenantId),
        eq(orders.orderNumber, orderNumber),
        eq(orders.channel, "online"),
      )
    )
    .limit(1);

  if (!order) return null;

  const items = await db
    .select({
      name: orderItems.name,
      translations: orderItems.translations,
      unitPrice: orderItems.unitPrice,
      quantity: orderItems.quantity,
      lineTotal: orderItems.lineTotal,
      productId: orderItems.productId,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  // Get product images for items
  const productIds = items.map((i) => i.productId).filter(Boolean) as string[];
  const productImages: Record<string, string | null> = {};
  if (productIds.length > 0) {
    const imgs = await db
      .select({ id: products.id, image: products.image })
      .from(products)
      .where(sql`${products.id} IN (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)})`);
    for (const p of imgs) productImages[p.id] = p.image;
  }

  const [payment] = await db
    .select({
      method: payments.method,
      intellipayPaymentService: payments.intellipayPaymentService,
    })
    .from(payments)
    .where(eq(payments.orderId, order.id))
    .limit(1);

  return {
    ...order,
    items: items.map((i) => ({
      name: i.name,
      translations: i.translations as Record<string, string> | null,
      unitPrice: parseFloat(String(i.unitPrice)),
      quantity: i.quantity,
      lineTotal: parseFloat(String(i.lineTotal)),
      image: i.productId ? productImages[i.productId] : null,
    })),
    paymentMethod: payment?.method || null,
    paymentService: payment?.intellipayPaymentService || null,
  };
}

export async function getPendingOnlineOrder(params: {
  tenantId: string;
  customerId?: string | null;
  orderNumber?: string | null;
}) {
  const { tenantId, customerId, orderNumber } = params;
  if (!customerId && !orderNumber) return null;

  const conditions = [
    eq(orders.tenantId, tenantId),
    eq(orders.channel, "online"),
    eq(orders.status, "pending"),
    sql`${orders.createdAt} > now() - interval '20 minutes'`,
  ];
  if (customerId) conditions.push(eq(orders.customerId, customerId));
  else if (orderNumber) conditions.push(eq(orders.orderNumber, orderNumber));

  const [row] = await db
    .select({
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      total: orders.total,
      currency: orders.currency,
      createdAt: orders.createdAt,
      paymentUrl: payments.intellipayPaymentUrl,
    })
    .from(orders)
    .leftJoin(payments, eq(payments.orderId, orders.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(1);

  if (!row || !row.paymentUrl) return null;
  return row;
}

export async function getCustomerOrders(tenantId: string, customerId: string) {
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      itemCount: orders.itemCount,
      fulfillmentStatus: orders.fulfillmentStatus,
      deliveryMethod: orders.deliveryMethod,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, tenantId),
        eq(orders.customerId, customerId),
        eq(orders.channel, "online"),
      )
    )
    .orderBy(desc(orders.createdAt));

  // Load items for each order (for thumbnail previews)
  const result = await Promise.all(
    rows.map(async (order) => {
      const items = await db
        .select({
          name: orderItems.name,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          productId: orderItems.productId,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      const productIds = items.map((i) => i.productId).filter(Boolean) as string[];
      const productImages: Record<string, string | null> = {};
      if (productIds.length > 0) {
        const imgs = await db
          .select({ id: products.id, image: products.image })
          .from(products)
          .where(sql`${products.id} IN (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)})`);
        for (const p of imgs) productImages[p.id] = p.image;
      }

      return {
        id: order.id,
        receiptNo: order.orderNumber,
        createdAt: order.createdAt.toISOString(),
        status: order.fulfillmentStatus || order.status,
        total: parseFloat(String(order.total)),
        itemCount: order.itemCount,
        items: items.map((i) => ({
          name: i.name,
          image: i.productId ? productImages[i.productId] : null,
          quantity: i.quantity,
          price: parseFloat(String(i.unitPrice)),
        })),
      };
    })
  );

  return result;
}
