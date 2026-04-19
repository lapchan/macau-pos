"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X, Loader2 } from "lucide-react";
import { type Locale, localeNames, t } from "@/i18n/locales";

type Props = {
  visible: boolean;
};

function readLocale(): Locale {
  if (typeof window === "undefined") return "tc";
  const saved = window.localStorage.getItem("pos-locale");
  return saved && saved in localeNames ? (saved as Locale) : "tc";
}

export default function UpdateBanner({ visible }: Props) {
  const [locale, setLocale] = useState<Locale>("tc");
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setLocale(readLocale());

    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<Locale>).detail;
      if (detail && detail in localeNames) setLocale(detail);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "pos-locale") setLocale(readLocale());
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") setLocale(readLocale());
    };

    window.addEventListener("pos-locale-changed", onCustom);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pos-locale-changed", onCustom);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (!visible || dismissed) return null;

  const reload = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {}
    window.location.reload();
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[9998] flex justify-center px-3 pt-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-[var(--radius-lg)] px-4 py-2.5 shadow-lg max-w-md w-full bg-pos-surface border border-pos-border animate-[fadeSlideDown_0.25s_ease-out]">
        <span
          className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            updating ? "bg-pos-accent text-white" : "bg-pos-accent-light text-pos-accent"
          }`}
        >
          {updating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </span>
        <div className="flex-1 text-[13px] leading-tight min-w-0">
          <div className="font-semibold text-pos-text truncate">
            {t(locale, updating ? "updateAvailableUpdating" : "updateAvailableTitle")}
          </div>
          <div className="text-pos-text-secondary text-[12px] truncate">
            {t(locale, updating ? "updateAvailableWait" : "updateAvailableBody")}
          </div>
        </div>
        {!updating && (
          <>
            <button
              onClick={reload}
              className="text-[12px] font-semibold text-white rounded-[var(--radius-md)] px-3 py-1.5 transition-colors bg-pos-accent hover:bg-pos-accent-hover"
            >
              {t(locale, "updateAvailableReload")}
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label={t(locale, "updateAvailableLater")}
              className="text-pos-text-muted hover:text-pos-text transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
