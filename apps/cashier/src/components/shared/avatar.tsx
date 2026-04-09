"use client";

import { useState, useEffect } from "react";

const CACHE_KEY = "pos_avatar_cache";

/** Read cached data-URL from localStorage */
function getCachedAvatar(url: string): string | null {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    return cache[url] || null;
  } catch { return null; }
}

/** Cache a data-URL in localStorage keyed by original URL */
function setCachedAvatar(url: string, dataUrl: string) {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    cache[url] = dataUrl;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* storage full — ignore */ }
}

type Props = {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
};

export default function Avatar({ src, name, size = 40, className = "" }: Props) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => {
    if (!src) return null;
    return getCachedAvatar(src) || src;
  });
  const [error, setError] = useState(false);
  const initial = name.charAt(0).toUpperCase();

  // When src changes, check cache first
  useEffect(() => {
    if (!src) { setResolvedSrc(null); return; }
    const cached = getCachedAvatar(src);
    if (cached) { setResolvedSrc(cached); setError(false); return; }
    setResolvedSrc(src);
    setError(false);
  }, [src]);

  // On successful load, cache as data URL
  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (!src || resolvedSrc?.startsWith("data:")) return;
    try {
      const img = e.currentTarget;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setCachedAvatar(src, dataUrl);
    } catch { /* cross-origin — ignore, browser cache still works */ }
  }

  if (resolvedSrc && !error) {
    return (
      <img
        src={resolvedSrc}
        alt={name}
        crossOrigin="anonymous"
        className={`rounded-full object-cover bg-[#f5f5f7] shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onLoad={handleLoad}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: "var(--color-pos-accent, #0071e3)" }}
    >
      <span className="text-white font-semibold" style={{ fontSize: size * 0.375 }}>
        {initial}
      </span>
    </div>
  );
}
