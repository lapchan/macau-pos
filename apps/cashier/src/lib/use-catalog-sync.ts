"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Product } from "@/data/mock";
import type { CategoryData } from "@/app/pos-client";
import type { CatalogProduct, CatalogCategory } from "./catalog-db";
import {
  loadFromCache,
  checkSyncNeeded,
  performFullSync,
  performDeltaSync,
} from "./catalog-sync";
import {
  initImageCache,
  syncImages,
  cleanupOrphanedImages,
  syncChangedImages,
  type ImageSyncProgress,
} from "./catalog-image-sync";

// ─── Types ───────────────────────────────────────────────

export type SyncStatus =
  | "loading"       // Reading from IndexedDB
  | "initial-sync"  // First-time full sync (blocks UI)
  | "syncing"       // Background incremental sync
  | "images"        // Syncing images (progress shown)
  | "idle"          // Up to date
  | "error"         // Sync failed
  | "offline";      // No network, using cached data

export type SyncProgress = {
  phase: "data" | "images";
  current: number;
  total: number;
};

export type UseCatalogSyncReturn = {
  products: Product[];
  categories: CategoryData[];
  syncStatus: SyncStatus;
  syncProgress: SyncProgress | null;
  forceFullSync: () => Promise<void>;
};

// ─── Converters (IndexedDB format → React component format) ──

function toClientProduct(p: CatalogProduct): Product {
  return {
    id: p.id,
    name: p.name,
    translations: p.translations || undefined,
    price: p.sellingPrice,
    category: p.categoryId || "all",
    image: p.image || undefined,
    inStock: p.status !== "sold_out" && (p.stock === null || p.stock > 0),
    popular: p.isPopular,
    hasVariants: p.hasVariants,
    brand: p.brandName || undefined,
    stock: p.stock,
  };
}

function toClientCategory(c: CatalogCategory): CategoryData {
  return {
    id: c.id,
    nameKey: c.name,
    name: c.name,
    translations: c.translations,
    icon: c.icon || "LayoutGrid",
    parentId: c.parentCategoryId,
  };
}

function buildCategoryList(dbCategories: CatalogCategory[]): CategoryData[] {
  const allCats = dbCategories.map(toClientCategory);

  // Build tree
  const topCats = allCats.filter((c) => !c.parentId);
  const childMap = new Map<string, CategoryData[]>();
  for (const c of allCats) {
    if (c.parentId) {
      const siblings = childMap.get(c.parentId) || [];
      siblings.push(c);
      childMap.set(c.parentId, siblings);
    }
  }

  return [
    { id: "all", nameKey: "all", name: "全部", translations: { en: "All", tc: "全部", sc: "全部", pt: "Tudo", ja: "すべて" }, icon: "LayoutGrid" },
    { id: "popular", nameKey: "popular", name: "熱賣", translations: { en: "Popular", tc: "熱賣", sc: "热卖", pt: "Popular", ja: "人気" }, icon: "Flame" },
    ...topCats.map((parent) => ({
      ...parent,
      children: childMap.get(parent.id) || undefined,
    })),
  ];
}

// ─── Hook ────────────────────────────────────────────────

const SYNC_INTERVAL = 60_000; // 60 seconds

export function useCatalogSync(
  initialProducts: Product[],
  initialCategories: CategoryData[],
  locationId: string | null
): UseCatalogSyncReturn {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<CategoryData[]>(initialCategories);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Apply sync result to state
  const applySyncResult = useCallback((
    catalogProducts: CatalogProduct[],
    catalogCategories: CatalogCategory[]
  ) => {
    if (!mountedRef.current) return;
    setProducts(catalogProducts.map(toClientProduct));
    setCategories(buildCategoryList(catalogCategories));
  }, []);

  // Image sync with progress
  const doImageSync = useCallback(async (
    catalogProducts: CatalogProduct[],
    showProgress: boolean,
    signal?: AbortSignal
  ) => {
    if (!mountedRef.current) return;
    if (showProgress) setSyncStatus("images");

    await syncImages(catalogProducts, (progress) => {
      if (!mountedRef.current) return;
      if (showProgress) {
        setSyncProgress({
          phase: "images",
          current: progress.cached,
          total: progress.total,
        });
      }
    }, signal);

    await cleanupOrphanedImages(catalogProducts);
    if (mountedRef.current) {
      setSyncStatus("idle");
      setSyncProgress(null);
    }
  }, []);

  // Full sync
  const doFullSync = useCallback(async (showOverlay: boolean) => {
    if (!mountedRef.current) return;
    if (showOverlay) setSyncStatus("initial-sync");
    else setSyncStatus("syncing");

    try {
      const result = await performFullSync(locationId);
      applySyncResult(result.products, result.categories);

      // Sync images
      await doImageSync(result.products, showOverlay);
    } catch {
      if (mountedRef.current) setSyncStatus("error");
    }
  }, [locationId, applySyncResult, doImageSync]);

  // Background sync check
  const backgroundCheck = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const needed = await checkSyncNeeded(locationId);
      if (needed === "none") return;

      if (needed === "full") {
        await doFullSync(false);
        return;
      }

      // Delta sync
      setSyncStatus("syncing");
      const result = await performDeltaSync();
      applySyncResult(result.products, result.categories);

      // Sync changed images in background
      await syncChangedImages(result.products);
      if (mountedRef.current) setSyncStatus("idle");
    } catch {
      // Offline or error — stay on cached data
      if (mountedRef.current) setSyncStatus("idle");
    }
  }, [locationId, doFullSync, applySyncResult]);

  // Force full sync (manual trigger)
  const forceFullSync = useCallback(async () => {
    await doFullSync(true);
  }, [doFullSync]);

  // ─── Initialize on mount ─────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    async function init() {
      try {
        // Try loading from IndexedDB cache
        const cached = await loadFromCache();

        if (cached) {
          // Cache hit — render immediately, then check for updates
          applySyncResult(cached.products, cached.categories);
          await initImageCache();
          setSyncStatus("idle");

          // Check for updates in background (non-blocking)
          backgroundCheck();
        } else if (navigator.onLine) {
          // No cache, online — do full sync
          setSyncStatus("initial-sync");
          setSyncProgress({ phase: "data", current: 0, total: initialProducts.length });

          try {
            const result = await performFullSync(locationId);
            applySyncResult(result.products, result.categories);
            setSyncProgress({ phase: "data", current: result.products.length, total: result.products.length });

            // Sync images with progress
            await doImageSync(result.products, true);
          } catch {
            // Sync failed — fall through to SSR props
            if (mountedRef.current) setSyncStatus("idle");
          }
        } else {
          // Offline, no cache — use SSR props as-is
          setSyncStatus("idle");
        }
      } catch {
        // Fall back to SSR props
        if (mountedRef.current) setSyncStatus("idle");
      }
    }

    init();

    // Schedule periodic sync checks
    intervalRef.current = setInterval(backgroundCheck, SYNC_INTERVAL);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { products, categories, syncStatus, syncProgress, forceFullSync };
}
