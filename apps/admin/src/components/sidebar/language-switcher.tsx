"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { useLocale } from "@/i18n/context";
import type { Locale } from "@macau-pos/i18n";
import { localeNames } from "@macau-pos/i18n";
import { Flag } from "@/components/shared/flags";

const locales: Locale[] = ["tc", "sc", "en", "pt", "ja"];

interface LanguageSwitcherProps {
  collapsed: boolean;
}

export function LanguageSwitcher({ collapsed }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

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
        className={cn(
          "flex items-center rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors",
          collapsed
            ? "w-full justify-center p-2"
            : "w-full gap-2 px-2 py-1.5 text-xs"
        )}
      >
        <Flag code={locale} />
        {!collapsed && (
          <span className="truncate">{localeNames[locale]}</span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className={cn(
              "absolute z-50 w-40 bg-surface border border-border rounded-[var(--radius-md)] shadow-lg py-1",
              collapsed ? "left-full ml-2 bottom-0" : "bottom-full mb-1 left-0"
            )}
          >
            {locales.map((l) => (
              <button
                key={l}
                role="menuitem"
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 transition-colors",
                  locale === l
                    ? "bg-surface-hover text-text-primary font-medium"
                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                )}
              >
                <Flag code={l} />
                <span>{localeNames[l]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
