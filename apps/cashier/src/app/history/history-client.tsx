"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { type Locale, t } from "@/i18n/locales";
import PrintReceipt from "@/components/receipt/print-receipt";
import {
  ArrowLeft,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  Printer,
} from "lucide-react";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: string;
  total: string;
  itemCount: number;
  currency: string;
  createdAt: Date;
  paymentMethod: string | null;
};

type OrderItemRow = {
  id: string;
  orderId: string;
  name: string;
  nameCn: string | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
};

type Props = {
  orders: OrderRow[];
  orderItems: Record<string, OrderItemRow[]>;
  locale: Locale;
  shiftId?: string | null;
};

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `MOP ${num.toFixed(2)}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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

export default function HistoryClient({ orders, orderItems, locale, shiftId }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="h-[18px] w-[18px] text-gray-600" />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-[11px] text-white">
              CS
            </div>
            <h1 className="text-[15px] font-semibold text-gray-900">
              {t(locale, "orderHistory")}
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {shiftId ? (
              <Link
                href="/history"
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                <Clock className="h-3 w-3" />
                {t(locale, "currentShift") || "Current shift"}
                <span className="text-indigo-400">×</span>
              </Link>
            ) : (
              <Link
                href={`/history?shiftId=current`}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <Clock className="h-3 w-3" />
                {t(locale, "currentShift") || "Current shift"}
              </Link>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Receipt className="h-3.5 w-3.5" />
              {orders.length} {t(locale, "historyOrders")}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-5">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-[15px] font-medium text-gray-400">
              {t(locale, "noOrdersYet")}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              {t(locale, "ordersWillAppear")}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {orders.map((order) => {
              const isExpanded = expandedId === order.id;
              const PayIcon = order.paymentMethod
                ? paymentIcon[order.paymentMethod] ?? CreditCard
                : CreditCard;
              const payLabel = order.paymentMethod
                ? paymentLabel[order.paymentMethod] ?? order.paymentMethod
                : "Unknown";
              const statusClass =
                statusColors[order.status] ?? statusColors.completed;

              return (
                <div
                  key={order.id}
                  className={cn(
                    "bg-white rounded-2xl border transition-all duration-200",
                    isExpanded
                      ? "border-indigo-200 shadow-sm"
                      : "border-gray-200/80 hover:border-gray-300"
                  )}
                >
                  {/* Order summary row */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full text-left px-4 py-3.5 flex items-center gap-3"
                  >
                    {/* Order icon */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                        isExpanded
                          ? "bg-indigo-50"
                          : "bg-gray-50"
                      )}
                    >
                      <Receipt
                        className={cn(
                          "h-[18px] w-[18px]",
                          isExpanded
                            ? "text-indigo-500"
                            : "text-gray-400"
                        )}
                      />
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-gray-900 truncate">
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
                        <Clock className="h-3 w-3 text-gray-300" />
                        <span className="text-[12px] text-gray-400">
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="text-[12px] text-gray-300">
                          ·
                        </span>
                        <span className="text-[12px] text-gray-400">
                          {order.itemCount} {order.itemCount !== 1 ? t(locale, "historyItems") : t(locale, "historyItem")}
                        </span>
                      </div>
                    </div>

                    {/* Price + payment + chevron */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="text-[14px] font-semibold text-gray-900">
                          {formatCurrency(order.total)}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <PayIcon className="h-3 w-3 text-gray-400" />
                          <span className="text-[11px] text-gray-400">
                            {payLabel}
                          </span>
                        </div>
                      </div>
                      <div className="text-gray-300">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="border-t border-gray-100 pt-3">
                        {/* Line items */}
                        {orderItems[order.id] && orderItems[order.id].length > 0 && (
                          <div className="space-y-1.5 mb-3">
                            {orderItems[order.id].map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-[13px]">
                                <div className="flex-1 min-w-0">
                                  <span className="text-gray-700 font-medium truncate block">
                                    {item.nameCn && locale !== "en" ? item.nameCn : item.name}
                                  </span>
                                  <span className="text-[11px] text-gray-400">
                                    {item.quantity} x {formatCurrency(item.unitPrice)}
                                  </span>
                                </div>
                                <span className="text-gray-600 font-medium tabular-nums shrink-0 ml-3">
                                  {formatCurrency(item.lineTotal)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2">
                          {/* Summary info */}
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="text-gray-400">{t(locale, "subtotal")}</span>
                            <span className="text-gray-600 font-medium">
                              {formatCurrency(order.subtotal)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="text-gray-400">{t(locale, "historyPayment")}</span>
                            <span className="flex items-center gap-1.5 text-gray-600 font-medium">
                              <PayIcon className="h-3.5 w-3.5 text-gray-400" />
                              {payLabel}
                            </span>
                          </div>
                          <div className="border-t border-dashed border-gray-100 pt-2 mt-2 flex items-center justify-between text-[14px]">
                            <span className="font-semibold text-gray-700">
                              {t(locale, "total")}
                            </span>
                            <span className="font-bold text-gray-900">
                              {formatCurrency(order.total)}
                            </span>
                          </div>
                        </div>

                        {/* Time + Print button */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                          <PrintReceipt orderNumber={order.orderNumber} locale={locale}>
                            {({ onPrint, isPrinting }) => (
                              <button
                                onClick={(e) => { e.stopPropagation(); onPrint(); }}
                                disabled={isPrinting}
                                className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-700 transition-colors active:scale-[0.97] disabled:opacity-50"
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
      </main>
    </div>
  );
}
