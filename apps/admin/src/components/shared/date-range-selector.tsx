"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/cn";
import { Calendar, ChevronDown } from "lucide-react";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";

export function DateRangeSelector() {
  const [selected, setSelected] = useState("14d");
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();

  const ranges = useMemo(() => [
    { label: t(locale, "dateRange.today"), value: "today" },
    { label: t(locale, "dateRange.yesterday"), value: "yesterday" },
    { label: t(locale, "dateRange.last7Days"), value: "7d" },
    { label: t(locale, "dateRange.last14Days"), value: "14d" },
    { label: t(locale, "dateRange.last30Days"), value: "30d" },
    { label: t(locale, "dateRange.thisMonth"), value: "month" },
  ], [locale]);

  const currentLabel = ranges.find((r) => r.value === selected)?.label;

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, handleEscape]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label={t(locale, "dateRange.selectRange")}
        aria-expanded={open}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-primary bg-surface border border-border rounded-[var(--radius-sm)] hover:border-border-strong transition-colors"
      >
        <Calendar className="h-3.5 w-3.5 text-text-tertiary" />
        {currentLabel}
        <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-[var(--radius-md)] shadow-lg z-20 py-1">
            {ranges.map((range) => (
              <button
                key={range.value}
                role="menuitem"
                onClick={() => {
                  setSelected(range.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition-colors",
                  selected === range.value
                    ? "bg-surface-hover text-text-primary font-medium"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
