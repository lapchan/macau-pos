import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  db, getSession, products, categories, brands, locations,
  pricingStrategyItems, productVariants, eq, and, or, isNull, gt, asc, sql,
} from "@macau-pos/database";
import { getProductVariantsForCashier } from "@/lib/queries";

const COOKIE_NAME = "pos_session";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });

    const session = await getSession(token);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { tenantId, locationId } = session;
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "full";
    const since = url.searchParams.get("since");

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

    const syncedAt = new Date().toISOString();

    // ─── Fetch products ──────────────────────────────────
    const baseSelect = {
      id: products.id,
      name: products.name,
      translations: products.translations,
      sellingPrice: strategyId
        ? sql<string>`COALESCE(${pricingStrategyItems.sellingPrice}, ${products.sellingPrice})`
        : products.sellingPrice,
      stock: strategyId
        ? sql<number | null>`COALESCE(${pricingStrategyItems.stock}, ${products.stock})`
        : products.stock,
      status: products.status,
      isPopular: products.isPopular,
      image: products.image,
      categoryId: products.categoryId,
      hasVariants: products.hasVariants,
      brandName: brands.name,
      barcode: products.barcode,
      sortOrder: products.sortOrder,
      version: products.version,
      updatedAt: products.updatedAt,
    };

    let query = db
      .select(baseSelect)
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id));

    if (strategyId) {
      query = query.leftJoin(
        pricingStrategyItems,
        and(
          eq(pricingStrategyItems.strategyId, strategyId),
          eq(pricingStrategyItems.productId, products.id),
          isNull(pricingStrategyItems.variantId)
        )
      ) as typeof query;
    }

    // Base conditions
    const conditions = [
      eq(products.tenantId, tenantId),
      isNull(products.deletedAt),
    ];

    // Strategy availability filter
    if (strategyId) {
      conditions.push(
        or(isNull(pricingStrategyItems.id), eq(pricingStrategyItems.isAvailable, true))!
      );
    }

    // Delta: only products updated since timestamp
    if (mode === "delta" && since) {
      conditions.push(gt(products.updatedAt, new Date(since)));
    }

    const productRows = await query
      .where(and(...conditions))
      .orderBy(asc(products.sortOrder));

    // Transform to catalog format
    const catalogProducts = productRows.map((p) => ({
      id: p.id,
      name: p.name,
      translations: p.translations as Record<string, string> | null,
      sellingPrice: parseFloat(String(p.sellingPrice)),
      stock: p.stock,
      status: p.status,
      isPopular: p.isPopular,
      image: p.image,
      categoryId: p.categoryId,
      hasVariants: p.hasVariants,
      brandName: p.brandName,
      barcode: p.barcode,
      sortOrder: p.sortOrder,
      version: p.version,
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : syncedAt,
    }));

    // ─── Fetch deleted product IDs (delta only) ──────────
    let deletedProductIds: string[] = [];
    if (mode === "delta" && since) {
      const deleted = await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            eq(products.tenantId, tenantId),
            gt(products.deletedAt, new Date(since))
          )
        );
      deletedProductIds = deleted.map((d) => d.id);
    }

    // ─── Fetch categories ────────────────────────────────
    const categoryRows = await db
      .select({
        id: categories.id,
        name: categories.name,
        translations: categories.translations,
        parentCategoryId: categories.parentCategoryId,
        icon: categories.icon,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .where(and(eq(categories.tenantId, tenantId), eq(categories.isActive, true)))
      .orderBy(asc(categories.sortOrder));

    const catalogCategories = categoryRows.map((c) => ({
      id: c.id,
      name: c.name,
      translations: c.translations as Record<string, string> | null,
      parentCategoryId: c.parentCategoryId,
      icon: c.icon,
      sortOrder: c.sortOrder,
    }));

    // ─── Fetch variants for products with hasVariants ────
    const variantProducts = catalogProducts.filter((p) => p.hasVariants);
    const variantsData = await Promise.all(
      variantProducts.map(async (p) => {
        const data = await getProductVariantsForCashier(p.id);
        return { productId: p.id, ...data };
      })
    );

    // ─── Catalog version ─────────────────────────────────
    const maxVersion = catalogProducts.reduce((max, p) => Math.max(max, p.version), 0);

    return NextResponse.json({
      products: catalogProducts,
      categories: catalogCategories,
      variants: variantsData,
      deletedProductIds,
      syncedAt,
      catalogVersion: maxVersion,
      pricingStrategyId: strategyId,
      locationId: locationId || null,
    });
  } catch (e) {
    console.error("Catalog sync error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
