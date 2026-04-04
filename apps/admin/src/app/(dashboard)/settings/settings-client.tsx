"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { PageHeader } from "@/components/shared/page-header";
import { Flag } from "@/components/shared/flags";
import { cn } from "@/lib/cn";
import {
  updateBusinessInfo,
  updateBusinessHours,
  updatePaymentMethods,
  updateRegionalSettings,
  updateBranding,
  updateReceiptSettings,
} from "@/lib/settings-actions";

// ─── Types ────────────────────────────────────────────────
type SettingsData = {
  shopName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  businessHours: any;
  currency: string;
  defaultLocale: string | null;
  taxRate: string | null;
  paymentCash: boolean;
  paymentCard: boolean;
  paymentMpay: boolean;
  paymentAlipay: boolean;
  paymentWechat: boolean;
  accentColor: string | null;
  theme: string | null;
  receiptHeader: string | null;
  receiptFooter: string | null;
  receiptShowAddress: boolean;
  receiptShowPhone: boolean;
  receiptShowTax: boolean;
} | null;

type BusinessHour = {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
};

type Tab = "business" | "payment" | "regional" | "branding" | "receipt";

const TABS: { id: Tab; labelKey: string }[] = [
  { id: "business", labelKey: "settings.tabBusinessInfo" },
  { id: "payment", labelKey: "settings.tabPaymentMethods" },
  { id: "regional", labelKey: "settings.tabRegional" },
  { id: "branding", labelKey: "settings.tabBranding" },
  { id: "receipt", labelKey: "settings.tabReceipt" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_HOURS: BusinessHour[] = DAYS.map((day) => ({
  day,
  open: "09:00",
  close: "22:00",
  isClosed: false,
}));

const CURRENCIES = [
  { value: "MOP", label: "MOP - Macanese Pataca" },
  { value: "HKD", label: "HKD - Hong Kong Dollar" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
];

const LANGUAGES = [
  { code: "tc", label: "Traditional Chinese" },
  { code: "sc", label: "Simplified Chinese" },
  { code: "en", label: "English" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
];

const ACCENT_COLORS = [
  { value: "#4f6ef7", label: "Blue" },
  { value: "#2f9e44", label: "Green" },
  { value: "#e8590c", label: "Orange" },
  { value: "#e03131", label: "Red" },
  { value: "#7950f2", label: "Purple" },
  { value: "#0c8599", label: "Teal" },
];

const PAYMENT_METHODS = [
  {
    key: "paymentCash" as const,
    labelKey: "settings.paymentCash",
    descriptionKey: "settings.paymentCashDesc",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
  },
  {
    key: "paymentCard" as const,
    labelKey: "settings.paymentCard",
    descriptionKey: "settings.paymentCardDesc",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
  },
  {
    key: "paymentMpay" as const,
    labelKey: "settings.paymentMpay",
    descriptionKey: "settings.paymentMpayDesc",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
      </svg>
    ),
  },
  {
    key: "paymentAlipay" as const,
    labelKey: "settings.paymentAlipay",
    descriptionKey: "settings.paymentAlipayDesc",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.73-3.559" />
      </svg>
    ),
  },
  {
    key: "paymentWechat" as const,
    labelKey: "settings.paymentWechat",
    descriptionKey: "settings.paymentWechatDesc",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
  },
];

// ─── Shared Components ────────────────────────────────────
function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-text-primary">
      {children}
    </label>
  );
}

function Input({
  id,
  name,
  defaultValue,
  placeholder,
  type = "text",
  className,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      className={cn(
        "h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary",
        "placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all",
        className
      )}
    />
  );
}

function Textarea({
  id,
  name,
  defaultValue,
  placeholder,
  rows = 3,
}: {
  id?: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      className={cn(
        "w-full px-3 py-2.5 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary",
        "placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
      )}
    />
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        checked ? "bg-accent" : "bg-border"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}

function SaveButton({
  isPending,
  label,
  savingLabel,
}: {
  isPending: boolean;
  label: string;
  savingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className={cn(
        "h-10 px-6 rounded-[var(--radius-md)] bg-accent text-white text-[13px] font-medium",
        "hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {isPending ? savingLabel : label}
    </button>
  );
}

function SuccessToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-md)] shadow-lg">
        <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        <span className="text-[13px] font-medium text-emerald-700">{message}</span>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[15px] font-semibold text-text-primary">{children}</h3>;
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-surface border border-border rounded-[var(--radius-lg)] p-6", className)}>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function SettingsClient({ settings }: { settings: SettingsData }) {
  const { locale } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>("business");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  return (
    <div className="max-w-4xl">
      <PageHeader title={t(locale as any, "settings.pageTitle")} subtitle={t(locale as any, "settings.subtitle")} />

      {/* Tab Navigation */}
      <div className="flex border-b border-border mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px whitespace-nowrap",
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
            )}
          >
            {t(locale as any, tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "business" && (
        <BusinessInfoTab settings={settings} showToast={showToast} locale={locale} />
      )}
      {activeTab === "payment" && (
        <PaymentMethodsTab settings={settings} showToast={showToast} locale={locale} />
      )}
      {activeTab === "regional" && (
        <RegionalTab settings={settings} showToast={showToast} locale={locale} />
      )}
      {activeTab === "branding" && (
        <BrandingTab settings={settings} showToast={showToast} locale={locale} />
      )}
      {activeTab === "receipt" && (
        <ReceiptTab settings={settings} showToast={showToast} locale={locale} />
      )}

      <SuccessToast message={toast} />
    </div>
  );
}

// ─── Business Info Tab ────────────────────────────────────
function BusinessInfoTab({
  settings,
  showToast,
  locale,
}: {
  settings: SettingsData;
  showToast: (msg: string) => void;
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const initialHours: BusinessHour[] = (() => {
    if (!settings?.businessHours || !Array.isArray(settings.businessHours)) return DEFAULT_HOURS;
    if (settings.businessHours.length === 0) return DEFAULT_HOURS;
    return settings.businessHours as BusinessHour[];
  })();

  const [hours, setHours] = useState<BusinessHour[]>(initialHours);

  const updateHour = (index: number, field: keyof BusinessHour, value: string | boolean) => {
    setHours((prev) => prev.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const infoResult = await updateBusinessInfo(formData);

      const hoursData = new FormData();
      hoursData.set("businessHours", JSON.stringify(hours));
      const hoursResult = await updateBusinessHours(hoursData);

      if (infoResult.success && hoursResult.success) {
        showToast(t(locale as any, "settings.successBusinessInfo"));
      }
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <SectionTitle>{t(locale as any, "settings.shopDetails")}</SectionTitle>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="shopName">{t(locale as any, "settings.shopName")}</Label>
            <Input
              id="shopName"
              name="shopName"
              defaultValue={settings?.shopName ?? ""}
              placeholder={t(locale as any, "settings.shopNamePlaceholder")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="address">{t(locale as any, "settings.address")}</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={settings?.address ?? ""}
              placeholder={t(locale as any, "settings.addressPlaceholder")}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="phone">{t(locale as any, "settings.phone")}</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={settings?.phone ?? ""}
                placeholder="+853 2888 8888"
                type="tel"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">{t(locale as any, "settings.email")}</Label>
              <Input
                id="email"
                name="email"
                defaultValue={settings?.email ?? ""}
                placeholder="shop@example.com"
                type="email"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>{t(locale as any, "settings.businessHours")}</SectionTitle>
        <div className="mt-4 space-y-3">
          {hours.map((hour, index) => (
            <div
              key={hour.day}
              className={cn(
                "flex items-center gap-3 py-2 px-3 rounded-[var(--radius-md)] -mx-3",
                hour.isClosed && "opacity-50"
              )}
            >
              <span className="text-[13px] font-medium text-text-primary w-24 shrink-0">
                {hour.day.slice(0, 3)}
              </span>
              <input
                type="time"
                value={hour.open}
                disabled={hour.isClosed}
                onChange={(e) => updateHour(index, "open", e.target.value)}
                className={cn(
                  "h-9 px-2.5 text-[13px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary",
                  "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              />
              <span className="text-text-tertiary text-[12px]">{t(locale as any, "common.to")}</span>
              <input
                type="time"
                value={hour.close}
                disabled={hour.isClosed}
                onChange={(e) => updateHour(index, "close", e.target.value)}
                className={cn(
                  "h-9 px-2.5 text-[13px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary",
                  "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all",
                  "disabled:opacity-40 disabled:cursor-not-allowed"
                )}
              />
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[12px] text-text-secondary">{t(locale as any, "settings.closed")}</span>
                <Toggle
                  checked={hour.isClosed}
                  onChange={(val) => updateHour(index, "isClosed", val)}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveButton isPending={isPending} label={t(locale as any, "common.save")} savingLabel={t(locale as any, "common.saving")} />
      </div>
    </form>
  );
}

// ─── Payment Methods Tab ──────────────────────────────────
function PaymentMethodsTab({
  settings,
  showToast,
  locale,
}: {
  settings: SettingsData;
  showToast: (msg: string) => void;
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();

  const initialState = {
    paymentCash: settings?.paymentCash ?? true,
    paymentCard: settings?.paymentCard ?? true,
    paymentMpay: settings?.paymentMpay ?? false,
    paymentAlipay: settings?.paymentAlipay ?? false,
    paymentWechat: settings?.paymentWechat ?? false,
  };

  const [methods, setMethods] = useState(initialState);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(methods).forEach(([key, value]) => {
      formData.set(key, String(value));
    });

    startTransition(async () => {
      const result = await updatePaymentMethods(formData);
      if (result.success) {
        showToast(t(locale as any, "settings.successPaymentMethods"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <SectionTitle>{t(locale as any, "settings.acceptedPaymentMethods")}</SectionTitle>
        <p className="text-[13px] text-text-secondary mt-1">
          {t(locale as any, "settings.paymentMethodsDesc")}
        </p>
        <div className="mt-5 space-y-1">
          {PAYMENT_METHODS.map((pm) => (
            <div
              key={pm.key}
              className="flex items-center gap-4 py-3 px-3 rounded-[var(--radius-md)] -mx-3 hover:bg-surface-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-surface-secondary flex items-center justify-center text-text-secondary shrink-0">
                {pm.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-text-primary">{t(locale as any, pm.labelKey)}</div>
                <div className="text-[12px] text-text-secondary">{t(locale as any, pm.descriptionKey)}</div>
              </div>
              <Toggle
                checked={methods[pm.key]}
                onChange={(val) => setMethods((prev) => ({ ...prev, [pm.key]: val }))}
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveButton isPending={isPending} label={t(locale as any, "common.save")} savingLabel={t(locale as any, "common.saving")} />
      </div>
    </form>
  );
}

// ─── Regional Tab ─────────────────────────────────────────
function RegionalTab({
  settings,
  showToast,
  locale,
}: {
  settings: SettingsData;
  showToast: (msg: string) => void;
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedLang, setSelectedLang] = useState(settings?.defaultLocale ?? "tc");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("defaultLocale", selectedLang);

    startTransition(async () => {
      const result = await updateRegionalSettings(formData);
      if (result.success) {
        showToast(t(locale as any, "settings.successRegional"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <SectionTitle>{t(locale as any, "settings.currencyAndTax")}</SectionTitle>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="currency">{t(locale as any, "settings.currency")}</Label>
            <select
              id="currency"
              name="currency"
              defaultValue={settings?.currency ?? "MOP"}
              className={cn(
                "h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary",
                "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              )}
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="taxRate">{t(locale as any, "settings.taxRate")}</Label>
            <Input
              id="taxRate"
              name="taxRate"
              defaultValue={settings?.taxRate ?? "0.00"}
              placeholder="0.00"
              type="number"
              className="max-w-[200px]"
            />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>{t(locale as any, "settings.defaultLanguage")}</SectionTitle>
        <p className="text-[13px] text-text-secondary mt-1">
          {t(locale as any, "settings.defaultLanguageDesc")}
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLang(lang.code)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] border transition-all text-left",
                selectedLang === lang.code
                  ? "border-accent bg-accent/5 ring-2 ring-accent/20"
                  : "border-border hover:border-border-hover"
              )}
            >
              <Flag code={lang.code} />
              <span className="text-[13px] font-medium text-text-primary">{lang.label}</span>
              {selectedLang === lang.code && (
                <svg className="w-4 h-4 text-accent ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveButton isPending={isPending} label={t(locale as any, "common.save")} savingLabel={t(locale as any, "common.saving")} />
      </div>
    </form>
  );
}

// ─── Branding Tab ─────────────────────────────────────────
function BrandingTab({
  settings,
  showToast,
  locale,
}: {
  settings: SettingsData;
  showToast: (msg: string) => void;
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedColor, setSelectedColor] = useState(settings?.accentColor ?? "#4f6ef7");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("accentColor", selectedColor);

    startTransition(async () => {
      const result = await updateBranding(formData);
      if (result.success) {
        showToast(t(locale as any, "settings.successBranding"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <SectionTitle>{t(locale as any, "settings.accentColor")}</SectionTitle>
        <p className="text-[13px] text-text-secondary mt-1">
          {t(locale as any, "settings.accentColorDesc")}
        </p>
        <div className="mt-5 flex items-center gap-3">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              title={color.label}
              onClick={() => setSelectedColor(color.value)}
              className={cn(
                "w-9 h-9 rounded-full transition-all shrink-0",
                selectedColor === color.value
                  ? "ring-2 ring-offset-2 ring-offset-surface scale-110"
                  : "hover:scale-105"
              )}
              style={{
                backgroundColor: color.value,
                boxShadow:
                  selectedColor === color.value
                    ? `0 0 0 2px var(--surface), 0 0 0 4px ${color.value}`
                    : undefined,
              }}
            />
          ))}
        </div>

        <div className="mt-6">
          <Label>{t(locale as any, "settings.preview")}</Label>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              className="h-10 px-6 rounded-[var(--radius-md)] text-white text-[13px] font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: selectedColor }}
            >
              {t(locale as any, "settings.sampleButton")}
            </button>
            <span
              className="text-[13px] font-medium"
              style={{ color: selectedColor }}
            >
              Accent Text
            </span>
            <div
              className="h-2 w-20 rounded-full"
              style={{ backgroundColor: selectedColor, opacity: 0.2 }}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveButton isPending={isPending} label={t(locale as any, "common.save")} savingLabel={t(locale as any, "common.saving")} />
      </div>
    </form>
  );
}

// ─── Receipt Tab ──────────────────────────────────────────
function ReceiptTab({
  settings,
  showToast,
  locale,
}: {
  settings: SettingsData;
  showToast: (msg: string) => void;
  locale: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [receiptShowAddress, setReceiptShowAddress] = useState(settings?.receiptShowAddress ?? true);
  const [receiptShowPhone, setReceiptShowPhone] = useState(settings?.receiptShowPhone ?? true);
  const [receiptShowTax, setReceiptShowTax] = useState(settings?.receiptShowTax ?? false);
  const [headerText, setHeaderText] = useState(settings?.receiptHeader ?? "");
  const [footerText, setFooterText] = useState(settings?.receiptFooter ?? "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("receiptHeader", headerText);
    formData.set("receiptFooter", footerText);
    formData.set("receiptShowAddress", String(receiptShowAddress));
    formData.set("receiptShowPhone", String(receiptShowPhone));
    formData.set("receiptShowTax", String(receiptShowTax));

    startTransition(async () => {
      const result = await updateReceiptSettings(formData);
      if (result.success) {
        showToast(t(locale as any, "settings.successReceipt"));
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <SectionTitle>{t(locale as any, "settings.receiptContent")}</SectionTitle>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="receiptHeader">{t(locale as any, "settings.receiptHeaderLabel")}</Label>
            <input
              id="receiptHeader"
              name="receiptHeader"
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="Text shown at top of receipt"
              className={cn(
                "h-10 w-full px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary",
                "placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              )}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="receiptFooter">{t(locale as any, "settings.receiptFooterLabel")}</Label>
            <textarea
              id="receiptFooter"
              name="receiptFooter"
              rows={3}
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="Thank you for your purchase!"
              className={cn(
                "w-full px-3 py-2.5 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary",
                "placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
              )}
            />
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>{t(locale as any, "settings.displayOptions")}</SectionTitle>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-medium text-text-primary">{t(locale as any, "settings.showAddressOnReceipt")}</div>
              <div className="text-[12px] text-text-secondary">{t(locale as any, "settings.showAddressOnReceiptDesc")}</div>
            </div>
            <Toggle checked={receiptShowAddress} onChange={setReceiptShowAddress} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-medium text-text-primary">{t(locale as any, "settings.showPhoneOnReceipt")}</div>
              <div className="text-[12px] text-text-secondary">{t(locale as any, "settings.showPhoneOnReceiptDesc")}</div>
            </div>
            <Toggle checked={receiptShowPhone} onChange={setReceiptShowPhone} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-medium text-text-primary">{t(locale as any, "settings.showTaxOnReceipt")}</div>
              <div className="text-[12px] text-text-secondary">{t(locale as any, "settings.showTaxOnReceiptDesc")}</div>
            </div>
            <Toggle checked={receiptShowTax} onChange={setReceiptShowTax} />
          </div>
        </div>
      </Card>

      {/* Receipt Preview */}
      <Card className="max-w-sm">
        <SectionTitle>{t(locale as any, "settings.receiptPreview")}</SectionTitle>
        <div className="mt-4 bg-white border border-border rounded-[var(--radius-md)] p-5 font-mono text-[11px] text-gray-800 leading-relaxed">
          {/* Header */}
          <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
            <div className="font-bold text-[13px]">
              {settings?.shopName || "Shop Name"}
            </div>
            {receiptShowAddress && (
              <div className="mt-0.5 text-gray-500">
                {settings?.address || "123 Shop Street, Macau"}
              </div>
            )}
            {receiptShowPhone && (
              <div className="text-gray-500">
                {settings?.phone || "+853 2888 8888"}
              </div>
            )}
            {headerText && (
              <div className="mt-1 text-gray-600">{headerText}</div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-1 border-b border-dashed border-gray-300 pb-3 mb-3">
            <div className="flex justify-between">
              <span>Coffee x1</span>
              <span>$38.00</span>
            </div>
            <div className="flex justify-between">
              <span>Sandwich x2</span>
              <span>$56.00</span>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>$94.00</span>
            </div>
            {receiptShowTax && (
              <div className="flex justify-between text-gray-500">
                <span>Tax ({settings?.taxRate ?? "0"}%)</span>
                <span>$0.00</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[12px] pt-1 border-t border-gray-200">
              <span>Total</span>
              <span>$94.00</span>
            </div>
          </div>

          {/* Footer */}
          {footerText && (
            <div className="mt-3 pt-3 border-t border-dashed border-gray-300 text-center text-gray-500">
              {footerText}
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-end">
        <SaveButton isPending={isPending} label={t(locale as any, "common.save")} savingLabel={t(locale as any, "common.saving")} />
      </div>
    </form>
  );
}
