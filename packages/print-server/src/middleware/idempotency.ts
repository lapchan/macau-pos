import type { IncomingMessage } from "node:http";

export interface IdempotencyEntry {
  status: number;
  body: unknown;
  expiresAt: number;
}

export interface IdempotencyCacheOptions {
  ttlMs: number;
  maxEntries?: number;
  now?: () => number;
}

// LRU map keyed by Idempotency-Key. Entries expire after `ttlMs` regardless of
// access; evicted oldest-first when size > `maxEntries`.
export class IdempotencyCache {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly now: () => number;
  private readonly map = new Map<string, IdempotencyEntry>();

  constructor(opts: IdempotencyCacheOptions) {
    this.ttlMs = opts.ttlMs;
    this.maxEntries = opts.maxEntries ?? 10000;
    this.now = opts.now ?? (() => Date.now());
  }

  size(): number {
    return this.map.size;
  }

  get(key: string): IdempotencyEntry | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (e.expiresAt <= this.now()) {
      this.map.delete(key);
      return undefined;
    }
    // LRU bump
    this.map.delete(key);
    this.map.set(key, e);
    return e;
  }

  set(key: string, status: number, body: unknown): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, {
      status,
      body,
      expiresAt: this.now() + this.ttlMs,
    });
    while (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value as string | undefined;
      if (!oldest) break;
      this.map.delete(oldest);
    }
  }
}

export function idempotencyKey(req: IncomingMessage): string | undefined {
  const v = req.headers["idempotency-key"];
  if (Array.isArray(v)) return v[0];
  return v;
}
