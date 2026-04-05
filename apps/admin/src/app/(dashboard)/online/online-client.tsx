"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";
import {
  Monitor,
  Globe,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  QrCode,
} from "lucide-react";
import type { ShopSettingsRow } from "@/lib/queries";

type SettingsData = {
  onlineEnabled: boolean;
  onlineUrl: string | null;
  onlineDescription: string | null;
  onlineBanner: string | null;
} | null;

interface OnlineClientProps {
  settings: ShopSettingsRow;
}

export default function OnlineClient({ settings }: OnlineClientProps) {
  const { locale } = useLocale();
  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const storeUrl = "countingstars.retailos.app";

  function handleCopy() {
    navigator.clipboard.writeText(`https://${storeUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 600);
  }

  return (
    <>
      <PageHeader
        title={t(locale, "online.pageTitle")}
        subtitle={t(locale, "online.subtitle")}
      />

      {/* ── Sales Channels ─────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          {t(locale, "online.salesChannels")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: POS Terminal */}
          <Card className="relative border-l-[3px] border-l-success">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[var(--radius-md)] bg-success-light flex items-center justify-center">
                  <Monitor className="h-5 w-5 text-success" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {t(locale, "online.posTerminal")}
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {t(locale, "online.posTerminalDesc")}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)] bg-success-light text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {t(locale, "online.statusActive")}
              </span>
              <span className="text-xs text-text-tertiary">
                {interpolate(t(locale, "online.terminalsConnected"), { count: 24 })}
              </span>
            </div>
          </Card>

          {/* Card 2: Online Store */}
          <Card
            className={cn(
              "relative transition-all",
              onlineEnabled
                ? "border-l-[3px] border-l-brand"
                : "border-l-[3px] border-l-transparent"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-10 w-10 rounded-[var(--radius-md)] flex items-center justify-center",
                    onlineEnabled ? "bg-brand/10" : "bg-surface-hover"
                  )}
                >
                  <Globe
                    className={cn(
                      "h-5 w-5",
                      onlineEnabled ? "text-brand" : "text-text-tertiary"
                    )}
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {t(locale, "online.onlineStore")}
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {t(locale, "online.onlineStoreDesc")}
                  </p>
                </div>
              </div>
              {/* Toggle */}
              <button
                role="switch"
                aria-checked={onlineEnabled}
                onClick={() => setOnlineEnabled(!onlineEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  onlineEnabled ? "bg-brand" : "bg-border"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                    onlineEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            <div className="mt-4">
              {onlineEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)] bg-brand/10 text-brand">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  {t(locale, "online.statusEnabled")}
                </span>
              ) : (
                <p className="text-xs text-text-tertiary">
                  {t(locale, "online.enableToStart")}
                </p>
              )}
            </div>
          </Card>

          {/* Card 3: WeChat Mini-Program */}
          <Card className="relative opacity-60">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center">
                  <MessageCircle
                    className="h-5 w-5 text-text-tertiary"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {t(locale, "online.wechatMiniProgram")}
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {t(locale, "online.wechatDesc")}
                  </p>
                </div>
              </div>
              {/* Disabled toggle */}
              <button
                role="switch"
                aria-checked={false}
                disabled
                className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-border opacity-50"
              >
                <span className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm translate-x-0" />
              </button>
            </div>
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)] bg-surface-hover text-text-tertiary">
                {t(locale, "online.comingSoon")}
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* ── Store Customization links ─────────────────────── */}
      {onlineEnabled && (
        <section className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
          <a
            href="/online/themes"
            className="flex items-center justify-between rounded-xl border border-border bg-white p-4 transition-colors hover:bg-surface-hover"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-brand/10">
                <span className="text-lg">🎨</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Themes</p>
                <p className="text-xs text-text-tertiary mt-0.5">Choose a visual theme for your storefront</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-text-tertiary" />
          </a>
          <a
            href="/online/homepage"
            className="flex items-center justify-between rounded-xl border border-border bg-white p-4 transition-colors hover:bg-surface-hover"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-brand/10">
                <span className="text-lg">🏠</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Homepage Builder</p>
                <p className="text-xs text-text-tertiary mt-0.5">Customize your storefront homepage sections</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-text-tertiary" />
          </a>
        </section>
      )}

      {/* ── Online Store Settings (when enabled) ──────────── */}
      {onlineEnabled && (
        <section className="animate-in fade-in slide-in-from-top-2 duration-300">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            {t(locale, "online.storeSettings")}
          </h2>

          <Card>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: URL + Description */}
              <div className="lg:col-span-2 space-y-5">
                {/* Store URL */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    {t(locale, "online.storeUrl")}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-surface-hover border border-border rounded-[var(--radius-sm)] text-sm">
                      <Globe className="h-4 w-4 text-text-tertiary shrink-0" />
                      <span className="text-text-secondary select-all">
                        https://{storeUrl}
                      </span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-[var(--radius-sm)] transition-all",
                        copied
                          ? "border-success text-success bg-success-light"
                          : "border-border text-text-secondary hover:bg-surface-hover"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          {t(locale, "online.copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          {t(locale, "online.copy")}
                        </>
                      )}
                    </button>
                    <a
                      href={`https://${storeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-border text-text-secondary rounded-[var(--radius-sm)] hover:bg-surface-hover transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="store-description"
                    className="block text-sm font-medium text-text-primary mb-1.5"
                  >
                    {t(locale, "online.storeDescription")}
                  </label>
                  <textarea
                    id="store-description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t(locale, "online.storeDescPlaceholder")}
                    className="w-full px-3 py-2 text-sm border border-border rounded-[var(--radius-sm)] bg-surface text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    This description appears on your online storefront.
                  </p>
                </div>

                {/* Save */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                      "inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-[var(--radius-sm)] transition-all",
                      saving
                        ? "bg-brand/60 cursor-not-allowed"
                        : "bg-brand hover:bg-brand/90 active:scale-[0.98]"
                    )}
                  >
                    {saving ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t(locale, "common.saving")}
                      </>
                    ) : (
                      t(locale, "common.save")
                    )}
                  </button>
                </div>
              </div>

              {/* Right: QR Code placeholder */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t(locale, "online.storeQRCode")}
                </label>
                <div className="aspect-square max-w-[200px] border-2 border-dashed border-border rounded-[var(--radius-md)] flex flex-col items-center justify-center gap-2 bg-surface-hover/50">
                  <QrCode className="h-10 w-10 text-text-tertiary" strokeWidth={1} />
                  <span className="text-xs text-text-tertiary">QR Code</span>
                  <span className="text-[10px] text-text-tertiary">
                    Auto-generated
                  </span>
                </div>
                <p className="text-xs text-text-tertiary mt-2">
                  Customers can scan this code to visit your online store.
                </p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* ── Success Toast ─────────────────────────────────── */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 px-4 py-3 bg-success text-white text-sm font-medium rounded-[var(--radius-md)] shadow-lg">
            <Check className="h-4 w-4" />
            {t(locale, "online.successMessage")}
          </div>
        </div>
      )}
    </>
  );
}
