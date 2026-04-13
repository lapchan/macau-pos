"use client";

import { useEffect, useState } from "react";
import { Check, X, AlertTriangle, ScanLine, ExternalLink, Loader2, Plus, WifiOff } from "lucide-react";
import { type Locale, t } from "@/i18n/locales";

function sourceLabelKey(
  source: "gs1hk" | "gs1cn" | "gs1jp"
): "scanLookupFoundFrom" | "scanLookupFoundFromCn" | "scanLookupFoundFromJp" {
  if (source === "gs1cn") return "scanLookupFoundFromCn";
  if (source === "gs1jp") return "scanLookupFoundFromJp";
  return "scanLookupFoundFrom";
}

export type ScanFeedbackKind = "success" | "not-found" | "error";

export type LookupSource = "gs1hk" | "gs1cn" | "gs1jp";

export type LookupErrorReason = "timeout" | "network" | "auth" | "unknown";

export type LookupState =
  | { state: "loading" }
  | {
      state: "found";
      source: LookupSource;
      name: string;
      brand?: string;
      company?: string;
      category?: string;
      origin?: string;
    }
  // GTIN is valid and registered with the registry, but no product metadata.
  // Cashier can still create a temp product using just the barcode.
  | { state: "registered"; source: LookupSource }
  // Registry has no record of this GTIN at all.
  | { state: "miss" }
  // Lookup itself failed (timeout / network / auth / server).
  | { state: "error"; source: LookupSource; reason: LookupErrorReason };

export type ScanFeedbackState = {
  kind: ScanFeedbackKind;
  message: string;
  // Original scanned code — used to build the "search online" link for not-found
  code?: string;
  // External lookup status (BarcodePlus / GS1 HK) — only for not-found
  lookup?: LookupState;
  // Bumped on every new scan so identical messages still re-trigger the animation
  nonce: number;
} | null;

type Props = {
  state: ScanFeedbackState;
  onDone: () => void;
  onCreateTempProduct?: (name: string, code: string, source: LookupSource) => void;
  locale: Locale;
  durationMs?: number;
};

const STYLES: Record<
  ScanFeedbackKind,
  { iconBg: string; iconColor: string; icon: typeof Check; ring: string }
> = {
  success: {
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-500",
    icon: Check,
    ring: "ring-emerald-500/30",
  },
  "not-found": {
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-500",
    icon: AlertTriangle,
    ring: "ring-amber-500/30",
  },
  error: {
    iconBg: "bg-red-500/15",
    iconColor: "text-red-500",
    icon: X,
    ring: "ring-red-500/30",
  },
};

export default function ScanFeedback({
  state,
  onDone,
  onCreateTempProduct,
  locale,
  durationMs = 1800,
}: Props) {
  const [closing, setClosing] = useState(false);

  // not-found is persistent (user must dismiss or scan again), success/error auto-dismiss
  const isPersistent = state?.kind === "not-found";

  useEffect(() => {
    if (!state) return;
    setClosing(false);
    if (isPersistent) return;
    const closeTimer = setTimeout(() => setClosing(true), durationMs);
    const doneTimer = setTimeout(onDone, durationMs + 220);
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(doneTimer);
    };
  }, [state, durationMs, onDone, isPersistent]);

  const handleDismiss = () => {
    setClosing(true);
    setTimeout(onDone, 220);
  };

  if (!state) return null;

  const style = STYLES[state.kind];
  const Icon = style.icon;
  const searchUrl = state.code
    ? `https://www.google.com/search?q=${encodeURIComponent(`barcode ${state.code}`)}`
    : null;

  const lookup = state.lookup;
  const lookupFound = lookup?.state === "found" ? lookup : null;
  const lookupRegistered = lookup?.state === "registered" ? lookup : null;
  const lookupError = lookup?.state === "error" ? lookup : null;

  const handleAddTempProduct = () => {
    if (!lookupFound || !state.code || !onCreateTempProduct) return;
    onCreateTempProduct(lookupFound.name, state.code, lookupFound.source);
    handleDismiss();
  };

  const handleCreateBlankTempProduct = () => {
    if (!state.code || !onCreateTempProduct || !lookupRegistered) return;
    // No metadata from registry — use the barcode itself as the provisional name.
    onCreateTempProduct(state.code, state.code, lookupRegistered.source);
    handleDismiss();
  };

  return (
    <div
      className={`fixed inset-x-0 top-0 z-[60] flex justify-center pt-[8vh] px-4 transition-all duration-200 ${
        isPersistent ? "pointer-events-auto" : "pointer-events-none"
      } ${
        closing
          ? "opacity-0 -translate-y-4"
          : "animate-[spotlightOpen_0.25s_cubic-bezier(0.16,1,0.3,1)]"
      }`}
      aria-live="polite"
    >
      <div
        className={`w-full max-w-xl bg-pos-surface rounded-2xl shadow-2xl ring-1 ${style.ring} overflow-hidden`}
      >
        <div className="flex items-center gap-4 px-6 py-5">
          <div
            className={`shrink-0 h-14 w-14 rounded-full flex items-center justify-center ${style.iconBg}`}
          >
            <Icon className={`h-7 w-7 ${style.iconColor}`} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1">
              <ScanLine className="h-3 w-3" />
              <span>Scan</span>
            </div>
            <p className="text-[16px] font-semibold text-pos-text leading-snug truncate">
              {state.message}
            </p>
          </div>
        </div>

        {state.kind === "not-found" && lookup?.state === "loading" && (
          <div className="flex items-center gap-3 px-6 pb-5 pt-1 text-pos-text-secondary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-[13px]">{t(locale, "scanLookupSearching")}</span>
          </div>
        )}

        {state.kind === "not-found" && lookupFound && (
          <div className="px-6 pb-2 pt-1">
            <div className="rounded-xl bg-pos-bg p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1.5">
                {t(locale, sourceLabelKey(lookupFound.source))}
              </div>
              <p className="text-[15px] font-semibold text-pos-text leading-snug mb-2">
                {lookupFound.name}
              </p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
                {lookupFound.brand && (
                  <>
                    <dt className="text-pos-text-muted">
                      {t(locale, "scanLookupBrand")}
                    </dt>
                    <dd className="text-pos-text-secondary">{lookupFound.brand}</dd>
                  </>
                )}
                {lookupFound.category && (
                  <>
                    <dt className="text-pos-text-muted">
                      {t(locale, "scanLookupCategory")}
                    </dt>
                    <dd className="text-pos-text-secondary">{lookupFound.category}</dd>
                  </>
                )}
                {lookupFound.origin && (
                  <>
                    <dt className="text-pos-text-muted">
                      {t(locale, "scanLookupOrigin")}
                    </dt>
                    <dd className="text-pos-text-secondary">{lookupFound.origin}</dd>
                  </>
                )}
              </dl>
            </div>
          </div>
        )}

        {state.kind === "not-found" && lookupFound && (
          <div className="flex items-center gap-2 px-5 pb-5 pt-3">
            <button
              onClick={handleDismiss}
              className="h-11 px-4 text-[14px] font-medium text-pos-text-secondary border border-pos-border rounded-[var(--radius-md)] hover:bg-pos-surface-hover transition-colors"
            >
              {t(locale, "scanDismiss")}
            </button>
            <button
              onClick={handleAddTempProduct}
              className="flex-1 h-11 inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white bg-pos-accent hover:bg-pos-accent/90 rounded-[var(--radius-md)] transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t(locale, "scanAddToCart")}
            </button>
          </div>
        )}

        {state.kind === "not-found" && lookupRegistered && (
          <div className="px-6 pb-2 pt-1">
            <div className="rounded-xl bg-pos-bg p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1.5">
                {t(locale, sourceLabelKey(lookupRegistered.source))}
              </div>
              <p className="text-[14px] font-semibold text-pos-text leading-snug">
                {t(locale, "scanLookupRegisteredTitle")}
              </p>
              <p className="mt-1 text-[12px] text-pos-text-secondary leading-snug">
                {t(locale, "scanLookupRegisteredBody")}
              </p>
              <p className="mt-2 font-mono text-[12px] text-pos-text-muted">
                {state.code}
              </p>
            </div>
          </div>
        )}

        {state.kind === "not-found" && lookupRegistered && (
          <div className="flex items-center gap-2 px-5 pb-5 pt-3">
            <button
              onClick={handleDismiss}
              className="h-11 px-4 text-[14px] font-medium text-pos-text-secondary border border-pos-border rounded-[var(--radius-md)] hover:bg-pos-surface-hover transition-colors"
            >
              {t(locale, "scanDismiss")}
            </button>
            <button
              onClick={handleCreateBlankTempProduct}
              className="flex-1 h-11 inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white bg-pos-accent hover:bg-pos-accent/90 rounded-[var(--radius-md)] transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t(locale, "scanAddToCart")}
            </button>
          </div>
        )}

        {state.kind === "not-found" && lookupError && (
          <div className="px-6 pb-2 pt-1">
            <div className="rounded-xl bg-pos-bg p-4">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-pos-text-muted mb-1.5">
                <WifiOff className="h-3 w-3" />
                <span>{t(locale, sourceLabelKey(lookupError.source))}</span>
              </div>
              <p className="text-[14px] font-semibold text-pos-text leading-snug">
                {t(
                  locale,
                  lookupError.reason === "timeout"
                    ? "scanLookupErrorTimeout"
                    : lookupError.reason === "auth"
                      ? "scanLookupErrorAuth"
                      : "scanLookupErrorGeneric"
                )}
              </p>
            </div>
          </div>
        )}

        {state.kind === "not-found" && lookupError && searchUrl && (
          <div className="flex items-center gap-2 px-5 pb-5 pt-3">
            <button
              onClick={handleDismiss}
              className="h-11 px-4 text-[14px] font-medium text-pos-text-secondary border border-pos-border rounded-[var(--radius-md)] hover:bg-pos-surface-hover transition-colors"
            >
              {t(locale, "scanDismiss")}
            </button>
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDismiss}
              className="flex-1 h-11 inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white bg-pos-accent hover:bg-pos-accent/90 rounded-[var(--radius-md)] transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              {t(locale, "scanSearchOnline")}
            </a>
          </div>
        )}

        {state.kind === "not-found" &&
          (!lookup || lookup.state === "miss") &&
          searchUrl && (
            <div className="flex items-center gap-2 px-5 pb-5 pt-1">
              <button
                onClick={handleDismiss}
                className="h-11 px-4 text-[14px] font-medium text-pos-text-secondary border border-pos-border rounded-[var(--radius-md)] hover:bg-pos-surface-hover transition-colors"
              >
                {t(locale, "scanDismiss")}
              </button>
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDismiss}
                className="flex-1 h-11 inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white bg-pos-accent hover:bg-pos-accent/90 rounded-[var(--radius-md)] transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                {t(locale, "scanSearchOnline")}
              </a>
            </div>
          )}
      </div>
    </div>
  );
}
