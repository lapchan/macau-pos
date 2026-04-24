import type { IncomingMessage, ServerResponse } from "node:http";

export interface RateLimiterOptions {
  rps: number;
  burst: number;
  now?: () => number;
}

// Token-bucket: refills at `rps` tokens/second, capped at `burst`.
// One bucket per key (IP or token). Keys are lazy-created.
export class RateLimiter {
  private readonly rps: number;
  private readonly burst: number;
  private readonly now: () => number;
  private readonly buckets = new Map<
    string,
    { tokens: number; last: number }
  >();

  constructor(opts: RateLimiterOptions) {
    this.rps = opts.rps;
    this.burst = opts.burst;
    this.now = opts.now ?? (() => Date.now());
  }

  tryConsume(key: string, cost = 1): boolean {
    const t = this.now();
    let b = this.buckets.get(key);
    if (!b) {
      b = { tokens: this.burst, last: t };
      this.buckets.set(key, b);
    }
    const elapsedMs = t - b.last;
    b.tokens = Math.min(this.burst, b.tokens + (elapsedMs / 1000) * this.rps);
    b.last = t;
    if (b.tokens < cost) return false;
    b.tokens -= cost;
    return true;
  }

  // Exposed for tests.
  peek(key: string): number | undefined {
    return this.buckets.get(key)?.tokens;
  }
}

function sendJson(
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function keyFor(req: IncomingMessage): string {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    // Keyed by token so per-cashier limits don't collide with other devices
    // sharing the bridge IP (e.g. multiple iPads on same LAN).
    return auth.slice(7, 7 + 16);
  }
  return req.socket.remoteAddress ?? "unknown";
}

export function makeRateLimit(limiter: RateLimiter) {
  return (req: IncomingMessage, res: ServerResponse): boolean => {
    const ok = limiter.tryConsume(keyFor(req));
    if (!ok) {
      sendJson(res, 429, { error: "rate_limited" });
      return false;
    }
    return true;
  };
}
