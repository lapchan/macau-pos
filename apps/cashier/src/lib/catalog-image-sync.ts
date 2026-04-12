/**
 * Product image caching for the catalog sync module.
 * Fetches images as blobs, stores in IndexedDB, serves via blob URLs.
 */

import {
  type CatalogProduct,
  putImage,
  deleteImage,
  getAllImages,
  getAllImageUrls,
} from "./catalog-db";

const MAX_CONCURRENT = 6;

// ─── In-Memory Blob URL Cache ────────────────────────────

const blobUrlCache = new Map<string, string>();

/** Resolve an image URL: returns blob URL if cached, otherwise the original URL */
export function resolveImageSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return blobUrlCache.get(url) || url;
}

/** Initialize the in-memory cache from IndexedDB (call once on app load) */
export async function initImageCache(): Promise<void> {
  try {
    const allImages = await getAllImages();
    for (const img of allImages) {
      const blobUrl = URL.createObjectURL(img.blob);
      blobUrlCache.set(img.url, blobUrl);
    }
  } catch {
    // IndexedDB not available — images will load from network
  }
}

/** Clear the in-memory cache (revoke all blob URLs) */
export function clearImageCache(): void {
  for (const blobUrl of blobUrlCache.values()) {
    URL.revokeObjectURL(blobUrl);
  }
  blobUrlCache.clear();
}

// ─── Image Sync ──────────────────────────────────────────

export type ImageSyncProgress = {
  total: number;
  cached: number;
  fetching: number;
  failed: number;
};

type ProgressCallback = (progress: ImageSyncProgress) => void;

/**
 * Sync images for a list of products.
 * Skips already-cached images, fetches missing ones in batches.
 *
 * URL ordering: for each product we emit the main image followed by that
 * product's variant images, so every batch loads a full product before
 * moving on. This means tapping any already-synced card shows its variant
 * swatches without a network round-trip, even if sync is still in progress.
 */
export async function syncImages(
  products: CatalogProduct[],
  onProgress?: ProgressCallback,
  signal?: AbortSignal,
  variantsByProduct?: Map<string, string[]>
): Promise<void> {
  const imageUrls: string[] = [];
  const seen = new Set<string>();
  const push = (url: string | null | undefined) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    imageUrls.push(url);
  };
  for (const p of products) {
    push(p.image);
    const vars = variantsByProduct?.get(p.id);
    if (vars) for (const v of vars) push(v);
  }
  if (variantsByProduct) {
    // Orphan variant URLs (variants whose parent product isn't in the list)
    for (const vars of variantsByProduct.values()) {
      for (const v of vars) push(v);
    }
  }

  if (imageUrls.length === 0) { console.log("[ImageSync] No image URLs to sync"); return; }

  // Check which are already cached
  const cachedUrls = new Set(await getAllImageUrls());
  const needed = imageUrls.filter((url) => !cachedUrls.has(url));
  console.log(`[ImageSync] ${imageUrls.length} total, ${cachedUrls.size} cached, ${needed.length} needed`);

  const progress: ImageSyncProgress = {
    total: imageUrls.length,
    cached: imageUrls.length - needed.length,
    fetching: 0,
    failed: 0,
  };

  onProgress?.(progress);

  if (needed.length === 0) return;

  // Fetch in batches
  for (let i = 0; i < needed.length; i += MAX_CONCURRENT) {
    if (signal?.aborted) return;

    const batch = needed.slice(i, i + MAX_CONCURRENT);
    const results = await Promise.allSettled(
      batch.map((url) => fetchAndStoreImage(url, signal))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        progress.cached++;
      } else {
        progress.failed++;
      }
      progress.fetching = Math.min(i + MAX_CONCURRENT, needed.length);
    }

    onProgress?.(progress);
  }
}

async function fetchAndStoreImage(url: string, signal?: AbortSignal): Promise<void> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const blob = await response.blob();

  await putImage({
    url,
    blob,
    fetchedAt: new Date().toISOString(),
  });

  // Update in-memory cache
  const blobUrl = URL.createObjectURL(blob);
  blobUrlCache.set(url, blobUrl);
}

// ─── Image Cleanup ───────────────────────────────────────

/** Remove cached images that are no longer referenced by any product or variant */
export async function cleanupOrphanedImages(
  currentProducts: CatalogProduct[],
  variantsByProduct?: Map<string, string[]>
): Promise<void> {
  const activeUrls = new Set<string>();
  for (const p of currentProducts) {
    if (p.image) activeUrls.add(p.image);
  }
  if (variantsByProduct) {
    for (const vars of variantsByProduct.values()) {
      for (const v of vars) activeUrls.add(v);
    }
  }

  const cachedUrls = await getAllImageUrls();

  for (const url of cachedUrls) {
    if (!activeUrls.has(url)) {
      // Revoke blob URL from memory
      const blobUrl = blobUrlCache.get(url);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        blobUrlCache.delete(url);
      }
      // Delete from IndexedDB
      await deleteImage(url);
    }
  }
}
