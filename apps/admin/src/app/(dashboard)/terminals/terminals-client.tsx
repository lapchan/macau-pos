"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import BottomSheet from "@/components/shared/bottom-sheet";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { QRCodeSVG } from "qrcode.react";
import { interpolate } from "@macau-pos/i18n";
import {
  createTerminal,
  deleteTerminal,
  setTerminalStatus,
  regenerateActivationCode,
  unlinkTerminal,
  refreshTerminals,
} from "@/lib/terminal-actions";
import {
  Plus,
  Wifi,
  WifiOff,
  Wrench,
  Monitor,
  DollarSign,
  User,
  Package,
  Clock,
  MoreHorizontal,
  Power,
  PowerOff,
  RefreshCw,
  Trash2,
  X,
  Copy,
  Check,
  Search,
  ChevronDown,
  KeyRound,
  Unplug,
  Unlink,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

type ActiveShift = {
  shiftId: string;
  shiftCashier: string;
  shiftOpenedAt: Date;
  shiftOrders: number;
  shiftSales: number;
};

type TerminalRow = {
  id: string;
  name: string;
  code: string;
  location: string | null;
  status: "active" | "disabled" | "maintenance";
  lastHeartbeatAt: Date | null;
  activatedAt: Date | null;
  currentUserName: string | null;
  todayOrders: number;
  todayRevenue: number;
  notes: string | null;
  activationCode: string | null;
  activeShift: ActiveShift | null;
};

type TerminalSummary = {
  total: number;
  online: number;
  offline: number;
  disabled: number;
  maintenance: number;
};

type LocationOption = {
  id: string;
  name: string;
  code: string;
};

type Props = {
  terminals: TerminalRow[];
  summary: TerminalSummary;
  locations: LocationOption[];
};

// ─── Helpers ──────────────────────────────────────────────────

function isOnline(lastHeartbeatAt: Date | null): boolean {
  if (!lastHeartbeatAt) return false;
  return Date.now() - new Date(lastHeartbeatAt).getTime() < 3 * 60 * 1000;
}

type DisplayStatus = "online" | "offline" | "unpaired" | "disabled" | "maintenance";

function getDisplayStatus(
  status: "active" | "disabled" | "maintenance",
  lastHeartbeatAt: Date | null,
  activatedAt?: Date | null
): DisplayStatus {
  if (status === "disabled") return "disabled";
  if (status === "maintenance") return "maintenance";
  if (!activatedAt) return "unpaired";
  return isOnline(lastHeartbeatAt) ? "online" : "offline";
}

const statusConfig: Record<
  DisplayStatus,
  {
    label: string;
    labelKey: string;
    color: string;
    bg: string;
    badgeBg: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }
> = {
  online: {
    label: "Online",
    labelKey: "terminals.statusOnline",
    color: "text-success",
    bg: "bg-success",
    badgeBg: "bg-success-light",
    icon: Wifi,
  },
  offline: {
    label: "Offline",
    labelKey: "terminals.statusOffline",
    color: "text-danger",
    bg: "bg-danger",
    badgeBg: "bg-danger-light",
    icon: WifiOff,
  },
  unpaired: {
    label: "Not Paired",
    labelKey: "terminals.statusUnpaired",
    color: "text-warning",
    bg: "bg-warning",
    badgeBg: "bg-warning-light",
    icon: Unlink,
  },
  disabled: {
    label: "Disabled",
    labelKey: "terminals.statusDisabled",
    color: "text-text-tertiary",
    bg: "bg-text-tertiary",
    badgeBg: "bg-surface-hover",
    icon: PowerOff,
  },
  maintenance: {
    label: "Maintenance",
    labelKey: "terminals.statusMaintenance",
    color: "text-warning",
    bg: "bg-warning",
    badgeBg: "bg-warning-light",
    icon: Wrench,
  },
};

// ─── Summary Badges ───────────────────────────────────────────

const summaryItems: {
  key: keyof TerminalSummary;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  bg: string;
  color: string;
  labelKey: string;
  fallbackLabel: string;
}[] = [
  { key: "online", icon: Wifi, bg: "bg-success-light", color: "text-success", labelKey: "terminals.statusOnline", fallbackLabel: "Online" },
  { key: "offline", icon: WifiOff, bg: "bg-danger-light", color: "text-danger", labelKey: "terminals.statusOffline", fallbackLabel: "Offline" },
  { key: "disabled", icon: PowerOff, bg: "bg-surface-hover", color: "text-text-secondary", labelKey: "terminals.statusDisabled", fallbackLabel: "Disabled" },
  { key: "total", icon: Monitor, bg: "bg-surface-hover", color: "text-text-primary", labelKey: "terminals.total", fallbackLabel: "Total" },
];

// ─── Delete Confirmation Dialog ───────────────────────────────

function UnlinkConfirmDialog({
  open,
  onClose,
  onConfirm,
  terminalName,
  isPending,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  terminalName: string;
  isPending: boolean;
  locale: import("@macau-pos/i18n").Locale;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !isPending) onClose();
    };
    if (open) {
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [open, isPending, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={isPending ? undefined : onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[360px] bg-surface rounded-[var(--radius-lg)] border border-border shadow-2xl p-5">
          <div className="flex justify-center mb-3">
            <div className="h-10 w-10 rounded-full bg-warning-light flex items-center justify-center">
              <Unplug className="h-5 w-5 text-warning" />
            </div>
          </div>
          <p className="text-sm font-medium text-text-primary text-center mb-2">
            {t(locale, "terminals.unlinkConfirm")}
          </p>
          <p className="text-xs text-text-secondary text-center mb-5">
            {interpolate(t(locale, "terminals.unlinkMessage"), { name: terminalName })}
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 h-10 rounded-[var(--radius-md)] border border-border text-[13px] font-medium text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              {t(locale, "common.cancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 h-10 rounded-[var(--radius-md)] bg-warning text-white text-[13px] font-medium hover:bg-warning/90 transition-colors disabled:opacity-50"
            >
              {isPending ? t(locale, "terminals.unlinking") : t(locale, "terminals.unlink")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  terminalName,
  isPending,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  terminalName: string;
  isPending: boolean;
  locale: import("@macau-pos/i18n").Locale;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !isPending) onClose();
    };
    if (open) {
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [open, isPending, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={isPending ? undefined : onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[360px] bg-surface rounded-[var(--radius-lg)] border border-border shadow-2xl p-5">
          <p className="text-sm font-medium text-text-primary text-center mb-2">
            {t(locale, "terminals.removeConfirm")}
          </p>
          <p className="text-xs text-text-secondary text-center mb-5">
            {interpolate(t(locale, "terminals.removeMessage"), { name: terminalName })}
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              disabled={isPending}
              className="flex-1 h-10 rounded-[var(--radius-md)] border border-border text-[13px] font-medium text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
            >
              {t(locale, "common.cancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 h-10 rounded-[var(--radius-md)] bg-danger text-white text-[13px] font-medium hover:bg-danger/90 transition-colors disabled:opacity-50"
            >
              {isPending ? t(locale, "terminals.removing") : t(locale, "terminals.remove")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Activation Code Dialog ───────────────────────────────────

function ActivationCodeDialog({
  open,
  onClose,
  code,
  terminalCode,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  code: string;
  terminalCode?: string;
  locale: import("@macau-pos/i18n").Locale;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    if (open) {
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-surface rounded-[var(--radius-lg)] border border-border shadow-2xl p-6 text-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">
              {terminalCode ? interpolate(t(locale, "terminals.activationCodeFor"), { code: terminalCode }) : t(locale, "terminals.activationCode")}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-text-secondary mb-4">
            {t(locale, "terminals.activationCodeHint")}
          </p>
          <div className="relative inline-flex items-center gap-2 bg-surface-hover border border-border rounded-[var(--radius-md)] px-6 py-4 mb-4">
            <span className="text-3xl font-mono font-bold tracking-[0.3em] text-text-primary select-all">
              {code}
            </span>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface transition-colors"
              title={t(locale, "terminals.copyCode")}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="flex flex-col items-center mb-4">
            <div className="bg-white p-3 rounded-xl border border-border">
              <QRCodeSVG
                value={`https://pos.hkretailai.com/activate?code=${code}`}
                size={160}
                level="M"
              />
            </div>
            <p className="text-[11px] text-text-tertiary mt-2">Scan with iPad camera to activate</p>
          </div>
          <button
            onClick={onClose}
            className="w-full h-10 rounded-[var(--radius-md)] bg-text-primary text-white text-[13px] font-medium hover:opacity-90 transition-colors"
          >
            {t(locale, "common.done")}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Add Terminal Dialog ──────────────────────────────────────

function AddTerminalDialog({
  open,
  onClose,
  locale,
  locations = [],
}: {
  open: boolean;
  onClose: () => void;
  locale: import("@macau-pos/i18n").Locale;
  locations?: LocationOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [createdCode, setCreatedCode] = useState<{
    code: string;
    activationCode: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await createTerminal(formData);
      if (result.success && result.data) {
        setCreatedCode({
          code: result.data.code || "",
          activationCode: result.data.activationCode || "",
        });
        router.refresh();
      } else {
        setError(result.error || "Failed to create terminal");
      }
    });
  };

  const handleCopy = useCallback(() => {
    if (createdCode?.activationCode) {
      navigator.clipboard.writeText(createdCode.activationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [createdCode]);

  const handleClose = useCallback(() => {
    setCreatedCode(null);
    setError(null);
    setCopied(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !isPending) handleClose();
    };
    if (open) {
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [open, isPending, handleClose]);

  return (
    <BottomSheet
      open={open}
      onClose={isPending ? () => {} : handleClose}
      header={
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="h-8 w-8 rounded-[var(--radius-sm)] flex items-center justify-center text-text-tertiary hover:bg-surface-hover transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-[15px] font-semibold text-text-primary">
            {createdCode ? t(locale, "terminals.terminalCreated") : t(locale, "terminals.addTerminal")}
          </h2>
          {createdCode ? (
            <button
              onClick={handleClose}
              className="px-4 py-1.5 text-[13px] font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 transition-all"
            >
              {t(locale, "common.done")}
            </button>
          ) : (
            <button
              type="submit"
              form="add-terminal-form"
              disabled={isPending || locations.length === 0}
              className="px-4 py-1.5 text-[13px] font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {isPending ? t(locale, "terminals.creating") : t(locale, "terminals.createTerminal")}
            </button>
          )}
        </div>
      }
    >
      {createdCode ? (
        /* Success state: show activation code */
        <div className="px-4 py-8 text-center max-w-lg mx-auto">
          <p className="text-xs text-text-secondary mb-1">
            {interpolate(t(locale, "terminals.createdMessage"), { code: createdCode.code })}
          </p>
          <p className="text-xs text-text-secondary mb-5">
            {t(locale, "terminals.enterActivation")}
          </p>
          <div className="relative inline-flex items-center gap-2 bg-surface-hover border border-border rounded-[var(--radius-md)] px-6 py-4">
            <span className="text-3xl font-mono font-bold tracking-[0.3em] text-text-primary select-all">
              {createdCode.activationCode}
            </span>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface transition-colors"
              title={t(locale, "terminals.copyCode")}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Form state */
        <form id="add-terminal-form" action={handleSubmit} className="px-4 py-5 space-y-5 max-w-lg mx-auto">
          {error && (
            <div className="text-xs text-danger bg-danger-light rounded-[var(--radius-sm)] px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="terminal-name" className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "terminals.nameLabel")} <span className="text-danger">*</span>
            </label>
            <input
              id="terminal-name"
              name="name"
              type="text"
              required
              placeholder={t(locale, "terminals.namePlaceholder")}
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label htmlFor="terminal-location" className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "terminals.locationLabel")} <span className="text-danger">*</span>
            </label>
            {locations.length === 0 ? (
              <div className="text-xs text-danger bg-danger-light rounded-[var(--radius-sm)] px-3 py-2.5">
                No locations found. Please <a href="/locations" className="underline font-medium">create a location</a> first.
              </div>
            ) : (
              <select
                id="terminal-location"
                name="locationId"
                required
                defaultValue=""
                className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all appearance-none"
              >
                <option value="" disabled>{t(locale, "terminals.locationPlaceholder")}</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="terminal-notes" className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "terminals.notesLabel")}
            </label>
            <textarea
              id="terminal-notes"
              name="notes"
              rows={2}
              placeholder={t(locale, "terminals.notesPlaceholder")}
              className="w-full px-3 py-2 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all resize-none"
            />
          </div>
        </form>
      )}
    </BottomSheet>
  );
}

// ─── Main Client Component ────────────────────────────────────

export default function TerminalsClient({ terminals, summary, locations = [] }: Props) {
  const { locale } = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | "all">("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [unlinkTarget, setUnlinkTarget] = useState<{ id: string; name: string; code: string } | null>(null);
  const [activationCodeDialog, setActivationCodeDialog] = useState<{
    code: string;
    terminalCode: string;
  } | null>(null);

  // Close menu on Escape
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setMenuOpen(null);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [menuOpen, handleEscape]);

  // ─── Filter terminals ──────────────────────────────────────
  const filtered = terminals.filter((terminal) => {
    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchName = terminal.name.toLowerCase().includes(q);
      const matchCode = terminal.code.toLowerCase().includes(q);
      const matchLocation = terminal.location?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchLocation) return false;
    }
    // Status filter
    if (statusFilter !== "all") {
      const ds = getDisplayStatus(terminal.status, terminal.lastHeartbeatAt, terminal.activatedAt);
      if (ds !== statusFilter) return false;
    }
    return true;
  });

  // ─── Actions ───────────────────────────────────────────────
  const handleSetStatus = (id: string, status: "active" | "disabled" | "maintenance") => {
    setMenuOpen(null);
    startTransition(async () => {
      await setTerminalStatus(id, status);
      router.refresh();
    });
  };

  const handleRegenerateCode = (id: string, terminalCode: string) => {
    setMenuOpen(null);
    startTransition(async () => {
      const result = await regenerateActivationCode(id);
      if (result.success && result.data?.activationCode) {
        setActivationCodeDialog({
          code: result.data.activationCode,
          terminalCode,
        });
      }
      router.refresh();
    });
  };

  const handleUnlink = (id: string, name: string, code: string) => {
    setMenuOpen(null);
    setUnlinkTarget({ id, name, code });
  };

  const handleUnlinkConfirm = () => {
    if (!unlinkTarget) return;
    startTransition(async () => {
      const result = await unlinkTerminal(unlinkTarget.id);
      if (result.success && result.data?.activationCode) {
        setActivationCodeDialog({
          code: result.data.activationCode,
          terminalCode: unlinkTarget.code,
        });
      }
      setUnlinkTarget(null);
      router.refresh();
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteTerminal(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  };

  // ─── Build action menu items for a terminal ────────────────
  function getMenuActions(terminal: TerminalRow) {
    const ds = getDisplayStatus(terminal.status, terminal.lastHeartbeatAt, terminal.activatedAt);
    const actions: {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      onClick: () => void;
      danger?: boolean;
    }[] = [];

    if (ds === "disabled") {
      actions.push({
        icon: Power,
        label: t(locale, "terminals.enable"),
        onClick: () => handleSetStatus(terminal.id, "active"),
      });
    } else {
      actions.push({
        icon: PowerOff,
        label: t(locale, "terminals.disable"),
        onClick: () => handleSetStatus(terminal.id, "disabled"),
      });
    }

    if (terminal.status !== "maintenance") {
      actions.push({
        icon: Wrench,
        label: t(locale, "terminals.statusMaintenance"),
        onClick: () => handleSetStatus(terminal.id, "maintenance"),
      });
    } else {
      actions.push({
        icon: Power,
        label: t(locale, "terminals.enable"),
        onClick: () => handleSetStatus(terminal.id, "active"),
      });
    }

    // Show activation code if terminal has one (not yet paired)
    if (terminal.activationCode) {
      actions.push({
        icon: KeyRound,
        label: t(locale, "terminals.viewCode"),
        onClick: () => {
          setMenuOpen(null);
          setActivationCodeDialog({
            code: terminal.activationCode!,
            terminalCode: terminal.code,
          });
        },
      });
    }

    // Unlink — only for activated (paired) terminals
    if (terminal.activatedAt) {
      actions.push({
        icon: Unplug,
        label: t(locale, "terminals.unlink"),
        onClick: () => handleUnlink(terminal.id, terminal.name, terminal.code),
      });
    }

    actions.push({
      icon: RefreshCw,
      label: t(locale, "terminals.regenerateCode"),
      onClick: () => handleRegenerateCode(terminal.id, terminal.code),
    });

    actions.push({
      icon: Trash2,
      label: t(locale, "terminals.remove"),
      onClick: () => {
        setMenuOpen(null);
        setDeleteTarget({ id: terminal.id, name: terminal.name });
      },
      danger: true,
    });

    return actions;
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <>
      <PageHeader
        title={t(locale, "terminals.title")}
        subtitle={interpolate(t(locale, "terminals.deviceCount"), { count: terminals.length })}
      >
        <button
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          {t(locale, "terminals.addTerminal")}
        </button>
      </PageHeader>

      {/* Summary badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {summaryItems.map((item) => (
          <Card key={item.key}>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-10 w-10 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0",
                  item.bg
                )}
              >
                <item.icon className={cn("h-5 w-5", item.color)} strokeWidth={1.5} />
              </div>
              <div>
                <p className={cn("text-2xl font-semibold tabular-nums", item.color)}>
                  {summary[item.key]}
                </p>
                <p className="text-xs text-text-tertiary">
                  {t(locale, item.labelKey as Parameters<typeof t>[1])}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search + Filter + View toggle bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(locale, "terminals.searchPlaceholder")}
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DisplayStatus | "all")}
            className="h-9 pl-3 pr-8 text-sm bg-surface border border-border rounded-[var(--radius-md)] text-text-secondary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-text-primary/20 focus:border-text-primary transition-colors"
          >
            <option value="all">{t(locale, "terminals.allStatuses")}</option>
            <option value="online">{t(locale, "terminals.statusOnline")}</option>
            <option value="offline">{t(locale, "terminals.statusOffline")}</option>
            <option value="unpaired">{t(locale, "terminals.statusUnpaired")}</option>
            <option value="disabled">{t(locale, "terminals.statusDisabled")}</option>
            <option value="maintenance">{t(locale, "terminals.statusMaintenance")}</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
        </div>
        <button
          onClick={() => startTransition(() => refreshTerminals())}
          disabled={isPending}
          className="h-9 w-9 flex items-center justify-center rounded-[var(--radius-sm)] border border-border text-text-tertiary hover:text-text-secondary hover:bg-surface-hover active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
          title={t(locale, "common.refresh")}
        >
          <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
        </button>
        <div className="flex items-center border border-border rounded-[var(--radius-sm)] overflow-hidden">
          {([
            { key: "grid" as const, label: t(locale, "terminals.viewGrid") },
            { key: "list" as const, label: t(locale, "terminals.viewList") },
          ]).map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                view === v.key
                  ? "bg-text-primary text-white"
                  : "text-text-secondary hover:bg-surface-hover"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal cards grid */}
      {view === "grid" ? (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-300", isPending && "opacity-50 pointer-events-none")}>
          {filtered.map((terminal) => {
            const ds = getDisplayStatus(terminal.status, terminal.lastHeartbeatAt, terminal.activatedAt);
            const cfg = statusConfig[ds];
            const StatusIcon = cfg.icon;
            return (
              <Card key={terminal.id} className="relative group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-11 w-11 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center">
                        <Monitor className="h-6 w-6 text-text-tertiary" strokeWidth={1.5} />
                      </div>
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface",
                          cfg.bg
                        )}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {terminal.name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {terminal.code}{terminal.location ? ` \u00b7 ${terminal.location}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() =>
                        setMenuOpen(menuOpen === terminal.id ? null : terminal.id)
                      }
                      aria-label={interpolate(t(locale, "terminals.actionsFor"), { name: terminal.name })}
                      aria-expanded={menuOpen === terminal.id}
                      className="p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {menuOpen === terminal.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setMenuOpen(null)}
                        />
                        <div role="menu" className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-[var(--radius-md)] shadow-lg z-20 py-1">
                          {getMenuActions(terminal).map((action) => (
                            <button
                              key={action.label}
                              role="menuitem"
                              onClick={action.onClick}
                              disabled={isPending}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors disabled:opacity-50",
                                action.danger
                                  ? "text-danger hover:bg-danger-light"
                                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                              )}
                            >
                              <action.icon className="h-3.5 w-3.5" />
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]",
                      cfg.color,
                      cfg.badgeBg
                    )}
                  >
                    <StatusIcon className="h-3 w-3" strokeWidth={2} />
                    {t(locale, cfg.labelKey as Parameters<typeof t>[1])}
                  </span>
                  {terminal.activationCode && (
                    <button
                      onClick={() =>
                        setActivationCodeDialog({
                          code: terminal.activationCode!,
                          terminalCode: terminal.code,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)] bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors cursor-pointer"
                    >
                      <KeyRound className="h-3 w-3" strokeWidth={2} />
                      {terminal.activationCode}
                    </button>
                  )}
                </div>

                {/* Active shift indicator */}
                {terminal.activeShift && (
                  <div className="flex items-center gap-2 py-2.5 px-3 mt-3 bg-accent/5 border border-accent/15 rounded-[var(--radius-sm)]">
                    <Clock className="h-3.5 w-3.5 text-accent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-accent truncate">
                        {terminal.activeShift.shiftCashier}
                      </p>
                      <p className="text-[10px] text-text-tertiary">
                        {(() => {
                          const mins = Math.floor((Date.now() - new Date(terminal.activeShift!.shiftOpenedAt).getTime()) / 60000);
                          return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
                        })()} · {terminal.activeShift.shiftOrders} {t(locale, "terminals.orders").toLowerCase()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Metrics row — show shift data if active, else today's totals */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-text-tertiary mb-0.5">
                      <DollarSign className="h-3 w-3" />
                      {terminal.activeShift ? t(locale, "terminals.shiftRevenue") : t(locale, "terminals.revenue")}
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-text-primary">
                      {t(locale, "common.mop")} {terminal.activeShift ? terminal.activeShift.shiftSales.toLocaleString() : terminal.todayRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-text-tertiary mb-0.5">
                      <User className="h-3 w-3" />
                      {t(locale, "terminals.cashier")}
                    </div>
                    <p className="text-sm font-medium text-text-secondary truncate">
                      {terminal.activeShift ? terminal.activeShift.shiftCashier : (terminal.currentUserName || "\u2014")}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-text-tertiary mb-0.5">
                      <Package className="h-3 w-3" />
                      {terminal.activeShift ? t(locale, "terminals.shiftOrders") : t(locale, "terminals.orders")}
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-text-primary">
                      {terminal.activeShift ? terminal.activeShift.shiftOrders : terminal.todayOrders}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-text-tertiary">
              {t(locale, "terminals.noResults")}
            </div>
          )}
        </div>
      ) : (
        /* List view */
        <Card padding="none" className={cn("transition-opacity duration-300", isPending && "opacity-50 pointer-events-none")}>
          <table className="w-full text-sm" aria-label={t(locale, "terminals.title")}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {t(locale, "terminals.colTerminal")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {t(locale, "terminals.colStatus")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {t(locale, "terminals.colCashier")}
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {t(locale, "terminals.colOrders")}
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  {t(locale, "terminals.colRevenue")}
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((terminal) => {
                const ds = getDisplayStatus(terminal.status, terminal.lastHeartbeatAt, terminal.activatedAt);
                const cfg = statusConfig[ds];
                return (
                  <tr
                    key={terminal.id}
                    className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-text-primary">{terminal.name}</p>
                        <p className="text-xs text-text-tertiary">
                          {terminal.code}{terminal.location ? ` \u00b7 ${terminal.location}` : ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium",
                          cfg.color
                        )}
                      >
                        <span className={cn("h-2 w-2 rounded-full", cfg.bg)} />
                        {t(locale, cfg.labelKey as Parameters<typeof t>[1])}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {terminal.activeShift ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-accent shrink-0" />
                          <span className="text-accent font-medium truncate">{terminal.activeShift.shiftCashier}</span>
                        </div>
                      ) : (
                        <span className="text-text-secondary">{terminal.currentUserName || "\u2014"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-primary font-medium">
                      {terminal.todayOrders}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-primary font-medium">
                      {t(locale, "common.mop")} {terminal.todayRevenue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() =>
                            setMenuOpen(menuOpen === terminal.id ? null : terminal.id)
                          }
                          aria-label={interpolate(t(locale, "terminals.actionsFor"), { name: terminal.name })}
                          className="p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuOpen === terminal.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuOpen(null)}
                            />
                            <div role="menu" className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-[var(--radius-md)] shadow-lg z-20 py-1">
                              {getMenuActions(terminal).map((action) => (
                                <button
                                  key={action.label}
                                  role="menuitem"
                                  onClick={action.onClick}
                                  disabled={isPending}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors disabled:opacity-50",
                                    action.danger
                                      ? "text-danger hover:bg-danger-light"
                                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                                  )}
                                >
                                  <action.icon className="h-3.5 w-3.5" />
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-text-tertiary">
                    {t(locale, "terminals.noResults")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Dialogs */}
      <AddTerminalDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} locale={locale} locations={locations} />
      <UnlinkConfirmDialog
        open={!!unlinkTarget}
        onClose={() => setUnlinkTarget(null)}
        onConfirm={handleUnlinkConfirm}
        terminalName={unlinkTarget?.name || ""}
        isPending={isPending}
        locale={locale}
      />
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        terminalName={deleteTarget?.name || ""}
        isPending={isPending}
        locale={locale}
      />
      {activationCodeDialog && (
        <ActivationCodeDialog
          open
          onClose={() => setActivationCodeDialog(null)}
          code={activationCodeDialog.code}
          terminalCode={activationCodeDialog.terminalCode}
          locale={locale}
        />
      )}
    </>
  );
}
