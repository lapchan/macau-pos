const STORAGE_KEY = "pos_offline_orders";

export type PendingOrder = {
  id: string;
  tempOrderNumber: string;
  input: PendingOrderInput;
  queuedAt: string;
  status: "pending" | "syncing" | "failed";
};

// Mirror of CreateOrderInput but serializable (no server action types)
export type PendingOrderInput = {
  cart: {
    productId?: string;
    name: string;
    translations?: Record<string, string>;
    unitPrice: number;
    quantity: number;
    discountAmount?: number;
    discountNote?: string;
    variantId?: string;
    variantName?: string;
    optionCombo?: Record<string, string>;
  }[];
  paymentMethod: "tap" | "insert" | "qr" | "cash";
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  total: number;
  cashReceived?: number;
  changeGiven?: number;
  customerId?: string;
  discountMeta?: { type: "percent" | "fixed"; value: number } | null;
};

function read(): PendingOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(orders: PendingOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function buildTempNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const existing = read().filter(o => o.tempOrderNumber.startsWith(`LOCAL-${yy}${mm}${dd}`));
  const seq = existing.length + 1;
  return `LOCAL-${yy}${mm}${dd}-${String(seq).padStart(4, "0")}`;
}

export function enqueueOrder(input: PendingOrderInput): PendingOrder {
  const pending: PendingOrder = {
    id: crypto.randomUUID(),
    tempOrderNumber: buildTempNumber(),
    input,
    queuedAt: new Date().toISOString(),
    status: "pending",
  };
  const orders = read();
  orders.push(pending);
  write(orders);
  return pending;
}

export function getPendingOrders(): PendingOrder[] {
  return read();
}

export function getPendingCount(): number {
  return read().length;
}

export function removePendingOrder(id: string) {
  write(read().filter(o => o.id !== id));
}

export type SyncResult = { synced: number; failed: number; results: { id: string; orderNumber?: string; error?: string }[] };

export async function syncPendingOrders(): Promise<SyncResult> {
  const { createOrder } = await import("./actions");
  const orders = read();
  if (orders.length === 0) return { synced: 0, failed: 0, results: [] };

  const results: SyncResult["results"] = [];
  let synced = 0;
  let failed = 0;

  for (const pending of orders) {
    try {
      const result = await createOrder(pending.input);
      if (result.success) {
        removePendingOrder(pending.id);
        results.push({ id: pending.id, orderNumber: result.orderNumber });
        synced++;
      } else {
        results.push({ id: pending.id, error: result.error });
        failed++;
      }
    } catch {
      results.push({ id: pending.id, error: "Network error" });
      failed++;
    }
  }

  return { synced, failed, results };
}
