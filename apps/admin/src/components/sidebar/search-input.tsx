"use client";

import { Search } from "lucide-react";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";

export function SearchInput() {
  const { locale } = useLocale();

  return (
    <div className="relative px-3">
      <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
      <input
        type="text"
        placeholder={t(locale, "common.search")}
        className="w-full h-9 pl-9 pr-3 text-sm bg-surface-hover border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
      />
    </div>
  );
}
