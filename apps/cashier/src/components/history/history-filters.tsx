"use client";

import { useState } from "react";
import { Search, X, Clock, CheckCircle2, AlertCircle, RotateCcw, Ban, Banknote, CreditCard, QrCode } from "lucide-react";
import { cn } from "@/lib/cn";
import { type Locale, t } from "@/i18n/locales";

export type FilterState = {
  dateRange: "all" | "today" | "yesterday" | "last7days" | "thisShift";
  status: string[];
  paymentMethod: string[];
  search: string;
};

type Props = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  locale: Locale;
  hasShift: boolean;
};

type Chip = {
  key: string;
  label: string;
  icon?: typeof Clock;
  group: "date" | "status" | "payment";
  value: string;
};

export default function HistoryFilters({ filters, onChange, locale, hasShift }: Props) {
  const [showSearch, setShowSearch] = useState(false);

  const dateChips: Chip[] = [
    ...(hasShift
      ? [{ key: "thisShift", label: t(locale, "filterThisShift"), icon: Clock, group: "date" as const, value: "thisShift" }]
      : []),
    { key: "today", label: t(locale, "filterToday"), group: "date", value: "today" },
    { key: "yesterday", label: t(locale, "filterYesterday"), group: "date", value: "yesterday" },
    { key: "last7days", label: t(locale, "filterLast7Days"), group: "date", value: "last7days" },
  ];

  const statusChips: Chip[] = [
    { key: "completed", label: t(locale, "status_completed"), icon: CheckCircle2, group: "status", value: "completed" },
    { key: "pending", label: t(locale, "status_pending"), icon: AlertCircle, group: "status", value: "pending" },
    { key: "refunded", label: t(locale, "status_refunded"), icon: RotateCcw, group: "status", value: "refunded" },
    { key: "voided", label: t(locale, "status_voided"), icon: Ban, group: "status", value: "voided" },
  ];

  const paymentChips: Chip[] = [
    { key: "cash", label: t(locale, "cash"), icon: Banknote, group: "payment", value: "cash" },
    { key: "card", label: t(locale, "card"), icon: CreditCard, group: "payment", value: "tap" },
    { key: "qr", label: t(locale, "qrPay"), icon: QrCode, group: "payment", value: "qr" },
  ];

  const handleDateChip = (value: string) => {
    onChange({
      ...filters,
      dateRange: filters.dateRange === value ? "all" : (value as FilterState["dateRange"]),
    });
  };

  const handleToggleArray = (group: "status" | "paymentMethod", value: string) => {
    const arr = filters[group];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    onChange({ ...filters, [group]: next });
  };

  const handleSearch = (value: string) => {
    onChange({ ...filters, search: value });
  };

  const hasActiveFilters =
    filters.dateRange !== "all" ||
    filters.status.length > 0 ||
    filters.paymentMethod.length > 0 ||
    filters.search.trim() !== "";

  return (
    <div>
      {/* Spotlight search overlay */}
      {showSearch && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 animate-[fadeIn_0.2s_ease-out]"
            onClick={() => setShowSearch(false)}
          />
          <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-[8vh] px-4 animate-[spotlightOpen_0.25s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="w-full max-w-xl bg-pos-surface rounded-2xl shadow-2xl overflow-hidden relative">
              <button
                onClick={() => setShowSearch(false)}
                className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center rounded-full bg-pos-text-muted/15 text-pos-text-secondary hover:bg-pos-text-muted/25 hover:text-pos-text transition-colors z-10"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
              <div className="flex items-center px-4">
                <Search className="h-5 w-5 text-pos-text-muted shrink-0 ml-1" />
                <input
                  type="text"
                  autoFocus
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowSearch(false);
                  }}
                  placeholder={t(locale, "searchOrderNumber")}
                  style={{ outline: "none" }}
                  className="flex-1 h-14 pl-3 pr-12 text-[18px] bg-transparent text-pos-text placeholder:text-pos-text-muted"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Horizontal scroll chips */}
      <div className="flex items-center gap-1.5 px-4 overflow-x-auto hide-scrollbar">
        {/* Search toggle */}
        <button
          onClick={() => setShowSearch(true)}
          className={cn(
            "shrink-0 h-8 w-8 flex items-center justify-center rounded-full border transition-all duration-150",
            filters.search
              ? "bg-pos-accent border-pos-accent text-white"
              : "bg-pos-surface border-pos-border text-pos-text-secondary hover:border-pos-border-strong"
          )}
        >
          <Search className="h-3.5 w-3.5" />
        </button>

        {/* Divider */}
        <div className="shrink-0 w-px h-5 bg-pos-border" />

        {/* Date chips */}
        {dateChips.map((chip) => {
          const active = filters.dateRange === chip.value;
          const Icon = chip.icon;
          return (
            <button
              key={chip.key}
              onClick={() => handleDateChip(chip.value)}
              className={cn(
                "shrink-0 h-8 flex items-center gap-1.5 px-3 rounded-full text-[12px] font-medium border transition-all duration-150 active:scale-[0.97]",
                active
                  ? "bg-pos-accent border-pos-accent text-white shadow-sm"
                  : "bg-pos-surface border-pos-border text-pos-text-secondary hover:border-pos-border-strong"
              )}
            >
              {Icon && <Icon className="h-3 w-3" />}
              {chip.label}
            </button>
          );
        })}

        {/* Divider */}
        <div className="shrink-0 w-px h-5 bg-pos-border" />

        {/* Status chips */}
        {statusChips.map((chip) => {
          const active = filters.status.includes(chip.value);
          const Icon = chip.icon!;
          return (
            <button
              key={chip.key}
              onClick={() => handleToggleArray("status", chip.value)}
              className={cn(
                "shrink-0 h-8 flex items-center gap-1.5 px-3 rounded-full text-[12px] font-medium border transition-all duration-150 active:scale-[0.97]",
                active
                  ? "bg-pos-accent border-pos-accent text-white shadow-sm"
                  : "bg-pos-surface border-pos-border text-pos-text-secondary hover:border-pos-border-strong"
              )}
            >
              <Icon className="h-3 w-3" />
              {chip.label}
            </button>
          );
        })}

        {/* Divider */}
        <div className="shrink-0 w-px h-5 bg-pos-border" />

        {/* Payment chips */}
        {paymentChips.map((chip) => {
          const active = filters.paymentMethod.includes(chip.value);
          const Icon = chip.icon!;
          return (
            <button
              key={chip.key}
              onClick={() => handleToggleArray("paymentMethod", chip.value)}
              className={cn(
                "shrink-0 h-8 flex items-center gap-1.5 px-3 rounded-full text-[12px] font-medium border transition-all duration-150 active:scale-[0.97]",
                active
                  ? "bg-pos-accent border-pos-accent text-white shadow-sm"
                  : "bg-pos-surface border-pos-border text-pos-text-secondary hover:border-pos-border-strong"
              )}
            >
              <Icon className="h-3 w-3" />
              {chip.label}
            </button>
          );
        })}

        {/* Clear all */}
        {hasActiveFilters && (
          <>
            <div className="shrink-0 w-px h-5 bg-pos-border" />
            <button
              onClick={() =>
                onChange({ dateRange: "all", status: [], paymentMethod: [], search: "" })
              }
              className="shrink-0 h-8 flex items-center gap-1 px-3 rounded-full text-[12px] font-medium border border-pos-danger/30 text-pos-danger bg-pos-danger-light hover:bg-pos-danger/10 transition-all duration-150 active:scale-[0.97]"
            >
              <X className="h-3 w-3" />
              {t(locale, "filterClear")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
