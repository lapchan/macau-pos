"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/cn";
import { type Locale, t, getProductName } from "@/i18n/locales";
import { fetchFilteredOrders, type OrderRow, type OrderItemRow } from "@/lib/history-actions";
import HistoryFilters, { type FilterState } from "./history-filters";
import PrintReceipt from "@/components/receipt/print-receipt";
import {
  X,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  Printer,
  Loader2,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  shiftId?: string | null;
  locale: Locale;
};

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `MOP ${num.toFixed(2)}`;
}

function formatDate(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : locale === "pt" ? "pt-PT" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: locale !== "ja",
  }).format(new Date(date));
}

const paymentIcon: Record<string, typeof CreditCard> = {
  cash: Banknote,
  tap: CreditCard,
  insert: CreditCard,
  qr: QrCode,
};

const paymentLabel: Record<string, string> = {
  cash: "Cash",
  tap: "Card",
  insert: "Card",
  qr: "QR Pay",
};

const statusColors: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  refunded: "bg-red-50 text-red-700 border-red-200",
  voided: "bg-gray-100 text-gray-500 border-gray-200",
};

const DEFAULT_FILTERS: FilterState = {
  dateRange: "all",
  status: [],
  paymentMethod: [],
  search: "",
};

export default function HistorySheet({ open, onClose, shiftId, locale }: Props) {
  const [closing, setClosing] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<Record<string, OrderItemRow[]>>({});
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchIdRef = useRef(0);

  // Fetch orders when filters change or sheet opens
  const fetchOrders = useCallback(async (f: FilterState) => {
    const id = ++fetchIdRef.current;
    setLoading(true);
    try {
      const result = await fetchFilteredOrders({
        ...f,
        shiftId: f.dateRange === "thisShift" ? shiftId : null,
      });
      // Only apply if this is still the latest request
      if (id === fetchIdRef.current) {
        setOrders(result.orders);
        setItems(result.items);
      }
    } catch {
      if (id === fetchIdRef.current) {
        setOrders([]);
        setItems({});
      }
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [shiftId]);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setExpandedId(null);
      setFilters(DEFAULT_FILTERS);
      fetchOrders(DEFAULT_FILTERS);
    }
  }, [open, fetchOrders]);

  // Re-fetch on filter change (debounced for search)
  useEffect(() => {
    if (!open) return;
    const delay = filters.search ? 300 : 0;
    const timer = setTimeout(() => fetchOrders(filters), delay);
    return () => clearTimeout(timer);
  }, [filters, open, fetchOrders]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !closing) handleClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, closing]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 250);
  }, [onClose]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-300",
          closing ? "opacity-0" : "animate-[fadeIn_0.3s_ease-out]"
        )}
        onClick={handleClose}
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex flex-col bg-pos-bg rounded-t-[var(--radius-xl)] shadow-2xl",
          closing
            ? "animate-[variantSlideDown_0.3s_cubic-bezier(0.4,0,1,1)_forwards]"
            : "animate-[variantSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]"
        )}
        style={{ height: "92vh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full bg-pos-border-strong/50" />
        </div>

        {/* Header */}
        <div className="shrink-0 px-4 pb-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-[var(--radius-md)] bg-pos-accent/10 flex items-center justify-center">
            <Receipt className="h-[18px] w-[18px] text-pos-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[16px] font-semibold text-pos-text">
              {t(locale, "orderHistory")}
            </h2>
            <p className="text-[12px] text-pos-text-muted">
              {loading ? t(locale, "loadingOrders") : `${orders.length} ${t(locale, "historyOrders")}`}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-sm)] text-pos-text-muted hover:bg-pos-surface-hover hover:text-pos-text-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="shrink-0 pb-3 border-b border-pos-border">
          <HistoryFilters
            filters={filters}
            onChange={setFilters}
            locale={locale}
            hasShift={!!shiftId}
          />
        </div>

        {/* Order list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-pos-accent animate-spin" />
              <p className="text-[13px] text-pos-text-muted mt-3">
                {t(locale, "loadingOrders")}
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-[var(--radius-lg)] bg-pos-surface flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-pos-text-muted/40" />
              </div>
              <p className="text-[15px] font-medium text-pos-text-muted">
                {filters.dateRange !== "all" || filters.status.length > 0 || filters.paymentMethod.length > 0 || filters.search
                  ? t(locale, "noMatchingOrders")
                  : t(locale, "noOrdersYet")}
              </p>
              <p className="text-[13px] text-pos-text-muted/60 mt-1">
                {filters.dateRange !== "all" || filters.status.length > 0 || filters.paymentMethod.length > 0 || filters.search
                  ? t(locale, "tryAdjustFilters")
                  : t(locale, "ordersWillAppear")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => {
                const isExpanded = expandedId === order.id;
                const PayIcon = order.paymentMethod
                  ? paymentIcon[order.paymentMethod] ?? CreditCard
                  : CreditCard;
                const payLabel = order.paymentMethod
                  ? paymentLabel[order.paymentMethod] ?? order.paymentMethod
                  : "Unknown";
                const statusClass = statusColors[order.status] ?? statusColors.completed;

                return (
                  <div
                    key={order.id}
                    className={cn(
                      "bg-pos-surface rounded-[var(--radius-md)] border transition-all duration-200",
                      isExpanded
                        ? "border-pos-accent/30 shadow-sm"
                        : "border-pos-border hover:border-pos-border-strong"
                    )}
                  >
                    {/* Order summary row */}
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-full text-left px-3.5 py-3 flex items-center gap-3"
                    >
                      {/* Order icon */}
                      <div
                        className={cn(
                          "h-10 w-10 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0",
                          isExpanded ? "bg-pos-accent/10" : "bg-pos-surface-active"
                        )}
                      >
                        <Receipt
                          className={cn(
                            "h-[18px] w-[18px]",
                            isExpanded ? "text-pos-accent" : "text-pos-text-muted"
                          )}
                        />
                      </div>

                      {/* Order info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-pos-text truncate">
                            {order.orderNumber}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border capitalize",
                              statusClass
                            )}
                          >
                            {t(locale, `status_${order.status}` as any)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock className="h-3 w-3 text-pos-text-muted/50" />
                          <span className="text-[12px] text-pos-text-muted">
                            {formatDate(order.createdAt, locale)}
                          </span>
                          <span className="text-[12px] text-pos-text-muted/40">·</span>
                          <span className="text-[12px] text-pos-text-muted">
                            {order.itemCount}{" "}
                            {order.itemCount !== 1 ? t(locale, "historyItems") : t(locale, "historyItem")}
                          </span>
                        </div>
                      </div>

                      {/* Price + payment + chevron */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="text-right">
                          <div className="text-[14px] font-semibold text-pos-text">
                            {formatCurrency(order.total)}
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                            <PayIcon className="h-3 w-3 text-pos-text-muted" />
                            <span className="text-[11px] text-pos-text-muted">{payLabel}</span>
                          </div>
                        </div>
                        <div className="text-pos-text-muted/50">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-0 animate-[fadeSlideUp_0.15s_ease-out]">
                        <div className="border-t border-pos-border/60 pt-3">
                          {/* Line items */}
                          {items[order.id] && items[order.id].length > 0 && (
                            <div className="space-y-1.5 mb-3">
                              {items[order.id].map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-[13px]">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-pos-text font-medium truncate block">
                                      {getProductName(
                                        { name: item.name, translations: item.translations },
                                        locale
                                      )}
                                    </span>
                                    <span className="text-[11px] text-pos-text-muted">
                                      {item.quantity} x {formatCurrency(item.unitPrice)}
                                    </span>
                                  </div>
                                  <span className="text-pos-text-secondary font-medium tabular-nums shrink-0 ml-3">
                                    {formatCurrency(item.lineTotal)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[13px]">
                              <span className="text-pos-text-muted">{t(locale, "subtotal")}</span>
                              <span className="text-pos-text-secondary font-medium">
                                {formatCurrency(order.subtotal)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[13px]">
                              <span className="text-pos-text-muted">{t(locale, "historyPayment")}</span>
                              <span className="flex items-center gap-1.5 text-pos-text-secondary font-medium">
                                <PayIcon className="h-3.5 w-3.5 text-pos-text-muted" />
                                {payLabel}
                              </span>
                            </div>
                            <div className="border-t border-dashed border-pos-border/60 pt-2 mt-2 flex items-center justify-between text-[14px]">
                              <span className="font-semibold text-pos-text-secondary">
                                {t(locale, "total")}
                              </span>
                              <span className="font-bold text-pos-text">
                                {formatCurrency(order.total)}
                              </span>
                            </div>
                          </div>

                          {/* Time + Print button */}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[11px] text-pos-text-muted/50">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(order.createdAt, locale)}</span>
                            </div>
                            <PrintReceipt orderNumber={order.orderNumber}>
                              {({ onPrint, isPrinting }) => (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onPrint();
                                  }}
                                  disabled={isPrinting}
                                  className="flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-sm)] text-[12px] font-medium text-pos-text-secondary border border-pos-border hover:bg-pos-surface-hover hover:text-pos-text transition-colors active:scale-[0.97] disabled:opacity-50"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                  {isPrinting ? t(locale, "receiptPrinting") : t(locale, "receiptReprint")}
                                </button>
                              )}
                            </PrintReceipt>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
