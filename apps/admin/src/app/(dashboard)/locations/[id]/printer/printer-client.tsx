"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Printer,
  KeyRound,
  RefreshCw,
  Check,
  AlertTriangle,
  XCircle,
  Power,
  Wrench,
  Copy,
} from "lucide-react";

import { cn } from "@/lib/cn";
import type {
  LocationPrinterSettings,
  PrinterDriver,
  PrinterCodePage,
  PrinterLocationStatus,
} from "@macau-pos/database";
import {
  updateLocationPrinterSettings,
  rotateLocationPrinterToken,
  testLocationPrinter,
  setLocationPrinterStatus,
  devSeedLocationPrinter,
  type PrinterHealthSummary,
  type PrinterConfigPatch,
} from "@/lib/printer-actions";

type Props = {
  locationId: string;
  locationName: string;
  locationSlug: string;
  initialRow: LocationPrinterSettings | null;
  initialHealth: PrinterHealthSummary | null;
};

const DRIVERS: PrinterDriver[] = ["generic", "star", "epson", "custom"];
const CODE_PAGES: PrinterCodePage[] = ["cp437", "gb18030", "big5", "shift_jis"];
const STATUSES: PrinterLocationStatus[] = ["enabled", "maintenance", "disabled"];

const CODE_PAGE_LABEL: Record<PrinterCodePage, string> = {
  cp437: "CP437 (ASCII)",
  gb18030: "GB18030 (Simplified Chinese)",
  big5: "Big5 (Traditional Chinese)",
  shift_jis: "Shift_JIS (Japanese)",
};

export default function PrinterClient({
  locationId,
  locationName,
  initialRow,
  initialHealth,
}: Props) {
  return (
    <div className="min-h-screen bg-surface-subtle">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Header locationId={locationId} locationName={locationName} />
        {initialRow && initialHealth ? (
          <ProvisionedView
            locationId={locationId}
            initialRow={initialRow}
            initialHealth={initialHealth}
          />
        ) : (
          <UnprovisionedView locationId={locationId} />
        )}
      </div>
    </div>
  );
}

function Header({
  locationId,
  locationName,
}: {
  locationId: string;
  locationName: string;
}) {
  return (
    <div className="mb-6">
      <Link
        href={`/locations/${locationId}`}
        className="inline-flex items-center gap-1 text-[13px] text-text-tertiary hover:text-text-primary transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to location
      </Link>
      <div className="flex items-center gap-3">
        <Printer className="w-6 h-6 text-text-secondary" />
        <div>
          <h1 className="text-[20px] font-semibold text-text-primary">
            Network Printer
          </h1>
          <p className="text-[13px] text-text-tertiary">{locationName}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Unprovisioned view ───────────────────────────────────

function UnprovisionedView({ locationId }: { locationId: string }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [seed, setSeed] = useState<{ rawToken: string; endpointUrl: string } | null>(
    null,
  );

  const isProd = process.env.NODE_ENV === "production";

  return (
    <div className="space-y-4">
      <SectionCard
        title="No printer configured"
        description="Provisioning opens a Cloudflare tunnel, creates DNS, and stores the bearer token. Available once sub-phase I ships."
      >
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center px-4 py-2 bg-text-primary/30 text-surface rounded-[var(--radius-md)] text-[13px] font-medium cursor-not-allowed"
          >
            Provision network printer
          </button>
          <p className="text-[12px] text-text-tertiary">
            Sub-phase I will wire the Cloudflare API + bootstrap JWT. For now,
            admins can seed a stub row in dev to exercise the heartbeat loop.
          </p>
        </div>
      </SectionCard>

      {!isProd && (
        <SectionCard
          title="Dev seed"
          description="Creates a local-only row pointing at 127.0.0.1 so the bridge can heartbeat without Cloudflare."
        >
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setErr(null);
                startTransition(async () => {
                  const r = await devSeedLocationPrinter(locationId);
                  if (!r.ok) {
                    setErr(r.message ?? r.error);
                    return;
                  }
                  setSeed({ rawToken: r.rawToken, endpointUrl: r.endpointUrl });
                  router.refresh();
                });
              }}
              className="inline-flex items-center justify-center px-4 py-2 bg-text-primary text-surface rounded-[var(--radius-md)] text-[13px] font-medium disabled:opacity-50"
            >
              {busy ? "Seeding..." : "Seed dev row"}
            </button>
            {err && <ErrorLine message={err} />}
            {seed && (
              <TokenReveal
                title="Raw bearer token (shown once)"
                token={seed.rawToken}
                context={`Endpoint: ${seed.endpointUrl}`}
              />
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Provisioned view ─────────────────────────────────────

function ProvisionedView({
  locationId,
  initialRow,
  initialHealth,
}: {
  locationId: string;
  initialRow: LocationPrinterSettings;
  initialHealth: PrinterHealthSummary;
}) {
  return (
    <div className="space-y-4">
      <StatusCard health={initialHealth} row={initialRow} />
      <ConfigForm locationId={locationId} row={initialRow} />
      <ActionsCard locationId={locationId} row={initialRow} health={initialHealth} />
      <DangerZone locationId={locationId} row={initialRow} />
    </div>
  );
}

// ─── Status ───────────────────────────────────────────────

function StatusCard({
  health,
  row,
}: {
  health: PrinterHealthSummary;
  row: LocationPrinterSettings;
}) {
  const badge = alertBadge(health.alertLevel);
  const lastSeen =
    health.lastSeenAt
      ? `${health.lastSeenAt.toLocaleString()} (${formatAge(health.lastSeenAgeSec)})`
      : "never";

  return (
    <SectionCard title="Status">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Row label="State">
            <StatePill status={row.status} />
          </Row>
          <Row label="Health">
            <span className={cn("inline-flex items-center gap-1.5", badge.className)}>
              {badge.icon}
              {badge.label}
            </span>
          </Row>
          <Row label="Printer">
            <span className="text-[13px] text-text-primary">
              {row.printerStatus}
              {row.lastError ? ` — ${row.lastError}` : ""}
            </span>
          </Row>
          <Row label="Last heartbeat">
            <span className="text-[13px] text-text-primary">{lastSeen}</span>
          </Row>
          <Row label="Bridge">
            <span className="text-[13px] text-text-primary font-mono">
              {row.bridgeVersion ?? "unknown"}
            </span>
          </Row>
          <Row label="Model">
            <span className="text-[13px] text-text-primary">
              {row.lastPrinterModel ?? "—"}
            </span>
          </Row>
          <Row label="Jobs">
            <span className="text-[13px] text-text-primary">
              {row.jobsServedTotal.toLocaleString()}
            </span>
          </Row>
          <Row label="Endpoint">
            <span className="text-[12px] text-text-tertiary font-mono">
              {row.endpointUrl}
            </span>
          </Row>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Config form ──────────────────────────────────────────

function ConfigForm({
  locationId,
  row,
}: {
  locationId: string;
  row: LocationPrinterSettings;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<PrinterConfigPatch>({});
  const [busy, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const merged = {
    driver: draft.driver ?? row.driver,
    paperWidth: (draft.paperWidth ?? row.paperWidth) as 58 | 80,
    codePage: draft.codePage ?? row.codePage,
    defaultCopies: draft.defaultCopies ?? row.defaultCopies,
    cashDrawerEnabled: draft.cashDrawerEnabled ?? row.cashDrawerEnabled,
  };

  const dirty = Object.keys(draft).length > 0;

  const onSave = () => {
    setErr(null);
    setSaved(false);
    startTransition(async () => {
      const r = await updateLocationPrinterSettings(locationId, draft);
      if (!r.ok) {
        setErr(r.message ?? r.error);
        return;
      }
      setDraft({});
      setSaved(true);
      router.refresh();
    });
  };

  return (
    <SectionCard
      title="Configuration"
      description="Changes enqueue a reload_config command; the bridge applies on its next heartbeat (≤ 60s)."
    >
      <div className="space-y-4">
        <FormRow label="Driver">
          <select
            value={merged.driver}
            disabled={busy}
            onChange={(e) =>
              setDraft((d) => ({ ...d, driver: e.target.value as PrinterDriver }))
            }
            className="input"
          >
            {DRIVERS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="Paper width">
          <select
            value={String(merged.paperWidth)}
            disabled={busy}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                paperWidth: Number(e.target.value) as 58 | 80,
              }))
            }
            className="input"
          >
            <option value="58">58 mm</option>
            <option value="80">80 mm</option>
          </select>
        </FormRow>
        <FormRow label="Code page">
          <select
            value={merged.codePage}
            disabled={busy}
            onChange={(e) =>
              setDraft((d) => ({ ...d, codePage: e.target.value as PrinterCodePage }))
            }
            className="input"
          >
            {CODE_PAGES.map((v) => (
              <option key={v} value={v}>
                {CODE_PAGE_LABEL[v]}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="Default copies">
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            value={merged.defaultCopies}
            disabled={busy}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                defaultCopies: Math.max(1, Math.min(10, Number(e.target.value) || 1)),
              }))
            }
            className="input w-24"
          />
        </FormRow>
        <FormRow label="Cash drawer">
          <label className="inline-flex items-center gap-2 text-[13px] text-text-primary">
            <input
              type="checkbox"
              checked={merged.cashDrawerEnabled}
              disabled={busy}
              onChange={(e) =>
                setDraft((d) => ({ ...d, cashDrawerEnabled: e.target.checked }))
              }
            />
            Kick on every print
          </label>
        </FormRow>

        <div className="flex items-center gap-3 pt-2 border-t border-border">
          <button
            type="button"
            disabled={busy || !dirty}
            onClick={onSave}
            className="px-4 py-2 bg-text-primary text-surface rounded-[var(--radius-md)] text-[13px] font-medium disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save config"}
          </button>
          {dirty && !busy && (
            <button
              type="button"
              onClick={() => {
                setDraft({});
                setErr(null);
                setSaved(false);
              }}
              className="text-[13px] text-text-tertiary hover:text-text-primary"
            >
              Reset
            </button>
          )}
          {saved && (
            <span className="inline-flex items-center gap-1 text-[12px] text-emerald-600">
              <Check className="w-3.5 h-3.5" />
              Saved — bridge will reload on next heartbeat
            </span>
          )}
          {err && <ErrorLine message={err} />}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Actions (test + rotate) ──────────────────────────────

function ActionsCard({
  locationId,
  row,
  health,
}: {
  locationId: string;
  row: LocationPrinterSettings;
  health: PrinterHealthSummary;
}) {
  const router = useRouter();
  const [testBusy, startTest] = useTransition();
  const [rotateBusy, startRotate] = useTransition();
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [rotateErr, setRotateErr] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [overlapUntil, setOverlapUntil] = useState<Date | null>(null);

  const rotationPending = !!row.pendingTokenHash;

  return (
    <SectionCard title="Actions">
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            disabled={testBusy}
            onClick={() => {
              setTestMsg(null);
              startTest(async () => {
                const r = await testLocationPrinter(locationId);
                if (r.ok) {
                  setTestMsg({
                    ok: true,
                    text: `Connected. Last heartbeat ${formatAge(Math.floor((Date.now() - r.lastSeenAt.getTime()) / 1000))} ago.`,
                  });
                } else {
                  setTestMsg({
                    ok: false,
                    text: r.message ?? r.error,
                  });
                }
              });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface border border-border rounded-[var(--radius-md)] text-[13px] font-medium text-text-primary hover:bg-surface-subtle disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", testBusy && "animate-spin")} />
            {testBusy ? "Testing..." : "Test connection"}
          </button>
          <button
            type="button"
            disabled={rotateBusy || rotationPending}
            onClick={() => {
              if (!confirm("Rotate bearer token? The old token stays valid for ~10 minutes while the bridge picks up the new one.")) {
                return;
              }
              setRotateErr(null);
              setNewToken(null);
              startRotate(async () => {
                const r = await rotateLocationPrinterToken(locationId);
                if (!r.ok) {
                  setRotateErr(r.message ?? r.error);
                  return;
                }
                setNewToken(r.rawToken);
                setOverlapUntil(r.overlapUntil);
                router.refresh();
              });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface border border-border rounded-[var(--radius-md)] text-[13px] font-medium text-text-primary hover:bg-surface-subtle disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            {rotationPending ? "Rotation pending..." : "Rotate token"}
          </button>
        </div>

        {testMsg && (
          <p
            className={cn(
              "text-[12px]",
              testMsg.ok ? "text-emerald-600" : "text-amber-600",
            )}
          >
            {testMsg.text}
          </p>
        )}

        {rotateErr && <ErrorLine message={rotateErr} />}

        {newToken && (
          <TokenReveal
            title="New bearer token"
            token={newToken}
            context={
              overlapUntil
                ? `Old token remains valid until ${overlapUntil.toLocaleString()}. Update the bridge within that window.`
                : undefined
            }
          />
        )}

        {rotationPending && !newToken && (
          <div className="border border-border rounded-[var(--radius-md)] bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            A rotation is already in flight. Current token was shown when it
            was created; rotating again replaces the pending token.
          </div>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Danger zone — status toggle ──────────────────────────

function DangerZone({
  locationId,
  row,
}: {
  locationId: string;
  row: LocationPrinterSettings;
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <SectionCard
      title="Lifecycle"
      description="Disabling returns 410 on the next heartbeat and stops the bridge cleanly."
    >
      <div className="flex items-center gap-2 flex-wrap">
        {STATUSES.map((s) => {
          const active = row.status === s;
          const icon =
            s === "enabled" ? (
              <Power className="w-4 h-4" />
            ) : s === "maintenance" ? (
              <Wrench className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            );
          return (
            <button
              key={s}
              type="button"
              disabled={busy || active}
              onClick={() => {
                if (s === "disabled" && !confirm("Disable printer? The bridge will receive 410 and exit.")) return;
                setErr(null);
                startTransition(async () => {
                  const r = await setLocationPrinterStatus(locationId, s);
                  if (!r.ok) {
                    setErr(r.message ?? r.error);
                    return;
                  }
                  router.refresh();
                });
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-[13px] font-medium border transition-colors",
                active
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface text-text-primary border-border hover:bg-surface-subtle",
                (busy && !active) && "opacity-50",
              )}
            >
              {icon}
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          );
        })}
      </div>
      {err && <div className="mt-3"><ErrorLine message={err} /></div>}
    </SectionCard>
  );
}

// ─── Shared bits ──────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-lg)] overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
        {description && (
          <p className="text-[13px] text-text-tertiary mt-0.5">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 min-h-[28px]">
      <span className="text-[12px] uppercase tracking-wide text-text-tertiary">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-[13px] text-text-primary">{label}</label>
      <div>{children}</div>
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] text-red-600">
      <AlertTriangle className="w-3.5 h-3.5" />
      {message}
    </span>
  );
}

function StatePill({ status }: { status: PrinterLocationStatus }) {
  const map: Record<PrinterLocationStatus, string> = {
    enabled: "bg-emerald-50 text-emerald-700 border-emerald-200",
    maintenance: "bg-amber-50 text-amber-700 border-amber-200",
    disabled: "bg-neutral-100 text-neutral-600 border-neutral-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full border text-[12px] font-medium",
        map[status],
      )}
    >
      {status}
    </span>
  );
}

function alertBadge(level: "ok" | "warning" | "error") {
  if (level === "ok") {
    return {
      label: "Online",
      icon: <Check className="w-3.5 h-3.5" />,
      className: "text-emerald-600 text-[13px]",
    };
  }
  if (level === "warning") {
    return {
      label: "Warning",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      className: "text-amber-600 text-[13px]",
    };
  }
  return {
    label: "Offline",
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: "text-red-600 text-[13px]",
  };
}

function formatAge(seconds: number | null): string {
  if (seconds === null) return "never";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function TokenReveal({
  title,
  token,
  context,
}: {
  title: string;
  token: string;
  context?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="border border-amber-200 bg-amber-50 rounded-[var(--radius-md)] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-amber-900 mb-1">
            {title}
          </div>
          <div className="text-[12px] font-mono break-all text-amber-950">
            {token}
          </div>
          {context && (
            <div className="text-[11px] text-amber-800 mt-2">{context}</div>
          )}
          <div className="text-[11px] text-amber-800 mt-2">
            This value is shown ONCE. Copy it now.
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex items-center gap-1 px-2 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-[var(--radius-sm)] text-[12px] font-medium"
        >
          <Copy className="w-3 h-3" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
