"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/cn";
import { type Locale, t, getProductName } from "@/i18n/locales";
import { fetchFilteredOrders, voidOrRefundOrder, type OrderRow, type OrderItemRow } from "@/lib/history-actions";
import HistoryFilters, { type FilterState } from "./history-filters";
import PrintReceipt from "@/components/receipt/print-receipt";
import VoidRefundDialog from "./void-refund-dialog";
import { PAYMENT_METHOD_KEYS, PAYMENT_METHOD_ICONS, STATUS_COLORS } from "@/lib/constants";
import {
  X,
  Receipt,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  Printer,
  Loader2,
  Ban,
  RotateCcw,
} from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  shiftId?: string | null;
  locale: Locale;
  embedded?: boolean;
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

const DEFAULT_FILTERS: FilterState = {
  dateRange: "all",
  status: [],
  paymentMethod: [],
  search: "",
};

export default function HistorySheet({ open, onClose, shiftId, locale, embedded = false }: Props) {
  const [closing, setClosing] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [items, setItems] = useState<Record<string, OrderItemRow[]>>({});
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [dialogState, setDialogState] = useState<{ open: boolean; action: "void" | "refund"; order: OrderRow | null }>({ open: false, action: "void", order: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [closingDetail, setClosingDetail] = useState(false);
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

  const handleVoidRefund = async () => {
    if (!dialogState.order) return;
    setIsProcessing(true);
    const result = await voidOrRefundOrder(dialogState.order.id, dialogState.action);
    setIsProcessing(false);
    if (result.success) {
      setDialogState({ open: false, action: "void", order: null });
      fetchOrders(filters);
    }
  };

  const renderOrderList = () => (
    <>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-pos-accent animate-spin" />
          <p className="text-[13px] text-pos-text-muted mt-3">{t(locale, "loadingOrders")}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-[var(--radius-lg)] bg-pos-surface flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-pos-text-muted/40" />
          </div>
          <p className="text-[15px] font-medium text-pos-text-muted">
            {filters.dateRange !== "all" || filters.status.length > 0 || filters.paymentMethod.length > 0 || filters.search
              ? t(locale, "noMatchingOrders") : t(locale, "noOrdersYet")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const PayIcon = order.paymentMethod ? PAYMENT_METHOD_ICONS[order.paymentMethod] || CreditCard : CreditCard;
            const payLabel = order.paymentMethod ? PAYMENT_METHOD_KEYS[order.paymentMethod] ? t(locale, PAYMENT_METHOD_KEYS[order.paymentMethod] as any) : t(locale, "paymentUnknown") : t(locale, "paymentUnknown");
            const statusClass = STATUS_COLORS[order.status] ?? STATUS_COLORS.completed;
            return (
              <div key={order.id} className={cn("bg-pos-surface rounded-[var(--radius-md)] border transition-all duration-200", isExpanded ? "border-pos-accent/30 shadow-sm" : "border-pos-border hover:border-pos-border-strong")}>
                <button onClick={() => embedded ? setSelectedOrder(order) : toggleExpand(order.id)} className="w-full text-left px-3.5 py-3 flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0", isExpanded ? "bg-pos-accent/10" : "bg-pos-surface-active")}>
                    <Receipt className={cn("h-[18px] w-[18px]", isExpanded ? "text-pos-accent" : "text-pos-text-muted")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-pos-text truncate">{order.orderNumber}</span>
                      <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border capitalize", statusClass)}>
                        {t(locale, `status_${order.status}` as any)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="h-3 w-3 text-pos-text-muted/50" />
                      <span className="text-[12px] text-pos-text-muted">{formatDate(order.createdAt, locale)}</span>
                      <span className="text-[12px] text-pos-text-muted/40">·</span>
                      <span className="text-[12px] text-pos-text-muted">{order.itemCount} {order.itemCount !== 1 ? t(locale, "historyItems") : t(locale, "historyItem")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="text-[14px] font-semibold text-pos-text">{formatCurrency(order.total)}</div>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <PayIcon className="h-3 w-3 text-pos-text-muted" />
                        <span className="text-[11px] text-pos-text-muted">{payLabel}</span>
                      </div>
                    </div>
                    {!embedded && (
                      <div className="text-pos-text-muted/50">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    )}
                  </div>
                </button>
                {isExpanded && !embedded && (
                  <div className="px-3.5 pb-3.5 pt-0 animate-[fadeSlideUp_0.15s_ease-out]">
                    <div className="border-t border-pos-border/60 pt-3">
                      {items[order.id] && items[order.id].length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          {items[order.id].map((item) => {
                            const iDisc = parseFloat(item.discountAmount);
                            return (
                              <div key={item.id}>
                                <div className="flex items-center justify-between text-[13px]">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-pos-text font-medium truncate block">{getProductName({ name: item.name, translations: item.translations }, locale)}</span>
                                    <span className="text-[11px] text-pos-text-muted">{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                                  </div>
                                  <span className={cn("font-medium tabular-nums shrink-0 ml-3", iDisc > 0 ? "text-pos-danger" : "text-pos-text-secondary")}>{formatCurrency(item.lineTotal)}</span>
                                </div>
                                {iDisc > 0 && <p className="text-[10px] text-pos-danger">{item.discountNote || t(locale, "receiptDiscount")} (-{formatCurrency(item.discountAmount)})</p>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-pos-text-muted">{t(locale, "subtotal")}</span>
                          <span className="text-pos-text-secondary font-medium">{formatCurrency(order.subtotal)}</span>
                        </div>
                        {parseFloat(order.discountAmount) > 0 && (
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="text-pos-danger">{order.notes || t(locale, "discount")}</span>
                            <span className="text-pos-danger font-medium">-{formatCurrency(order.discountAmount)}</span>
                          </div>
                        )}
                        {parseFloat(order.taxAmount) > 0 && (
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="text-pos-text-muted">{t(locale, "tax")}</span>
                            <span className="text-pos-text-secondary font-medium">{formatCurrency(order.taxAmount)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-pos-text-muted">{t(locale, "historyPayment")}</span>
                          <span className="flex items-center gap-1.5 text-pos-text-secondary font-medium"><PayIcon className="h-3.5 w-3.5 text-pos-text-muted" />{payLabel}</span>
                        </div>
                        <div className="border-t border-dashed border-pos-border/60 pt-2 mt-2 flex items-center justify-between text-[14px]">
                          <span className="font-semibold text-pos-text-secondary">{t(locale, "total")}</span>
                          <span className="font-bold text-pos-text">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-pos-text-muted/50">
                          <Clock className="h-3 w-3" /><span>{formatDate(order.createdAt, locale)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {order.status === "completed" && (
                            <>
                              <button onClick={(e) => { e.stopPropagation(); setDialogState({ open: true, action: "void", order }); }} className="flex items-center gap-1 h-8 px-3 rounded-[var(--radius-sm)] text-[12px] font-medium text-pos-text-muted border border-pos-border hover:border-pos-danger/30 hover:text-pos-danger hover:bg-pos-danger-light transition-colors active:scale-[0.97]">
                                <Ban className="h-3.5 w-3.5" />{t(locale, "voidOrder")}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setDialogState({ open: true, action: "refund", order }); }} className="flex items-center gap-1 h-8 px-3 rounded-[var(--radius-sm)] text-[12px] font-medium text-pos-text-muted border border-pos-border hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-colors active:scale-[0.97]">
                                <RotateCcw className="h-3.5 w-3.5" />{t(locale, "refundOrder")}
                              </button>
                            </>
                          )}
                          <PrintReceipt orderNumber={order.orderNumber} locale={locale}>
                            {({ onPrint, isPrinting }) => (
                              <button onClick={(e) => { e.stopPropagation(); onPrint(); }} disabled={isPrinting} className="flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-sm)] text-[12px] font-medium text-pos-text-secondary border border-pos-border hover:bg-pos-surface-hover hover:text-pos-text transition-colors active:scale-[0.97] disabled:opacity-50">
                                <Printer className="h-3.5 w-3.5" />{isPrinting ? t(locale, "receiptPrinting") : t(locale, "receiptReprint")}
                              </button>
                            )}
                          </PrintReceipt>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  if (!open) return null;

  // Summary stats
  const completedOrders = orders.filter(o => o.status === "completed");
  const totalSales = completedOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const avgOrder = completedOrders.length > 0 ? totalSales / completedOrders.length : 0;
  const refundedCount = orders.filter(o => o.status === "refunded" || o.status === "voided").length;

  if (embedded) {
    return (
      <div className="flex flex-col h-full bg-pos-bg">
        {/* Header */}
        <div className="shrink-0 px-5 py-4 flex items-center gap-3 border-b border-pos-border">
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
        </div>

        {/* Filters */}
        <div className="shrink-0 py-3 border-b border-pos-border">
          <HistoryFilters filters={filters} onChange={setFilters} locale={locale} hasShift={!!shiftId} />
        </div>

        {/* Summary cards */}
        {!loading && orders.length > 0 && (
          <div className="shrink-0 px-4 pt-3">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-pos-surface rounded-[var(--radius-md)] border border-pos-border px-3 py-2.5">
                <p className="text-[10px] text-pos-text-muted uppercase tracking-wider">{t(locale, "historyOrders")}</p>
                <p className="text-[18px] font-bold text-pos-text tabular-nums mt-0.5">{orders.length}</p>
              </div>
              <div className="bg-pos-surface rounded-[var(--radius-md)] border border-pos-border px-3 py-2.5">
                <p className="text-[10px] text-pos-text-muted uppercase tracking-wider">{t(locale, "totalSales")}</p>
                <p className="text-[18px] font-bold tabular-nums mt-0.5" style={{ color: "var(--color-pos-accent)" }}>MOP {totalSales.toFixed(0)}</p>
              </div>
              <div className="bg-pos-surface rounded-[var(--radius-md)] border border-pos-border px-3 py-2.5">
                <p className="text-[10px] text-pos-text-muted uppercase tracking-wider">{t(locale, "avgOrder")}</p>
                <p className="text-[18px] font-bold text-pos-text tabular-nums mt-0.5">MOP {avgOrder.toFixed(0)}</p>
              </div>
              <div className="bg-pos-surface rounded-[var(--radius-md)] border border-pos-border px-3 py-2.5">
                <p className="text-[10px] text-pos-text-muted uppercase tracking-wider">{t(locale, "refunds")}</p>
                <p className={cn("text-[18px] font-bold tabular-nums mt-0.5", refundedCount > 0 ? "text-pos-danger" : "text-pos-text")}>{refundedCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order list */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
          {renderOrderList()}
        </div>

        {/* Order detail bottom-up sheet */}
        {selectedOrder && (() => {
          const order = selectedOrder;
          const PayIcon = order.paymentMethod ? PAYMENT_METHOD_ICONS[order.paymentMethod] || CreditCard : CreditCard;
          const payLabel = order.paymentMethod ? PAYMENT_METHOD_KEYS[order.paymentMethod] ? t(locale, PAYMENT_METHOD_KEYS[order.paymentMethod] as any) : t(locale, "paymentUnknown") : t(locale, "paymentUnknown");
          const statusClass = STATUS_COLORS[order.status] ?? STATUS_COLORS.completed;
          const orderItems = items[order.id] || [];

          const handleCloseDetail = () => {
            setClosingDetail(true);
            setTimeout(() => { setSelectedOrder(null); setClosingDetail(false); }, 250);
          };

          return (
            <>
              <div
                className={cn("fixed inset-0 z-50 bg-black/40 transition-opacity duration-300", closingDetail ? "opacity-0" : "animate-[fadeIn_0.3s_ease-out]")}
                onClick={handleCloseDetail}
              />
              <div
                className={cn(
                  "fixed inset-x-0 bottom-0 z-50 flex flex-col bg-pos-bg rounded-t-[var(--radius-xl)] shadow-2xl",
                  closingDetail ? "animate-[variantSlideDown_0.3s_cubic-bezier(0.4,0,1,1)_forwards]" : "animate-[variantSlideUp_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]"
                )}
                style={{ height: "85vh" }}
              >
                {/* Drag handle */}
                <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                  <div className="w-9 h-1 rounded-full bg-pos-border-strong/50" />
                </div>

                {/* Header */}
                <div className="shrink-0 px-5 pb-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[18px] font-semibold text-pos-text">{order.orderNumber}</h2>
                      <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize", statusClass)}>
                        {t(locale, `status_${order.status}` as any)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[13px] text-pos-text-muted">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(order.createdAt, locale)}</span>
                      <span>·</span>
                      <span>{order.itemCount} {order.itemCount !== 1 ? t(locale, "historyItems") : t(locale, "historyItem")}</span>
                      <span>·</span>
                      <PayIcon className="h-3.5 w-3.5" />
                      <span>{payLabel}</span>
                    </div>
                  </div>
                  <button onClick={handleCloseDetail} className="h-10 w-10 rounded-full bg-black/8 flex items-center justify-center text-pos-text-muted hover:bg-black/15 transition-colors">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 pb-5">
                  {/* Line items */}
                  <div className="space-y-3 mb-5">
                    {orderItems.map((item) => {
                      const itemDiscount = parseFloat(item.discountAmount);
                      return (
                        <div key={item.id}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-medium text-pos-text">{getProductName({ name: item.name, translations: item.translations }, locale)}</p>
                              <p className="text-[12px] text-pos-text-muted">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                            </div>
                            <span className={cn("text-[14px] font-semibold tabular-nums shrink-0 ml-3", itemDiscount > 0 ? "text-pos-danger" : "text-pos-text")}>{formatCurrency(item.lineTotal)}</span>
                          </div>
                          {itemDiscount > 0 && (
                            <p className="text-[11px] text-pos-danger mt-0.5">
                              {item.discountNote || t(locale, "discount")} (-{formatCurrency(item.discountAmount)})
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-pos-border pt-4 space-y-2">
                    <div className="flex items-center justify-between text-[14px]">
                      <span className="text-pos-text-muted">{t(locale, "subtotal")}</span>
                      <span className="text-pos-text font-medium tabular-nums">{formatCurrency(order.subtotal)}</span>
                    </div>
                    {parseFloat(order.discountAmount) > 0 && (
                      <div className="flex items-center justify-between text-[14px]">
                        <span className="text-pos-danger">{order.notes || t(locale, "discount")}</span>
                        <span className="text-pos-danger font-medium tabular-nums">-{formatCurrency(order.discountAmount)}</span>
                      </div>
                    )}
                    {parseFloat(order.taxAmount) > 0 && (
                      <div className="flex items-center justify-between text-[14px]">
                        <span className="text-pos-text-muted">{t(locale, "tax")}</span>
                        <span className="text-pos-text font-medium tabular-nums">{formatCurrency(order.taxAmount)}</span>
                      </div>
                    )}
                    <div className="border-t border-dashed border-pos-border pt-3 flex items-center justify-between">
                      <span className="text-[16px] font-semibold text-pos-text">{t(locale, "total")}</span>
                      <span className="text-[22px] font-bold tabular-nums" style={{ color: "var(--color-pos-accent)" }}>{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex items-center gap-2">
                    {order.status === "completed" && (
                      <>
                        <button
                          onClick={() => { handleCloseDetail(); setTimeout(() => setDialogState({ open: true, action: "void", order }), 300); }}
                          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-[14px] font-medium text-pos-text-secondary border border-pos-border hover:border-pos-danger/30 hover:text-pos-danger hover:bg-pos-danger-light transition-colors"
                        >
                          <Ban className="h-4 w-4" />{t(locale, "voidOrder")}
                        </button>
                        <button
                          onClick={() => { handleCloseDetail(); setTimeout(() => setDialogState({ open: true, action: "refund", order }), 300); }}
                          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-[14px] font-medium text-pos-text-secondary border border-pos-border hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />{t(locale, "refundOrder")}
                        </button>
                      </>
                    )}
                    <PrintReceipt orderNumber={order.orderNumber} locale={locale}>
                      {({ onPrint, isPrinting }) => (
                        <button
                          onClick={onPrint}
                          disabled={isPrinting}
                          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-[14px] font-medium text-white transition-colors disabled:opacity-50"
                          style={{ backgroundColor: "var(--color-pos-accent)" }}
                        >
                          <Printer className="h-4 w-4" />{isPrinting ? t(locale, "receiptPrinting") : t(locale, "receiptReprint")}
                        </button>
                      )}
                    </PrintReceipt>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        <VoidRefundDialog
          open={dialogState.open}
          onClose={() => setDialogState(s => ({ ...s, open: false }))}
          onConfirm={handleVoidRefund}
          action={dialogState.action}
          orderNumber={dialogState.order?.orderNumber ?? ""}
          total={dialogState.order?.total ?? "0"}
          paymentMethod={dialogState.order?.paymentMethod ?? null}
          isProcessing={isProcessing}
          locale={locale}
        />
      </div>
    );
  }

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
        style={{ height: "85vh" }}
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
            className="h-10 w-10 rounded-full bg-black/8 flex items-center justify-center text-pos-text-muted hover:bg-black/15 transition-colors"
          >
            <X className="h-4.5 w-4.5" />
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
          {renderOrderList()}
        </div>
      </div>

      {/* Void/Refund confirmation dialog */}
      <VoidRefundDialog
        open={dialogState.open}
        onClose={() => setDialogState(s => ({ ...s, open: false }))}
        onConfirm={handleVoidRefund}
        action={dialogState.action}
        orderNumber={dialogState.order?.orderNumber ?? ""}
        total={dialogState.order?.total ?? "0"}
        paymentMethod={dialogState.order?.paymentMethod ?? null}
        isProcessing={isProcessing}
        locale={locale}
      />
    </>
  );
}
