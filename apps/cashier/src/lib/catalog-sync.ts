/**
 * Core catalog sync logic — full sync, delta sync, manifest check.
 * Pure functions (no React), called by the useCatalogSync hook.
 */

import {
  type CatalogProduct,
  type CatalogCategory,
  type CatalogVariantData,
  getAllProducts,
  getAllCategories,
  getVariants,
  putVariants,
  clearVariants,
  getAllMeta,
  writeFullSync,
  writeDeltaSync,
  clearAllStores,
} from "./catalog-db";

// ─── Types ───────────────────────────────────────────────

export type CatalogManifest = {
  catalogVersion: number;
  productCount: number;
  lastUpdatedAt: string | null;
  pricingStrategyId: string | null;
  locationId: string | null;
};

export type CatalogSyncResponse = {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  variants: CatalogVariantData[];
  deletedProductIds: string[];
  syncedAt: string;
  catalogVersion: number;
  pricingStrategyId: string | null;
  locationId: string | null;
};

export type SyncResult = {
  products: CatalogProduct[];
  categories: CatalogCategory[];
  type: "full" | "delta" | "cached" | "none";
};

// ─── Manifest Check ──────────────────────────────────────

export async function fetchManifest(): Promise<CatalogManifest> {
  const res = await fetch("/api/catalog/manifest", { cache: "no-store" });
  if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
  return res.json();
}

/**
 * Check if a sync is needed based on the manifest.
 * Returns: "full" | "delta" | "none"
 */
export async function checkSyncNeeded(
  currentLocationId: string | null
): Promise<"full" | "delta" | "none"> {
  const meta = await getAllMeta();

  // No previous sync — need full
  if (!meta.lastSyncAt) return "full";

  // Location changed — need full
  if (meta.locationId !== currentLocationId) return "full";

  try {
    const manifest = await fetchManifest();

    // Pricing strategy changed — need full
    if (manifest.pricingStrategyId !== meta.pricingStrategyId) return "full";

    // Location changed on server — need full
    if (manifest.locationId !== meta.locationId) return "full";

    // Version changed — need delta
    if (manifest.catalogVersion !== meta.catalogVersion) return "delta";

    // Check lastUpdatedAt (catches pricing strategy item changes)
    if (manifest.lastUpdatedAt && manifest.lastUpdatedAt !== meta.lastSyncAt) return "delta";

    return "none";
  } catch {
    return "none"; // Offline or server error — skip
  }
}

// ─── Full Sync ───────────────────────────────────────────

export async function performFullSync(
  locationId: string | null
): Promise<SyncResult> {
  const res = await fetch("/api/catalog/sync?mode=full", { cache: "no-store" });
  if (!res.ok) throw new Error(`Sync fetch failed: ${res.status}`);

  const data: CatalogSyncResponse = await res.json();

  await writeFullSync(data.products, data.categories, {
    lastSyncAt: data.syncedAt,
    catalogVersion: data.catalogVersion,
    locationId: data.locationId || locationId || "",
    pricingStrategyId: data.pricingStrategyId,
  });

  // Cache variants
  if (data.variants?.length) {
    await clearVariants();
    await putVariants(data.variants);
  }

  return {
    products: data.products,
    categories: data.categories,
    type: "full",
  };
}

// ─── Delta Sync ──────────────────────────────────────────

export async function performDeltaSync(): Promise<SyncResult> {
  const meta = await getAllMeta();
  const since = meta.lastSyncAt as string;

  const res = await fetch(
    `/api/catalog/sync?mode=delta&since=${encodeURIComponent(since)}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Delta sync failed: ${res.status}`);

  const data: CatalogSyncResponse = await res.json();

  await writeDeltaSync(data.products, data.deletedProductIds, data.categories, {
    lastSyncAt: data.syncedAt,
    catalogVersion: data.catalogVersion,
  });

  // Update variants for changed products
  if (data.variants?.length) {
    await putVariants(data.variants);
  }

  // Read full product list from IndexedDB (delta only changed some)
  const allProducts = await getAllProducts();
  const allCategories = await getAllCategories();

  return {
    products: allProducts,
    categories: allCategories,
    type: "delta",
  };
}

// ─── Load from Cache ─────────────────────────────────────

export async function loadFromCache(): Promise<SyncResult | null> {
  try {
    const meta = await getAllMeta();
    if (!meta.lastSyncAt) return null;

    const products = await getAllProducts();
    const categories = await getAllCategories();

    if (products.length === 0) return null;

    return { products, categories, type: "cached" };
  } catch {
    return null;
  }
}

// ─── Cached Variants ─────────────────────────────────────

export async function getCachedVariants(productId: string) {
  const data = await getVariants(productId);
  if (!data) return null;
  return { options: data.options, variants: data.variants };
}

// ─── Reset ───────────────────────────────────────────────

export async function resetCatalog(): Promise<void> {
  await clearAllStores();
}
