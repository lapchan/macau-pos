"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { cn } from "@/lib/cn";
import {
  updateLocationInfo,
  updateLocationHours,
  updateLocationPayments,
  updateLocationReceipt,
} from "@/lib/location-actions";
import { updateLocationStrategy } from "@/lib/pricing-strategy-actions";
import {
  ArrowLeft,
  MapPin,
  Clock,
  CreditCard,
  Receipt,
  DollarSign,
  Check,
  Printer,
} from "lucide-react";
import type { Location } from "@macau-pos/database";
import type { LocationSettings } from "@/lib/location-queries";
import type { StrategyRow } from "@/lib/pricing-strategy-queries";

// ─── Types ──────────────────────────────────────────────────

type Tab = "details" | "hours" | "payments" | "receipt" | "pricing";

type BusinessHour = {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
};

interface LocationDetailClientProps {
  location: Location;
  settings: LocationSettings;
  strategies: StrategyRow[];
}

// ─── Constants ──────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: typeof MapPin }[] = [
  { id: "details", label: "Location Details", icon: MapPin },
  { id: "hours", label: "Business Hours", icon: Clock },
  { id: "payments", label: "Payment Methods", icon: CreditCard },
  { id: "receipt", label: "Receipt", icon: Receipt },
  { id: "pricing", label: "Pricing Strategy", icon: DollarSign },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_HOURS: BusinessHour[] = DAYS.map((day) => ({
  day,
  open: "09:00",
  close: "22:00",
  isClosed: false,
}));

// ─── Shared UI ──────────────────────────────────────────────

function SectionCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-lg)] overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
        {description && <p className="text-[13px] text-text-tertiary mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-text-primary">
      {children}
    </label>
  );
}

function Input({
  id, name, defaultValue, placeholder, type = "text", disabled, className,
}: {
  id?: string; name: string; defaultValue?: string; placeholder?: string;
  type?: string; disabled?: boolean; className?: string;
}) {
  return (
    <input
      id={id} name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} disabled={disabled}
      className={cn(
        "h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary",
        "placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        checked ? "bg-accent" : "bg-border"
      )}
    >
      <span className={cn(
        "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
        checked ? "translate-x-[18px]" : "translate-x-[3px]"
      )} />
    </button>
  );
}

function SaveButton({ isPending }: { isPending: boolean }) {
  return (
    <button
      type="submit" disabled={isPending}
      className={cn(
        "h-10 px-6 rounded-[var(--radius-md)] bg-accent text-white text-[13px] font-medium",
        "hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {isPending ? "Saving..." : "Save Changes"}
    </button>
  );
}

function SuccessToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-md)] shadow-lg">
        <Check className="h-4 w-4 text-emerald-600" />
        <span className="text-[13px] font-medium text-emerald-700">{message}</span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function LocationDetailClient({ location, settings, strategies }: LocationDetailClientProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("details");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  // Business hours state
  const rawHours = settings?.businessHours;
  const initialHours: BusinessHour[] = Array.isArray(rawHours) && rawHours.length > 0 ? (rawHours as BusinessHour[]) : DEFAULT_HOURS;
  const [hours, setHours] = useState<BusinessHour[]>(initialHours);

  // Payment toggles state
  const [payments, setPayments] = useState({
    paymentCash: settings?.paymentCash ?? true,
    paymentCard: settings?.paymentCard ?? false,
    paymentMpay: settings?.paymentMpay ?? false,
    paymentAlipay: settings?.paymentAlipay ?? false,
    paymentWechat: settings?.paymentWechat ?? false,
  });

  // Receipt toggles state
  const [receipt, setReceipt] = useState({
    receiptShowAddress: settings?.receiptShowAddress ?? true,
    receiptShowPhone: settings?.receiptShowPhone ?? true,
    receiptShowTax: settings?.receiptShowTax ?? true,
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSubmit(action: (fd: FormData) => Promise<{ success: boolean; error?: string }>) {
    return (formData: FormData) => {
      startTransition(async () => {
        const result = await action(formData);
        if (result.success) {
          showToast("Changes saved successfully");
          router.refresh();
        }
      });
    };
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/locations"
          className="inline-flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t(locale, "locations.title")}
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <MapPin className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{location.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-text-tertiary font-mono">{location.code}</span>
              {location.isDefault && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                  Default
                </span>
              )}
              <span className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded",
                location.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
              )}>
                {location.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="ml-auto">
            <Link
              href={`/locations/${location.id}/printer`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-text-secondary bg-surface border border-border rounded-[var(--radius-md)] hover:bg-surface-subtle transition-colors"
            >
              <Printer className="h-4 w-4" />
              Network Printer
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors",
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "details" && (
        <form action={handleSubmit(updateLocationInfo)} className="space-y-6">
          <input type="hidden" name="id" value={location.id} />

          <SectionCard title="Basic Information" description="Help customers recognize your store location.">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Location Name *</Label>
                <Input id="name" name="name" defaultValue={location.name} placeholder="e.g. Main Store" className="w-full mt-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" defaultValue={location.slug} disabled className="w-full mt-1" />
                  <p className="text-[11px] text-text-tertiary mt-1">URL identifier (cannot be changed)</p>
                </div>
                <div>
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" defaultValue={location.code} disabled className="w-full mt-1" />
                  <p className="text-[11px] text-text-tertiary mt-1">Auto-generated location code</p>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Business Address">
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={location.address ?? ""} placeholder="Street address" className="w-full mt-1" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Contact Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={location.phone ?? ""} placeholder="+853 2800 0000" className="w-full mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={location.email ?? ""} placeholder="store@example.mo" className="w-full mt-1" />
              </div>
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <SaveButton isPending={isPending} />
          </div>
        </form>
      )}

      {tab === "hours" && (
        <form
          action={(formData) => {
            formData.set("businessHours", JSON.stringify(hours));
            handleSubmit(updateLocationHours)(formData);
          }}
          className="space-y-6"
        >
          <input type="hidden" name="id" value={location.id} />

          <SectionCard title="Business Hours" description="Let your clients know when you're open.">
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-[auto_1fr_100px_100px] md:grid-cols-[auto_1fr_140px_140px] gap-3 items-center text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                <span className="w-5" />
                <span>Day</span>
                <span>Open</span>
                <span>Close</span>
              </div>

              {hours.map((h, i) => (
                <div
                  key={h.day}
                  className={cn(
                    "grid grid-cols-[auto_1fr_100px_100px] md:grid-cols-[auto_1fr_140px_140px] gap-3 items-center py-2",
                    i < hours.length - 1 && "border-b border-border/50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={!h.isClosed}
                    onChange={() => {
                      const next = [...hours];
                      next[i] = { ...h, isClosed: !h.isClosed };
                      setHours(next);
                    }}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent/30"
                  />
                  <span className={cn(
                    "text-[14px] font-medium",
                    h.isClosed ? "text-text-tertiary" : "text-text-primary"
                  )}>
                    {h.day}
                  </span>
                  <input
                    type="time"
                    value={h.open}
                    disabled={h.isClosed}
                    onChange={(e) => {
                      const next = [...hours];
                      next[i] = { ...h, open: e.target.value };
                      setHours(next);
                    }}
                    className={cn(
                      "h-9 px-2 text-[13px] border border-border rounded-[var(--radius-md)] bg-background",
                      "focus:outline-none focus:ring-2 focus:ring-accent/30",
                      h.isClosed && "opacity-40 cursor-not-allowed bg-surface-hover"
                    )}
                  />
                  <input
                    type="time"
                    value={h.close}
                    disabled={h.isClosed}
                    onChange={(e) => {
                      const next = [...hours];
                      next[i] = { ...h, close: e.target.value };
                      setHours(next);
                    }}
                    className={cn(
                      "h-9 px-2 text-[13px] border border-border rounded-[var(--radius-md)] bg-background",
                      "focus:outline-none focus:ring-2 focus:ring-accent/30",
                      h.isClosed && "opacity-40 cursor-not-allowed bg-surface-hover"
                    )}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <SaveButton isPending={isPending} />
          </div>
        </form>
      )}

      {tab === "payments" && (
        <form
          action={(formData) => {
            Object.entries(payments).forEach(([key, val]) => {
              formData.set(key, String(val));
            });
            handleSubmit(updateLocationPayments)(formData);
          }}
          className="space-y-6"
        >
          <input type="hidden" name="id" value={location.id} />

          <SectionCard title="Payment Methods" description="Configure which payment methods this location accepts.">
            <div className="space-y-4">
              {([
                { key: "paymentCash", label: "Cash", desc: "Accept cash payments" },
                { key: "paymentCard", label: "Credit / Debit Card", desc: "Accept card payments via terminal" },
                { key: "paymentMpay", label: "MPay", desc: "Accept MPay mobile payments" },
                { key: "paymentAlipay", label: "Alipay", desc: "Accept Alipay QR code payments" },
                { key: "paymentWechat", label: "WeChat Pay", desc: "Accept WeChat Pay QR code payments" },
              ] as const).map((pm) => (
                <div
                  key={pm.key}
                  className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                >
                  <div>
                    <p className="text-[14px] font-medium text-text-primary">{pm.label}</p>
                    <p className="text-[12px] text-text-tertiary mt-0.5">{pm.desc}</p>
                  </div>
                  <Toggle
                    checked={payments[pm.key]}
                    onChange={(checked) => setPayments((p) => ({ ...p, [pm.key]: checked }))}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <SaveButton isPending={isPending} />
          </div>
        </form>
      )}

      {tab === "receipt" && (
        <form
          action={(formData) => {
            formData.set("receiptShowAddress", String(receipt.receiptShowAddress));
            formData.set("receiptShowPhone", String(receipt.receiptShowPhone));
            formData.set("receiptShowTax", String(receipt.receiptShowTax));
            handleSubmit(updateLocationReceipt)(formData);
          }}
          className="space-y-6"
        >
          <input type="hidden" name="id" value={location.id} />

          <SectionCard title="Receipt Content" description="Customize what appears on receipts for this location.">
            <div className="space-y-4">
              <div>
                <Label htmlFor="receiptHeader">Receipt Header</Label>
                <textarea
                  id="receiptHeader" name="receiptHeader" rows={2}
                  defaultValue={settings?.receiptHeader ?? ""}
                  placeholder="Thank you for shopping with us!"
                  className={cn(
                    "w-full mt-1 px-3 py-2.5 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary",
                    "placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
                  )}
                />
              </div>
              <div>
                <Label htmlFor="receiptFooter">Receipt Footer</Label>
                <textarea
                  id="receiptFooter" name="receiptFooter" rows={2}
                  defaultValue={settings?.receiptFooter ?? ""}
                  placeholder="Please come again!"
                  className={cn(
                    "w-full mt-1 px-3 py-2.5 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary",
                    "placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
                  )}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Receipt Display Options">
            <div className="space-y-4">
              {([
                { key: "receiptShowAddress", label: "Show address on receipt", desc: "Display this location's address" },
                { key: "receiptShowPhone", label: "Show phone on receipt", desc: "Display this location's phone number" },
                { key: "receiptShowTax", label: "Show tax on receipt", desc: "Display tax breakdown on receipt" },
              ] as const).map((opt) => (
                <div
                  key={opt.key}
                  className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                >
                  <div>
                    <p className="text-[14px] font-medium text-text-primary">{opt.label}</p>
                    <p className="text-[12px] text-text-tertiary mt-0.5">{opt.desc}</p>
                  </div>
                  <Toggle
                    checked={receipt[opt.key]}
                    onChange={(checked) => setReceipt((r) => ({ ...r, [opt.key]: checked }))}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <SaveButton isPending={isPending} />
          </div>
        </form>
      )}

      {tab === "pricing" && (
        <div className="space-y-6">
          <form
            action={(formData) => {
              formData.set("locationId", location.id);
              startTransition(async () => {
                const result = await updateLocationStrategy(formData);
                if (result.success) {
                  showToast("Pricing strategy updated");
                  router.refresh();
                }
              });
            }}
            className="space-y-6"
          >
            <SectionCard
              title="Pricing Strategy"
              description="Assign a pricing strategy to control product prices and availability at this location."
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="strategyId">Active Strategy</Label>
                  <select
                    id="strategyId"
                    name="strategyId"
                    defaultValue={location.pricingStrategyId ?? ""}
                    className={cn(
                      "w-full mt-1 h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    )}
                  >
                    <option value="">None (use catalog defaults)</option>
                    {strategies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.itemCount} overrides)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-text-tertiary mt-1.5">
                    Products without overrides in the strategy will use their catalog default prices.
                  </p>
                </div>

                {location.pricingStrategyId && (
                  <div className="pt-2">
                    <Link
                      href={`/pricing-strategies/${location.pricingStrategyId}`}
                      className="text-[13px] text-accent hover:underline font-medium"
                    >
                      Manage strategy overrides →
                    </Link>
                  </div>
                )}
              </div>
            </SectionCard>

            <div className="flex justify-end">
              <SaveButton isPending={isPending} />
            </div>
          </form>
        </div>
      )}

      <SuccessToast message={toast} />
    </div>
  );
}
