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
    <div className="space-y-2.5">
      {/* Search bar */}
      {showSearch && (
        <div className="px-4 animate-[fadeSlideUp_0.2s_ease-out]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pos-text-muted" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t(locale, "searchOrderNumber")}
              autoFocus
              className="w-full h-10 pl-10 pr-10 rounded-[var(--radius-md)] bg-pos-surface border border-pos-border text-[13px] text-pos-text placeholder:text-pos-text-muted focus:outline-none focus:border-pos-accent focus:ring-1 focus:ring-pos-accent/30 transition-colors"
            />
            {filters.search && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-pos-border-strong/40 text-pos-text-muted hover:bg-pos-border-strong/60 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Horizontal scroll chips */}
      <div className="flex items-center gap-1.5 px-4 overflow-x-auto hide-scrollbar">
        {/* Search toggle */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={cn(
            "shrink-0 h-8 w-8 flex items-center justify-center rounded-full border transition-all duration-150",
            showSearch || filters.search
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
