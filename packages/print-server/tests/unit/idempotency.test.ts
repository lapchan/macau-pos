import { describe, it, expect } from "vitest";
import { IdempotencyCache } from "../../src/middleware/idempotency.js";

describe("IdempotencyCache", () => {
  it("U-IDEM-01 first lookup misses", () => {
    const cache = new IdempotencyCache({ ttlMs: 5000 });
    expect(cache.get("k1")).toBeUndefined();
  });

  it("U-IDEM-02 replay within TTL returns cached entry", () => {
    let now = 1000;
    const cache = new IdempotencyCache({ ttlMs: 5000, now: () => now });
    cache.set("k1", 200, { ok: true });
    now = 3000; // 2s later, still within ttl
    const entry = cache.get("k1");
    expect(entry).toBeDefined();
    expect(entry?.status).toBe(200);
    expect(entry?.body).toEqual({ ok: true });
  });

  it("U-IDEM-03 after TTL expires, miss again", () => {
    let now = 1000;
    const cache = new IdempotencyCache({ ttlMs: 5000, now: () => now });
    cache.set("k1", 200, { ok: true });
    now = 1000 + 5001;
    expect(cache.get("k1")).toBeUndefined();
    expect(cache.size()).toBe(0);
  });

  it("U-IDEM-04 LRU eviction past maxEntries", () => {
    const cache = new IdempotencyCache({ ttlMs: 60_000, maxEntries: 3 });
    cache.set("a", 200, 1);
    cache.set("b", 200, 2);
    cache.set("c", 200, 3);
    cache.set("d", 200, 4); // evicts "a"
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")?.body).toBe(2);
    expect(cache.get("c")?.body).toBe(3);
    expect(cache.get("d")?.body).toBe(4);
  });

  it("LRU-bump on get keeps frequently-accessed entries", () => {
    const cache = new IdempotencyCache({ ttlMs: 60_000, maxEntries: 2 });
    cache.set("a", 200, "A");
    cache.set("b", 200, "B");
    // Access "a" to mark it recently used, then push "c" — "b" should evict.
    cache.get("a");
    cache.set("c", 200, "C");
    expect(cache.get("a")?.body).toBe("A");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")?.body).toBe("C");
  });
});
