import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  db, getSession, products, productVariants, locations, pricingStrategyItems,
  eq, and, or, isNull, sql,
} from "@macau-pos/database";

const COOKIE_NAME = "pos_session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });

    const session = await getSession(token);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { tenantId, locationId } = session;

    // Get location's pricing strategy
    let strategyId: string | null = null;
    if (locationId) {
      const [loc] = await db
        .select({ strategyId: locations.pricingStrategyId })
        .from(locations)
        .where(eq(locations.id, locationId))
        .limit(1);
      strategyId = loc?.strategyId ?? null;
    }

    // Compute catalog version: MAX(version) + count + last updated
    let result;
    // Also check variant updatedAt for delta detection
    const [variantMaxUpdated] = await db
      .select({ maxUpdatedAt: sql<string>`MAX(${productVariants.updatedAt})` })
      .from(productVariants)
      .where(eq(productVariants.tenantId, tenantId));

    if (!strategyId) {
      [result] = await db
        .select({
          maxVersion: sql<number>`COALESCE(MAX(${products.version}), 0)`,
          productCount: sql<number>`COUNT(*)`,
          lastUpdatedAt: sql<string>`GREATEST(MAX(${products.updatedAt}), ${variantMaxUpdated?.maxUpdatedAt || null})`,
        })
        .from(products)
        .where(and(eq(products.tenantId, tenantId), isNull(products.deletedAt)));
    } else {
      [result] = await db
        .select({
          maxVersion: sql<number>`COALESCE(MAX(${products.version}), 0)`,
          productCount: sql<number>`COUNT(*)`,
          lastUpdatedAt: sql<string>`GREATEST(MAX(${products.updatedAt}), MAX(${pricingStrategyItems.updatedAt}), ${variantMaxUpdated?.maxUpdatedAt || null})`,
        })
        .from(products)
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
            or(isNull(pricingStrategyItems.id), eq(pricingStrategyItems.isAvailable, true))
          )
        );
    }

    return NextResponse.json({
      catalogVersion: result.maxVersion,
      productCount: result.productCount,
      lastUpdatedAt: result.lastUpdatedAt,
      pricingStrategyId: strategyId,
      locationId: locationId || null,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
