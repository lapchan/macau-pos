"use client";

import { ShoppingBag } from "lucide-react";
import { type Locale, t } from "@/i18n/locales";
import type { SyncProgress } from "@/lib/use-catalog-sync";

type Props = {
  progress: SyncProgress | null;
  locale?: Locale;
  onSkip: () => void;
};

export default function SyncOverlay({ progress, locale = "tc", onSkip }: Props) {
  const pct = progress && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-pos-bg gap-5">
      <div
        className="h-12 w-12 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: "var(--color-pos-accent, #0071e3)" }}
      >
        <ShoppingBag className="h-6 w-6 text-white" />
      </div>
      <div className="text-center">
        <p className="text-[15px] font-medium text-pos-text">
          {t(locale, "preloadTitle")}
        </p>
        <p className="text-[12px] text-pos-text-muted mt-1">
          {progress
            ? `${progress.current} / ${progress.total} ${progress.phase === "images" ? t(locale, "preloadImages") : t(locale, "preloadImages")}`
            : "..."
          }
        </p>
      </div>
      <div className="w-48 h-1.5 bg-pos-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%`, backgroundColor: "var(--color-pos-accent, #0071e3)" }}
        />
      </div>
      <button
        onClick={onSkip}
        className="text-[12px] text-pos-text-muted hover:text-pos-text transition-colors mt-2"
      >
        {t(locale, "preloadSkip")}
      </button>
    </div>
  );
}
