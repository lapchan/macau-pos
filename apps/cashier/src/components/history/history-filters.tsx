"use client";

import { useState } from "react";
import { Search, X, Clock, CheckCircle2, AlertCircle, RotateCcw, Ban, Banknote, CreditCard, QrCode, Calendar, ChevronDown, ChevronLeft, ChevronRight, CircleDashed } from "lucide-react";
import CloseButton from "@/components/shared/close-button";
import { cn } from "@/lib/cn";
import { type Locale, t } from "@/i18n/locales";

export type FilterState = {
  dateRange: "all" | "today" | "yesterday" | "last7days" | "thisShift" | "custom";
  status: string[];
  paymentMethod: string[];
  search: string;
  customFrom?: string;
  customTo?: string;
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
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [calStart, setCalStart] = useState<string | null>(null);
  const [calEnd, setCalEnd] = useState<string | null>(null);

  const dateChips: Chip[] = [
    ...(hasShift
      ? [{ key: "thisShift", label: t(locale, "filterThisShift"), icon: Clock, group: "date" as const, value: "thisShift" }]
      : []),
    { key: "today", label: t(locale, "filterToday"), group: "date", value: "today" },
    { key: "yesterday", label: t(locale, "filterYesterday"), group: "date", value: "yesterday" },
    { key: "last7days", label: t(locale, "filterLast7Days"), group: "date", value: "last7days" },
  ];

  const statusChips: Chip[] = [
    { key: "new", label: t(locale, "status_new"), icon: CircleDashed, group: "status", value: "new" },
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
              <CloseButton onClick={() => setShowSearch(false)} className="absolute top-3 right-3 z-10" />
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

      {/* Date range picker modal */}
      {showDateMenu && (() => {
        // Calendar helpers
        const year = calMonth.getFullYear();
        const month = calMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        const monthLabel = new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale === "pt" ? "pt-PT" : locale === "ja" ? "ja-JP" : "zh-TW", { month: "long", year: "numeric" }).format(calMonth);
        const dayLabels = locale === "ja" ? ["日","月","火","水","木","金","土"]
          : locale === "pt" ? ["D","S","T","Q","Q","S","S"]
          : locale === "en" ? ["S","M","T","W","T","F","S"]
          : ["日","一","二","三","四","五","六"];

        const handleDayClick = (day: number) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          if (!calStart || (calStart && calEnd)) {
            setCalStart(dateStr);
            setCalEnd(null);
          } else {
            if (dateStr < calStart) {
              setCalEnd(calStart);
              setCalStart(dateStr);
            } else {
              setCalEnd(dateStr);
            }
          }
        };

        const isInRange = (day: number) => {
          if (!calStart || !calEnd) return false;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return dateStr >= calStart && dateStr <= calEnd;
        };

        const isStart = (day: number) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return dateStr === calStart;
        };

        const isEnd = (day: number) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          return dateStr === calEnd;
        };

        const formatDisplay = (d: string) => {
          const [y, m, dd] = d.split("-");
          return `${y}/${m}/${dd}`;
        };

        return (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/40 animate-[fadeIn_0.2s_ease-out]"
              onClick={() => setShowDateMenu(false)}
            />
            <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-[4vh] px-4 animate-[spotlightOpen_0.25s_cubic-bezier(0.16,1,0.3,1)]">
              <div className="w-full max-w-[520px] bg-pos-surface rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
                  <h3 className="text-[17px] font-semibold text-pos-text">
                    <Calendar className="h-5 w-5 inline mr-2 text-pos-text-muted" />
                    {calStart && calEnd ? `${formatDisplay(calStart)} — ${formatDisplay(calEnd)}` : calStart ? formatDisplay(calStart) : t(locale, "filterAll")}
                  </h3>
                  <CloseButton onClick={() => setShowDateMenu(false)} />
                </div>

                {/* Quick presets */}
                <div className="px-6 pt-5 pb-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: t(locale, "filterAll"), value: "all" },
                      ...(hasShift ? [{ label: t(locale, "filterThisShift"), value: "thisShift" }] : []),
                      { label: t(locale, "filterToday"), value: "today" },
                      { label: t(locale, "filterYesterday"), value: "yesterday" },
                      { label: t(locale, "filterLast7Days"), value: "last7days" },
                    ].map((item) => (
                      <button
                        key={item.value}
                        onClick={() => {
                          setCalStart(null);
                          setCalEnd(null);
                          onChange({ ...filters, dateRange: item.value as FilterState["dateRange"] });
                          setShowDateMenu(false);
                        }}
                        className={cn(
                          "h-9 px-4 rounded-full text-[13px] font-medium border transition-all active:scale-[0.97]",
                          filters.dateRange === item.value && !calStart
                            ? "bg-pos-accent border-pos-accent text-white shadow-sm"
                            : "bg-pos-surface border-pos-border text-pos-text-secondary hover:border-pos-border-strong"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calendar */}
                <div className="px-6 pb-5">
                  {/* Month nav */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCalMonth(new Date(year, month - 1, 1))}
                      className="h-11 w-11 flex items-center justify-center rounded-full hover:bg-pos-surface-hover transition-colors text-pos-text-secondary"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-[16px] font-semibold text-pos-text">{monthLabel}</span>
                    <button
                      onClick={() => setCalMonth(new Date(year, month + 1, 1))}
                      className="h-11 w-11 flex items-center justify-center rounded-full hover:bg-pos-surface-hover transition-colors text-pos-text-secondary"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-2">
                    {dayLabels.map((d, i) => (
                      <div key={i} className="text-center text-[12px] font-medium text-pos-text-muted py-1">{d}</div>
                    ))}
                  </div>

                  {/* Day grid */}
                  <div className="grid grid-cols-7">
                    {/* Empty cells before first day */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-12" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const isSel = isStart(day) || isEnd(day);
                      const inRange = isInRange(day);
                      const isToday = dateStr === todayStr;
                      return (
                        <button
                          key={day}
                          onClick={() => handleDayClick(day)}
                          className={cn(
                            "h-12 flex items-center justify-center text-[15px] transition-colors relative",
                            isSel
                              ? "text-white font-semibold"
                              : inRange
                              ? "text-pos-text"
                              : "text-pos-text-secondary hover:text-pos-text"
                          )}
                        >
                          {/* Range background */}
                          {inRange && !isSel && (
                            <span className="absolute inset-0" style={{ backgroundColor: "color-mix(in srgb, var(--color-pos-accent) 12%, transparent)" }} />
                          )}
                          {/* Selected circle */}
                          {isSel && (
                            <span className="absolute h-10 w-10 rounded-full" style={{ backgroundColor: "var(--color-pos-accent)" }} />
                          )}
                          {/* Today ring */}
                          {isToday && !isSel && (
                            <span className="absolute h-10 w-10 rounded-full border-2 border-pos-accent/40" />
                          )}
                          <span className="relative z-[1]">{day}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Apply button */}
                {calStart && calEnd && (
                  <div className="px-6 pb-5">
                    <button
                      onClick={() => {
                        onChange({ ...filters, dateRange: "custom", customFrom: calStart!, customTo: calEnd! });
                        setShowDateMenu(false);
                      }}
                      className="w-full h-12 rounded-[var(--radius-md)] text-[15px] font-medium text-white transition-all active:scale-[0.98]"
                      style={{ backgroundColor: "var(--color-pos-accent)" }}
                    >
                      {t(locale, "confirm")} · {formatDisplay(calStart)} — {formatDisplay(calEnd)}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

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

        {/* Date range button → opens modal */}
        <button
          onClick={() => { setCalStart(null); setCalEnd(null); setCalMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); setShowDateMenu(true); }}
          className={cn(
            "shrink-0 h-8 flex items-center gap-1.5 px-3 rounded-full text-[12px] font-medium border transition-all duration-150",
            filters.dateRange !== "all"
              ? "bg-pos-accent border-pos-accent text-white shadow-sm"
              : "bg-pos-surface border-pos-border text-pos-text-secondary hover:border-pos-border-strong"
          )}
        >
          <Calendar className="h-3 w-3" />
          {filters.dateRange === "custom" && filters.customFrom && filters.customTo
            ? `${filters.customFrom.slice(5)} — ${filters.customTo.slice(5)}`
            : dateChips.find(c => c.value === filters.dateRange)?.label || t(locale, "filterAll")}
        </button>

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
