"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { type Locale, t } from "@/i18n/locales";
import { Smartphone, X, QrCode } from "lucide-react";
import { searchCustomersByPhone, type CustomerSearchResult } from "@/lib/actions";
import type { LinkedCustomer } from "./customer-detail-sheet";

type Props = {
  locale: Locale;
  onClose: () => void;
  onSelect: (customer: LinkedCustomer) => void;
};

export default function CustomerSearchSpotlight({ locale, onClose, onSelect }: Props) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSelect = (c: CustomerSearchResult) => {
    onSelect({ id: c.id, name: c.name, avatar: c.avatar, phone: c.phone || undefined, email: c.email || undefined });
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-[8vh] px-4 animate-[spotlightOpen_0.25s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="w-full max-w-md bg-pos-surface rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-10 w-10 flex items-center justify-center rounded-full bg-black/8 text-pos-text-muted hover:bg-black/15 transition-colors z-10"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>

          {/* Phone input */}
          <div className="flex items-center px-4">
            <Smartphone className="h-5 w-5 text-pos-text-muted shrink-0 ml-1" />
            <input
              type="tel"
              autoFocus
              value={input}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9+ ]/g, "");
                setInput(val);
                if (val.replace(/[^0-9]/g, "").length >= 3) {
                  setSearching(true);
                  searchCustomersByPhone(val)
                    .then(setResults)
                    .catch(() => setResults([]))
                    .finally(() => setSearching(false));
                } else {
                  setResults([]);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
                if (e.key === "Enter" && results.length === 1) {
                  handleSelect(results[0]);
                }
              }}
              placeholder={t(locale, "searchByPhone")}
              style={{ outline: "none" }}
              className="flex-1 h-14 pl-3 pr-12 text-[18px] bg-transparent text-pos-text placeholder:text-pos-text-muted"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-pos-border" />

          {/* Results */}
          <div className="p-3 space-y-1">
            {searching && (
              <div className="flex items-center justify-center py-4">
                <span className="h-5 w-5 border-2 border-pos-accent/30 border-t-pos-accent rounded-full animate-spin" />
              </div>
            )}

            {!searching && results.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-pos-surface-hover transition-colors"
              >
                {c.avatar ? (
                  <img src={c.avatar} alt="" className="h-9 w-9 rounded-full object-cover bg-pos-bg shrink-0" />
                ) : (
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white shrink-0"
                    style={{ backgroundColor: "var(--color-pos-accent)" }}
                  >
                    {c.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[14px] font-medium text-pos-text">{c.name}</p>
                  <p className="text-[12px] text-pos-text-muted">
                    {c.phone}
                    {c.isVerified && <span className="ml-1.5 text-pos-success">&#10003;</span>}
                  </p>
                </div>
              </button>
            ))}

            {!searching && input.replace(/[^0-9]/g, "").length >= 3 && results.length === 0 && (
              <p className="text-center text-[13px] text-pos-text-muted py-4">
                {t(locale, "noResults")}
              </p>
            )}

            {/* Scan membership option */}
            <button
              onClick={onClose}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-pos-surface-hover transition-colors text-pos-text-secondary"
            >
              <div className="h-9 w-9 rounded-full bg-pos-bg flex items-center justify-center shrink-0">
                <QrCode className="h-4 w-4" />
              </div>
              <p className="text-[14px] font-medium">{t(locale, "scanMembership")}</p>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
