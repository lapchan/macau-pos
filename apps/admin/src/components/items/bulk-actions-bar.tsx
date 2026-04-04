"use client";

import { useState } from "react";
import { Trash2, X, ChevronDown } from "lucide-react";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";

type Props = {
  count: number;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  onClear: () => void;
};

const STATUS_OPTION_KEYS = [
  { value: "active", key: "common.statusActive" as const },
  { value: "draft", key: "common.statusDraft" as const },
  { value: "inactive", key: "common.statusInactive" as const },
  { value: "sold_out", key: "common.statusSoldOut" as const },
];

export default function BulkActionsBar({ count, onDelete, onStatusChange, onClear }: Props) {
  const { locale } = useLocale();
  const [statusOpen, setStatusOpen] = useState(false);

  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-[scaleIn_0.2s_ease-out]">
      <div className="flex items-center gap-2 h-12 px-4 bg-text-primary text-surface rounded-[var(--radius-lg)] shadow-xl">
        {/* Count */}
        <span className="text-[13px] font-medium whitespace-nowrap">
          {interpolate(t(locale, "common.selected"), { count })}
        </span>

        <div className="w-px h-5 bg-white/20" />

        {/* Status dropdown */}
        <div className="relative">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className="flex items-center gap-1 h-8 px-3 text-[12px] font-medium bg-white/10 hover:bg-white/20 rounded-[var(--radius-sm)] transition-colors"
          >
            {t(locale, "common.status")}
            <ChevronDown className="h-3 w-3" />
          </button>
          {statusOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
              <div className="absolute bottom-full left-0 mb-2 z-20 w-36 bg-surface border border-border rounded-[var(--radius-md)] shadow-lg py-1">
                {STATUS_OPTION_KEYS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onStatusChange(opt.value);
                      setStatusOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-[13px] text-text-primary hover:bg-surface-hover transition-colors"
                  >
                    {t(locale, opt.key)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="flex items-center gap-1 h-8 px-3 text-[12px] font-medium bg-danger/20 hover:bg-danger/30 text-danger-light rounded-[var(--radius-sm)] transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t(locale, "common.delete")}
        </button>

        <div className="w-px h-5 bg-white/20" />

        {/* Clear selection */}
        <button
          onClick={onClear}
          aria-label={t(locale, "common.clearSelection")}
          className="h-7 w-7 flex items-center justify-center hover:bg-white/10 rounded-[var(--radius-sm)] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
