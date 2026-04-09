"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const SW_CACHE_NAME = "pos-v2";
const BATCH_SIZE = 6;
const TIMEOUT_MS = 30000;

export type PreloadPhase = "checking" | "loading" | "done";

export function useImagePreloader(imageUrls: string[]) {
  const [phase, setPhase] = useState<PreloadPhase>("checking");
  const [loaded, setLoaded] = useState(0);
  const [total] = useState(imageUrls.length);
  const abortRef = useRef<AbortController | null>(null);
  const doneRef = useRef(false);

  const skip = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    abortRef.current?.abort();
    setPhase("done");
  }, []);

  useEffect(() => {
    if (imageUrls.length === 0) {
      setPhase("done");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        controller.abort();
        setPhase("done");
      }
    }, TIMEOUT_MS);

    async function run() {
      // Phase 1: Check which images are already cached
      let cached = new Set<string>();
      try {
        const cache = await caches.open(SW_CACHE_NAME);
        const checks = await Promise.all(
          imageUrls.map(async (url) => {
            const match = await cache.match(url);
            return match ? url : null;
          })
        );
        cached = new Set(checks.filter(Boolean) as string[]);
      } catch {
        // Cache API not available — need to fetch all
      }

      if (controller.signal.aborted) return;

      const uncached = imageUrls.filter(url => !cached.has(url));

      // Phase 2: Fast-forward cached images visually
      if (cached.size > 0) {
        setPhase("loading");
        // Animate through cached images quickly (batches of 20, 30ms each)
        const FAST_BATCH = 20;
        for (let i = 0; i < cached.size; i += FAST_BATCH) {
          if (controller.signal.aborted) return;
          const count = Math.min(i + FAST_BATCH, cached.size);
          setLoaded(count);
          await new Promise(r => setTimeout(r, 30));
        }
      }

      if (uncached.length === 0) {
        // All cached — done
        if (!doneRef.current) {
          doneRef.current = true;
          setLoaded(imageUrls.length);
          // Small delay so user sees 100%
          setTimeout(() => setPhase("done"), 300);
        }
        clearTimeout(timeout);
        return;
      }

      // Phase 3: Fetch uncached images in batches
      setPhase("loading");
      let fetchedCount = cached.size;

      for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
        if (controller.signal.aborted) return;
        const batch = uncached.slice(i, i + BATCH_SIZE);
        await Promise.allSettled(
          batch.map(url =>
            fetch(url, { signal: controller.signal }).catch(() => {})
          )
        );
        fetchedCount += batch.length;
        if (!controller.signal.aborted) {
          setLoaded(Math.min(fetchedCount, imageUrls.length));
        }
      }

      // Done
      if (!doneRef.current) {
        doneRef.current = true;
        setLoaded(imageUrls.length);
        setTimeout(() => setPhase("done"), 300);
      }
      clearTimeout(timeout);
    }

    run();

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { phase, loaded, total, skip };
}
