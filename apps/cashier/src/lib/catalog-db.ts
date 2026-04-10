/**
 * IndexedDB interface for the product catalog cache.
 * Stores products, categories, image blobs, and sync metadata.
 */

const DB_NAME = "pos-catalog";
const DB_VERSION = 1;

// Store names
export const STORES = {
  PRODUCTS: "products",
  CATEGORIES: "categories",
  IMAGES: "images",
  SYNC_META: "sync-meta",
} as const;

// Types stored in IndexedDB
export type CatalogProduct = {
  id: string;
  name: string;
  translations: Record<string, string> | null;
  sellingPrice: number;
  stock: number | null;
  status: string;
  isPopular: boolean;
  image: string | null;
  categoryId: string | null;
  hasVariants: boolean;
  brandName: string | null;
  barcode: string | null;
  sortOrder: number;
  version: number;
  updatedAt: string;
};

export type CatalogCategory = {
  id: string;
  name: string;
  translations: Record<string, string> | null;
  parentCategoryId: string | null;
  icon: string | null;
  sortOrder: number;
};

export type CachedImage = {
  url: string;
  blob: Blob;
  fetchedAt: string;
};

export type SyncMetaKey =
  | "lastSyncAt"
  | "catalogVersion"
  | "locationId"
  | "pricingStrategyId"
  | "syncStatus";

// ─── Database Open / Upgrade ─────────────────────────────

let dbInstance: IDBDatabase | null = null;

export function openCatalogDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        const store = db.createObjectStore(STORES.PRODUCTS, { keyPath: "id" });
        store.createIndex("by-category", "categoryId");
        store.createIndex("by-barcode", "barcode");
        store.createIndex("by-sortOrder", "sortOrder");
      }

      if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
        const store = db.createObjectStore(STORES.CATEGORIES, { keyPath: "id" });
        store.createIndex("by-sortOrder", "sortOrder");
      }

      if (!db.objectStoreNames.contains(STORES.IMAGES)) {
        db.createObjectStore(STORES.IMAGES, { keyPath: "url" });
      }

      if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
        db.createObjectStore(STORES.SYNC_META, { keyPath: "key" });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      // Reset instance on close (e.g., browser clears data)
      dbInstance.onclose = () => { dbInstance = null; };
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

// ─── Generic Helpers ─────────────────────────────────────

function txPromise(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function requestPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Products CRUD ───────────────────────────────────────

export async function getAllProducts(): Promise<CatalogProduct[]> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.PRODUCTS, "readonly");
  return requestPromise(tx.objectStore(STORES.PRODUCTS).getAll());
}

export async function putProducts(items: CatalogProduct[]): Promise<void> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.PRODUCTS, "readwrite");
  const store = tx.objectStore(STORES.PRODUCTS);
  for (const item of items) {
    store.put(item);
  }
  return txPromise(tx);
}

export async function deleteProducts(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.PRODUCTS, "readwrite");
  const store = tx.objectStore(STORES.PRODUCTS);
  for (const id of ids) {
    store.delete(id);
  }
  return txPromise(tx);
}

export async function clearProducts(): Promise<void> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.PRODUCTS, "readwrite");
  tx.objectStore(STORES.PRODUCTS).clear();
  return txPromise(tx);
}

export async function getProductCount(): Promise<number> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.PRODUCTS, "readonly");
  return requestPromise(tx.objectStore(STORES.PRODUCTS).count());
}

// ─── Categories CRUD ─────────────────────────────────────

export async function getAllCategories(): Promise<CatalogCategory[]> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.CATEGORIES, "readonly");
  return requestPromise(tx.objectStore(STORES.CATEGORIES).getAll());
}

export async function replaceCategories(items: CatalogCategory[]): Promise<void> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.CATEGORIES, "readwrite");
  const store = tx.objectStore(STORES.CATEGORIES);
  store.clear();
  for (const item of items) {
    store.put(item);
  }
  return txPromise(tx);
}

// ─── Images CRUD ─────────────────────────────────────────

export async function getCachedImage(url: string): Promise<CachedImage | undefined> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.IMAGES, "readonly");
  return requestPromise(tx.objectStore(STORES.IMAGES).get(url));
}

export async function putImage(entry: CachedImage): Promise<void> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.IMAGES, "readwrite");
  tx.objectStore(STORES.IMAGES).put(entry);
  return txPromise(tx);
}

export async function deleteImage(url: string): Promise<void> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.IMAGES, "readwrite");
  tx.objectStore(STORES.IMAGES).delete(url);
  return txPromise(tx);
}

export async function getAllImageUrls(): Promise<string[]> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.IMAGES, "readonly");
  const keys = await requestPromise(tx.objectStore(STORES.IMAGES).getAllKeys());
  return keys as string[];
}

export async function getAllImages(): Promise<CachedImage[]> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.IMAGES, "readonly");
  return requestPromise(tx.objectStore(STORES.IMAGES).getAll());
}

export async function clearImages(): Promise<void> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.IMAGES, "readwrite");
  tx.objectStore(STORES.IMAGES).clear();
  return txPromise(tx);
}

// ─── Sync Metadata ───────────────────────────────────────

export async function getMeta(key: SyncMetaKey): Promise<string | number | null> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.SYNC_META, "readonly");
  const result = await requestPromise(tx.objectStore(STORES.SYNC_META).get(key));
  return result?.value ?? null;
}

export async function setMeta(key: SyncMetaKey, value: string | number | null): Promise<void> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.SYNC_META, "readwrite");
  tx.objectStore(STORES.SYNC_META).put({ key, value });
  return txPromise(tx);
}

export async function getAllMeta(): Promise<Record<string, string | number | null>> {
  const db = await openCatalogDB();
  const tx = db.transaction(STORES.SYNC_META, "readonly");
  const all = await requestPromise(tx.objectStore(STORES.SYNC_META).getAll());
  const map: Record<string, string | number | null> = {};
  for (const entry of all) {
    map[entry.key] = entry.value;
  }
  return map;
}

// ─── Bulk Operations ─────────────────────────────────────

/** Clear all stores — used on location change or full reset */
export async function clearAllStores(): Promise<void> {
  const db = await openCatalogDB();
  const tx = db.transaction(
    [STORES.PRODUCTS, STORES.CATEGORIES, STORES.IMAGES, STORES.SYNC_META],
    "readwrite"
  );
  tx.objectStore(STORES.PRODUCTS).clear();
  tx.objectStore(STORES.CATEGORIES).clear();
  tx.objectStore(STORES.IMAGES).clear();
  tx.objectStore(STORES.SYNC_META).clear();
  return txPromise(tx);
}

/** Full sync write — clears products/categories, writes new data + meta in one transaction */
export async function writeFullSync(
  products: CatalogProduct[],
  categories: CatalogCategory[],
  meta: { lastSyncAt: string; catalogVersion: number; locationId: string; pricingStrategyId: string | null }
): Promise<void> {
  const db = await openCatalogDB();
  const tx = db.transaction(
    [STORES.PRODUCTS, STORES.CATEGORIES, STORES.SYNC_META],
    "readwrite"
  );

  const prodStore = tx.objectStore(STORES.PRODUCTS);
  const catStore = tx.objectStore(STORES.CATEGORIES);
  const metaStore = tx.objectStore(STORES.SYNC_META);

  prodStore.clear();
  catStore.clear();

  for (const p of products) prodStore.put(p);
  for (const c of categories) catStore.put(c);

  metaStore.put({ key: "lastSyncAt", value: meta.lastSyncAt });
  metaStore.put({ key: "catalogVersion", value: meta.catalogVersion });
  metaStore.put({ key: "locationId", value: meta.locationId });
  metaStore.put({ key: "pricingStrategyId", value: meta.pricingStrategyId });
  metaStore.put({ key: "syncStatus", value: "idle" });

  return txPromise(tx);
}

/** Delta sync write — upserts changed products, deletes removed, replaces categories */
export async function writeDeltaSync(
  changedProducts: CatalogProduct[],
  deletedProductIds: string[],
  categories: CatalogCategory[],
  meta: { lastSyncAt: string; catalogVersion: number }
): Promise<void> {
  const db = await openCatalogDB();
  const tx = db.transaction(
    [STORES.PRODUCTS, STORES.CATEGORIES, STORES.SYNC_META],
    "readwrite"
  );

  const prodStore = tx.objectStore(STORES.PRODUCTS);
  const catStore = tx.objectStore(STORES.CATEGORIES);
  const metaStore = tx.objectStore(STORES.SYNC_META);

  for (const p of changedProducts) prodStore.put(p);
  for (const id of deletedProductIds) prodStore.delete(id);

  catStore.clear();
  for (const c of categories) catStore.put(c);

  metaStore.put({ key: "lastSyncAt", value: meta.lastSyncAt });
  metaStore.put({ key: "catalogVersion", value: meta.catalogVersion });

  return txPromise(tx);
}
