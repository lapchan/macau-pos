"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { Calendar, ChevronDown } from "lucide-react";

const ranges = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 14 days", value: "14d" },
  { label: "Last 30 days", value: "30d" },
  { label: "This month", value: "month" },
];

export function DateRangeSelector() {
  const [selected, setSelected] = useState("14d");
  const [open, setOpen] = useState(false);

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
        aria-label="Select date range"
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
