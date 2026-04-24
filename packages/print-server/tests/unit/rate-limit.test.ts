import { describe, it, expect } from "vitest";
import { RateLimiter } from "../../src/middleware/rate-limit.js";

describe("RateLimiter — token bucket", () => {
  it("U-RL-01 10 reqs at start all pass (within burst budget)", () => {
    const rl = new RateLimiter({ rps: 10, burst: 10, now: () => 0 });
    for (let i = 0; i < 10; i++) {
      expect(rl.tryConsume("tok-a")).toBe(true);
    }
  });

  it("U-RL-02 11th at same instant is blocked", () => {
    const rl = new RateLimiter({ rps: 10, burst: 10, now: () => 0 });
    for (let i = 0; i < 10; i++) rl.tryConsume("tok-a");
    expect(rl.tryConsume("tok-a")).toBe(false);
  });

  it("U-RL-03 burst of 20 allowed when burst=20", () => {
    const rl = new RateLimiter({ rps: 10, burst: 20, now: () => 0 });
    for (let i = 0; i < 20; i++) {
      expect(rl.tryConsume("tok-a")).toBe(true);
    }
    expect(rl.tryConsume("tok-a")).toBe(false);
  });

  it("U-RL-04 refills ~rps tokens per second", () => {
    let t = 0;
    const rl = new RateLimiter({ rps: 10, burst: 10, now: () => t });
    for (let i = 0; i < 10; i++) rl.tryConsume("tok-a");
    expect(rl.tryConsume("tok-a")).toBe(false);
    t += 1000; // +1s → refills 10 tokens
    for (let i = 0; i < 10; i++) {
      expect(rl.tryConsume("tok-a")).toBe(true);
    }
    expect(rl.tryConsume("tok-a")).toBe(false);
  });

  it("U-RL-05 per-key isolation (different tokens don't cross-limit)", () => {
    const rl = new RateLimiter({ rps: 10, burst: 10, now: () => 0 });
    for (let i = 0; i < 10; i++) rl.tryConsume("tok-a");
    expect(rl.tryConsume("tok-a")).toBe(false);
    for (let i = 0; i < 10; i++) {
      expect(rl.tryConsume("tok-b")).toBe(true);
    }
  });

  it("partial refill is proportional", () => {
    let t = 0;
    const rl = new RateLimiter({ rps: 10, burst: 10, now: () => t });
    for (let i = 0; i < 10; i++) rl.tryConsume("x");
    t += 500; // half second → 5 tokens
    for (let i = 0; i < 5; i++) expect(rl.tryConsume("x")).toBe(true);
    expect(rl.tryConsume("x")).toBe(false);
  });
});
