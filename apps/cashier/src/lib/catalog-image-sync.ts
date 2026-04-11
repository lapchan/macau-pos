/**
 * Product image caching for the catalog sync module.
 * Fetches images as blobs, stores in IndexedDB, serves via blob URLs.
 */

import {
  type CatalogProduct,
  getCachedImage,
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
 */
export async function syncImages(
  products: CatalogProduct[],
  onProgress?: ProgressCallback,
  signal?: AbortSignal,
  extraImageUrls?: string[]
): Promise<void> {
  // Collect unique image URLs (products + variants + extras)
  const imageUrls = [...new Set([
    ...products.map((p) => p.image).filter(Boolean) as string[],
    ...(extraImageUrls || []),
  ])];

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

/** Remove cached images that are no longer referenced by any product */
export async function cleanupOrphanedImages(currentProducts: CatalogProduct[]): Promise<void> {
  const activeUrls = new Set(
    currentProducts.map((p) => p.image).filter(Boolean) as string[]
  );

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

/** Handle image URL changes for specific products */
export async function syncChangedImages(
  changedProducts: CatalogProduct[],
  signal?: AbortSignal
): Promise<void> {
  for (const product of changedProducts) {
    if (!product.image) continue;

    const existing = await getCachedImage(product.image);
    if (existing) continue; // Already cached at this URL

    // New or changed image — fetch it
    try {
      await fetchAndStoreImage(product.image, signal);
    } catch {
      // Failed — will use network fallback
    }
  }
}
