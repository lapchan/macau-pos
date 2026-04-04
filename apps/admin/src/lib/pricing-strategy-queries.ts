import "server-only";
import {
  db,
  pricingStrategies,
  pricingStrategyItems,
  products,
  locations,
  eq,
  and,
  asc,
  sql,
  count,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";

async function getTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("No active session");
  return session.tenantId;
}

/** List all strategies for the current tenant */
export async function getStrategies() {
  const tenantId = await getTenantId();

  // Get strategies with item count and assigned location count
  const strategies = await db
    .select({
      id: pricingStrategies.id,
      name: pricingStrategies.name,
      description: pricingStrategies.description,
      isActive: pricingStrategies.isActive,
      createdAt: pricingStrategies.createdAt,
    })
    .from(pricingStrategies)
    .where(eq(pricingStrategies.tenantId, tenantId))
    .orderBy(asc(pricingStrategies.name));

  // Get item counts per strategy
  const itemCounts = await db
    .select({
      strategyId: pricingStrategyItems.strategyId,
      count: count(),
    })
    .from(pricingStrategyItems)
    .groupBy(pricingStrategyItems.strategyId);

  const itemCountMap = Object.fromEntries(
    itemCounts.map((ic) => [ic.strategyId, ic.count])
  );

  // Get location counts per strategy
  const locationCounts = await db
    .select({
      strategyId: locations.pricingStrategyId,
      count: count(),
    })
    .from(locations)
    .where(and(eq(locations.tenantId, tenantId), sql`${locations.pricingStrategyId} IS NOT NULL`))
    .groupBy(locations.pricingStrategyId);

  const locationCountMap = Object.fromEntries(
    locationCounts.map((lc) => [lc.strategyId!, lc.count])
  );

  return strategies.map((s) => ({
    ...s,
    itemCount: itemCountMap[s.id] ?? 0,
    locationCount: locationCountMap[s.id] ?? 0,
  }));
}

/** Get a single strategy by ID */
export async function getStrategyById(strategyId: string) {
  const tenantId = await getTenantId();
  const [strategy] = await db
    .select()
    .from(pricingStrategies)
    .where(
      and(
        eq(pricingStrategies.id, strategyId),
        eq(pricingStrategies.tenantId, tenantId)
      )
    )
    .limit(1);
  return strategy ?? null;
}

/** Get strategy items joined with product info for the detail page */
export async function getStrategyItems(strategyId: string) {
  return db
    .select({
      id: pricingStrategyItems.id,
      productId: pricingStrategyItems.productId,
      variantId: pricingStrategyItems.variantId,
      sellingPrice: pricingStrategyItems.sellingPrice,
      originalPrice: pricingStrategyItems.originalPrice,
      stock: pricingStrategyItems.stock,
      isAvailable: pricingStrategyItems.isAvailable,
      sortOrder: pricingStrategyItems.sortOrder,
      // Product info for display
      productName: products.name,
      productTranslations: products.translations,
      catalogPrice: products.sellingPrice,
      catalogOriginalPrice: products.originalPrice,
      catalogStock: products.stock,
      productSku: products.sku,
      productImage: products.image,
    })
    .from(pricingStrategyItems)
    .innerJoin(products, eq(pricingStrategyItems.productId, products.id))
    .where(eq(pricingStrategyItems.strategyId, strategyId))
    .orderBy(asc(products.name));
}

/** Get all tenant products for adding overrides (products NOT yet in this strategy) */
export async function getProductsNotInStrategy(strategyId: string) {
  const tenantId = await getTenantId();

  return db
    .select({
      id: products.id,
      name: products.name,
      translations: products.translations,
      sellingPrice: products.sellingPrice,
      originalPrice: products.originalPrice,
      stock: products.stock,
      sku: products.sku,
      image: products.image,
    })
    .from(products)
    .where(
      and(
        eq(products.tenantId, tenantId),
        sql`${products.deletedAt} IS NULL`,
        sql`${products.id} NOT IN (
          SELECT product_id FROM pricing_strategy_items WHERE strategy_id = ${strategyId}
        )`
      )
    )
    .orderBy(asc(products.name));
}

export type StrategyRow = Awaited<ReturnType<typeof getStrategies>>[number];
export type StrategyItemRow = Awaited<ReturnType<typeof getStrategyItems>>[number];
