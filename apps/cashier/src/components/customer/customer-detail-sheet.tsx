"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { type Locale, t } from "@/i18n/locales";
import { X, Star, Phone, Mail, Calendar, Clock, StickyNote, UserX } from "lucide-react";

export type LinkedCustomer = {
  id: string;
  name: string;
  avatar?: string | null;
  phone?: string;
  email?: string;
  tier?: string;
  points?: number;
  totalSpent?: number;
  orderCount?: number;
  memberSince?: string;
  lastVisit?: string;
  notes?: string;
};

type Props = {
  customer: LinkedCustomer;
  locale: Locale;
  onClose: () => void;
  onRemove: () => void;
};

export default function CustomerDetailSheet({ customer, locale, onClose, onRemove }: Props) {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-300 bg-black/40 backdrop-blur-sm",
          closing && "opacity-0"
        )}
        onClick={handleClose}
      />
      <div
        className={cn(
          "relative w-full max-h-[85vh] rounded-t-[var(--radius-xl)] shadow-2xl flex flex-col overflow-hidden bg-pos-bg",
          closing ? "animate-sheet-down" : "animate-sheet-up"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-pos-border shrink-0">
          <h2 className="text-[16px] font-semibold text-pos-text">{t(locale, "customerProfile")}</h2>
          <button
            onClick={handleClose}
            className="h-10 w-10 rounded-full bg-black/8 flex items-center justify-center text-pos-text-muted hover:bg-black/15 transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Avatar + name hero */}
          <div className="flex flex-col items-center pt-8 pb-6">
            {customer.avatar ? (
              <img
                src={customer.avatar}
                alt={customer.name}
                className="h-20 w-20 rounded-full object-cover mb-4 bg-pos-bg"
              />
            ) : (
              <div
                className="h-20 w-20 rounded-full flex items-center justify-center text-[28px] font-bold text-white mb-4"
                style={{ backgroundColor: "var(--color-pos-accent)" }}
              >
                {customer.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h3 className="text-[20px] font-semibold text-pos-text">{customer.name}</h3>
            {customer.tier && (
              <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="text-[13px] font-medium text-amber-700">{customer.tier}</span>
                {customer.points !== undefined && (
                  <span className="text-[13px] text-amber-600">· {customer.points.toLocaleString()} pts</span>
                )}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-px mx-5 rounded-[var(--radius-md)] overflow-hidden border border-pos-border mb-6">
            <div className="bg-pos-surface px-3 py-3.5 text-center">
              <p className="text-[18px] font-bold text-pos-text tabular-nums">
                {customer.orderCount ?? 0}
              </p>
              <p className="text-[11px] text-pos-text-muted mt-0.5">{t(locale, "orders")}</p>
            </div>
            <div className="bg-pos-surface px-3 py-3.5 text-center border-x border-pos-border">
              <p className="text-[18px] font-bold text-pos-text tabular-nums">
                {customer.totalSpent ? `$${(customer.totalSpent / 1000).toFixed(1)}k` : "$0"}
              </p>
              <p className="text-[11px] text-pos-text-muted mt-0.5">{t(locale, "totalSpent")}</p>
            </div>
            <div className="bg-pos-surface px-3 py-3.5 text-center">
              <p className="text-[18px] font-bold text-pos-text tabular-nums">
                {customer.points?.toLocaleString() ?? 0}
              </p>
              <p className="text-[11px] text-pos-text-muted mt-0.5">{t(locale, "pointsAbbrev")}</p>
            </div>
          </div>

          {/* Contact info */}
          <div className="mx-5 rounded-[var(--radius-md)] border border-pos-border overflow-hidden mb-6">
            {customer.phone && (
              <div className="flex items-center gap-3 px-4 py-3 bg-pos-surface">
                <Phone className="h-4 w-4 text-pos-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-pos-text-muted">{t(locale, "phone")}</p>
                  <p className="text-[14px] text-pos-text">{customer.phone}</p>
                </div>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-3 px-4 py-3 bg-pos-surface border-t border-pos-border">
                <Mail className="h-4 w-4 text-pos-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-pos-text-muted">{t(locale, "email")}</p>
                  <p className="text-[14px] text-pos-text">{customer.email}</p>
                </div>
              </div>
            )}
            {customer.memberSince && (
              <div className="flex items-center gap-3 px-4 py-3 bg-pos-surface border-t border-pos-border">
                <Calendar className="h-4 w-4 text-pos-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-pos-text-muted">{t(locale, "memberSince")}</p>
                  <p className="text-[14px] text-pos-text">{new Date(customer.memberSince).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            {customer.lastVisit && (
              <div className="flex items-center gap-3 px-4 py-3 bg-pos-surface border-t border-pos-border">
                <Clock className="h-4 w-4 text-pos-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-pos-text-muted">{t(locale, "lastVisit")}</p>
                  <p className="text-[14px] text-pos-text">{new Date(customer.lastVisit).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="mx-5 rounded-[var(--radius-md)] border border-pos-border overflow-hidden mb-6">
              <div className="flex items-start gap-3 px-4 py-3 bg-pos-surface">
                <StickyNote className="h-4 w-4 text-pos-text-muted shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-pos-text-muted">{t(locale, "notes")}</p>
                  <p className="text-[14px] text-pos-text mt-0.5">{customer.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Remove customer button */}
          <div className="mx-5 mb-8">
            <button
              onClick={() => {
                onRemove();
                setClosing(true);
                setTimeout(onClose, 300);
              }}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-pos-danger/30 text-[14px] font-medium text-pos-danger hover:bg-pos-danger-light transition-colors"
            >
              <UserX className="h-4 w-4" />
              {t(locale, "removeCustomer")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
