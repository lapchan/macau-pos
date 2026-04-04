"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import BottomSheet from "@/components/shared/bottom-sheet";
import { createStaff, updateStaff, deleteStaff } from "@/lib/staff-actions";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";
import {
  Plus,
  Edit2,
  MoreHorizontal,
  Trash2,
  X,
  Users,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────
type StaffLocation = { id: string; name: string };
type StaffMember = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  posRole: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  locations: StaffLocation[];
};

type LocationOption = { id: string; name: string };

type Props = {
  staff: StaffMember[];
  locations: LocationOption[];
};

// ─── Role Config ────────────────────────────────────────────
// Admin role badges
const roleBadgeClass: Record<string, string> = {
  merchant_owner: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  accountant: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  cashier: "bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400",
};

const roleI18nKeys: Record<string, "staff.roleOwner" | "staff.roleCashier" | "staff.roleAccountant" | "staff.rolePromoter"> = {
  merchant_owner: "staff.roleOwner",
  cashier: "staff.roleCashier",
  accountant: "staff.roleAccountant",
  promoter: "staff.rolePromoter",
};

// POS role badges
const posRoleBadgeClass: Record<string, string> = {
  store_manager: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const posRoleI18nKeys: Record<string, "staff.posRoleStoreManager"> = {
  store_manager: "staff.posRoleStoreManager",
};

// Admin panel role options (for dropdown)
const adminRoleOptions = [
  { value: "", key: "staff.adminRoleNone" as const },
  { value: "merchant_owner", key: "staff.roleOwner" as const },
  { value: "accountant", key: "staff.roleAccountant" as const },
];

// POS role options (for dropdown)
const posRoleOptions = [
  { value: "", key: "staff.posRoleNone" as const },
  { value: "store_manager", key: "staff.posRoleStoreManager" as const },
];

// ─── Delete Confirm Dialog (inline) ────────────────────────
function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  staffName,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  staffName?: string;
  isPending: boolean;
}) {
  const { locale } = useLocale();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !isPending) onClose();
    },
    [open, onClose, isPending]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30 animate-[fadeIn_0.15s_ease-out]"
        onClick={isPending ? undefined : onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[380px] bg-surface rounded-[var(--radius-lg)] border border-border shadow-2xl animate-[scaleIn_0.2s_ease-out]">
          <div className="flex items-start gap-3 p-5 pb-3">
            <div className="h-10 w-10 rounded-full bg-danger-light flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-text-primary">
                {t(locale, "staff.deleteTitle")}
              </h3>
              <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">
                Are you sure you want to delete <strong>{staffName}</strong>? {t(locale, "staff.deleteDesc")}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isPending}
              aria-label={t(locale, "common.close")}
              className="h-7 w-7 rounded-[var(--radius-sm)] flex items-center justify-center text-text-tertiary hover:bg-surface-hover transition-colors -mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2.5 p-5 pt-3">
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
              className="flex-1 h-10 rounded-[var(--radius-md)] bg-danger text-white text-[13px] font-medium hover:bg-danger/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t(locale, "common.delete")
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function StaffClient({ staff, locations = [] }: Props) {
  const { locale } = useLocale();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Search/filter state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("merchant_owner");
  const [formPosRole, setFormPosRole] = useState("store_manager");
  const [formPin, setFormPin] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formLocationIds, setFormLocationIds] = useState<string[]>([]);
  const [showPin, setShowPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  // Escape to close menu
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) setMenuOpen(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  // ── Handlers ─────────────────────────────────────────────
  const resetForm = () => {
    setFormName("");
    setFormEmail("");
    setFormPhone("");
    setFormRole("merchant_owner");
    setFormPosRole("store_manager");
    setFormPin("");
    setFormPassword("");
    setFormActive(true);
    setFormLocationIds([]);
    setShowPin(false);
    setShowPassword(false);
    setFormError(null);
  };

  const handleAdd = () => {
    setEditingStaff(null);
    resetForm();
    setSheetOpen(true);
  };

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormName(member.name);
    setFormEmail(member.email || "");
    setFormPhone(member.phone || "");
    setFormRole(member.role === "cashier" ? "" : member.role);
    setFormPosRole(member.posRole || "");
    setFormPin("");
    setFormPassword("");
    setFormActive(member.isActive);
    setFormLocationIds(member.locations.map((l) => l.id));
    setShowPin(false);
    setShowPassword(false);
    setFormError(null);
    setMenuOpen(null);
    setSheetOpen(true);
  };

  const handleDeleteClick = (member: StaffMember) => {
    setDeleteTarget({ id: member.id, name: member.name });
    setMenuOpen(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      await deleteStaff(deleteTarget.id);
      setDeleteTarget(null);
    });
  };

  const handleSave = () => {
    setFormError(null);
    startSaveTransition(async () => {
      const fd = new FormData();
      if (editingStaff) fd.set("id", editingStaff.id);
      fd.set("name", formName);
      fd.set("email", formEmail);
      fd.set("phone", formPhone);
      fd.set("role", formRole || "cashier"); // empty admin = "cashier" role (no admin access)
      fd.set("posRole", formPosRole);
      fd.set("pin", formPin);
      fd.set("password", formPassword);
      fd.set("isActive", String(formActive));
      fd.set("locationIds", formLocationIds.join(","));

      const result = editingStaff ? await updateStaff(fd) : await createStaff(fd);
      if (result.success) {
        setSheetOpen(false);
        resetForm();
      } else {
        setFormError(result.error || "Something went wrong");
      }
    });
  };

  const handleCloseSheet = () => {
    setSheetOpen(false);
    setEditingStaff(null);
    resetForm();
  };

  const isEditing = !!editingStaff;
  const isDirty =
    formName !== (editingStaff?.name ?? "") ||
    formEmail !== (editingStaff?.email ?? "") ||
    formPhone !== (editingStaff?.phone ?? "") ||
    formRole !== (editingStaff ? (editingStaff.role === "cashier" ? "" : editingStaff.role) : "merchant_owner") ||
    formPosRole !== (editingStaff?.posRole ?? "store_manager") ||
    formPin !== "" ||
    formPassword !== "" ||
    formActive !== (editingStaff?.isActive ?? true);

  // ── Filtered staff list ──────────────────────────────────
  const filteredStaff = staff.filter((m) => {
    if (search) {
      const q = search.toLowerCase();
      if (!m.name.toLowerCase().includes(q) && !m.email?.toLowerCase().includes(q) && !m.phone?.includes(q)) return false;
    }
    if (roleFilter !== "all" && m.role !== roleFilter) return false;
    if (statusFilter === "active" && !m.isActive) return false;
    if (statusFilter === "inactive" && m.isActive) return false;
    return true;
  });

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <PageHeader title={t(locale, "staff.pageTitle")} subtitle={interpolate(t(locale, "staff.teamMembers"), { count: staff.length })}>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" /> {t(locale, "staff.addStaff")}
        </button>
      </PageHeader>

      {/* ── Search/Filter bar ────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder={t(locale, "staff.searchPlaceholder") || "Search by name, email, phone..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-[34px] pl-9 pr-3 text-xs bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-[34px] pl-3 pr-7 text-xs font-medium bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
        >
          <option value="all">{t(locale, "staff.allRoles") || "All Roles"}</option>
          <option value="merchant_owner">{t(locale, "staff.roleOwner")}</option>
          <option value="cashier">{t(locale, "staff.roleCashier")}</option>
          <option value="accountant">{t(locale, "staff.roleAccountant")}</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-[34px] pl-3 pr-7 text-xs font-medium bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
        >
          <option value="all">{t(locale, "staff.allStatuses") || "All Status"}</option>
          <option value="active">{t(locale, "staff.statusActive") || "Active"}</option>
          <option value="inactive">{t(locale, "staff.statusInactive") || "Inactive"}</option>
        </select>
        <span className="text-xs text-text-tertiary ml-auto">
          {interpolate(t(locale, "staff.teamMembers"), { count: filteredStaff.length })}
        </span>
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      <Card padding="none">
        <div className="overflow-hidden">
          <table className="w-full text-sm" aria-label="Staff members">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-3">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{t(locale, "staff.nameLabel")}</span>
                </th>
                <th className="text-left px-3 py-3 hidden md:table-cell">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{t(locale, "staff.emailLabel")} / {t(locale, "staff.phoneLabel")}</span>
                </th>
                <th className="text-left px-3 py-3">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{t(locale, "staff.roleLabel")}</span>
                </th>
                <th className="text-left px-3 py-3">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">{t(locale, "common.status")}</span>
                </th>
                <th className="text-left px-3 py-3 hidden lg:table-cell">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">{t(locale, "staff.lastLogin")}</span>
                </th>
                <th className="px-3 py-3 text-right" />
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors group"
                >
                  {/* Name */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-surface-hover flex items-center justify-center shrink-0 text-[13px] font-semibold text-text-secondary uppercase">
                        {member.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-text-primary truncate">{member.name}</p>
                        {/* Location badges */}
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {member.role === "merchant_owner" ? (
                            <span className="text-[10px] text-text-tertiary">{t(locale, "staff.allLocations") || "All locations"}</span>
                          ) : member.locations.length > 0 ? (
                            member.locations.map((loc) => (
                              <span key={loc.id} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-hover text-text-secondary">{loc.name}</span>
                            ))
                          ) : (
                            <span className="text-[10px] text-warning">{t(locale, "staff.noLocations") || "No location"}</span>
                          )}
                        </div>
                        {/* Show email/phone below name on mobile */}
                        <p className="md:hidden text-[11px] text-text-tertiary truncate mt-0.5">
                          {member.email || member.phone || "—"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email / Phone */}
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <div className="min-w-0">
                      {member.email && (
                        <p className="text-[13px] text-text-secondary truncate">{member.email}</p>
                      )}
                      {member.phone && (
                        <p className="text-[11px] text-text-tertiary truncate">{member.phone}</p>
                      )}
                      {!member.email && !member.phone && (
                        <span className="text-[13px] text-text-tertiary">—</span>
                      )}
                    </div>
                  </td>

                  {/* Role badges */}
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {/* Admin role badge */}
                      {member.role !== "cashier" && (
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)] inline-block",
                            roleBadgeClass[member.role] || "bg-surface-hover text-text-secondary"
                          )}
                        >
                          {roleI18nKeys[member.role] ? t(locale, roleI18nKeys[member.role]) : member.role}
                        </span>
                      )}
                      {/* POS role badge */}
                      {member.posRole && (
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)] inline-block",
                            posRoleBadgeClass[member.posRole] || "bg-surface-hover text-text-secondary"
                          )}
                        >
                          {posRoleI18nKeys[member.posRole] ? t(locale, posRoleI18nKeys[member.posRole]) : member.posRole}
                        </span>
                      )}
                      {/* Implicit POS access for merchant_owner */}
                      {member.role === "merchant_owner" && !member.posRole && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)] inline-block bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                          POS
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-2.5">
                    <div className="relative group/status flex items-center gap-1.5">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          member.isActive ? "bg-success" : "bg-text-tertiary"
                        )}
                      />
                      <span className="hidden lg:inline text-[12px] text-text-secondary whitespace-nowrap">
                        {member.isActive ? t(locale, "staff.activeLabel") : t(locale, "common.statusInactive")}
                      </span>
                      {/* Tooltip on small screens */}
                      <div className="lg:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[11px] font-medium text-white bg-text-primary rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 pointer-events-none group-hover/status:opacity-100 transition-opacity shadow-lg">
                        {member.isActive ? t(locale, "staff.activeLabel") : t(locale, "common.statusInactive")}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-text-primary" />
                      </div>
                    </div>
                  </td>

                  {/* Last login */}
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    <span className="text-[12px] text-text-tertiary whitespace-nowrap">
                      {formatDate(member.lastLoginAt)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      {/* Edit button — icon-only on small screens, icon+text on large */}
                      <div className="relative group/edit">
                        <button
                          onClick={() => handleEdit(member)}
                          aria-label={`${t(locale, "common.edit")} ${member.name}`}
                          className="h-7 w-7 lg:w-auto lg:px-2.5 rounded-[var(--radius-sm)] text-[12px] font-medium text-text-secondary border border-border hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center justify-center lg:justify-start gap-1"
                        >
                          <Edit2 className="h-3 w-3 shrink-0" />
                          <span className="hidden lg:inline">{t(locale, "common.edit")}</span>
                        </button>
                        <div className="lg:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[11px] font-medium text-white bg-text-primary rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 pointer-events-none group-hover/edit:opacity-100 transition-opacity shadow-lg">
                          {t(locale, "common.edit")}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-text-primary" />
                        </div>
                      </div>

                      {/* More menu */}
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === member.id ? null : member.id)}
                          aria-label={`Actions for ${member.name}`}
                          className="h-7 w-7 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors flex items-center justify-center"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuOpen === member.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                            <div
                              role="menu"
                              className="fixed z-50 w-36 bg-surface border border-border rounded-[var(--radius-md)] shadow-xl py-1"
                              style={{ top: "auto", right: 16 }}
                            >
                              <button
                                role="menuitem"
                                onClick={() => handleDeleteClick(member)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-light transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> {t(locale, "common.delete")}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Empty state */}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center mb-3">
                        <Users className="h-6 w-6 text-text-tertiary" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm font-medium text-text-primary mb-1">{t(locale, "staff.emptyTitle")}</p>
                      <p className="text-xs text-text-secondary">{t(locale, "staff.emptyDesc")}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Add/Edit Bottom Sheet ─────────────────────────── */}
      <BottomSheet
        open={sheetOpen}
        onClose={handleCloseSheet}
        isDirty={isDirty}
        snapPoints={[1.0]}
        header={
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleCloseSheet}
              aria-label={t(locale, "common.close")}
              className="h-8 w-8 rounded-[var(--radius-sm)] flex items-center justify-center text-text-tertiary hover:bg-surface-hover transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-[15px] font-semibold text-text-primary">
              {isEditing ? t(locale, "staff.editStaff") : t(locale, "staff.addStaff")}
            </h2>
            <button
              onClick={handleSave}
              disabled={isSaving || !formName.trim()}
              className="px-4 py-1.5 text-[13px] font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {isSaving ? (
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              ) : (
                t(locale, "common.save")
              )}
            </button>
          </div>
        }
      >
        <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
          {/* Error banner */}
          {formError && (
            <div className="px-3 py-2.5 text-[13px] text-danger bg-danger-light rounded-[var(--radius-md)] border border-danger/20">
              {formError}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "staff.nameLabel")} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t(locale, "staff.nameLabel")}
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "staff.emailLabel")}
            </label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "staff.phoneLabel")}
            </label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+853 6XXX XXXX"
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            />
          </div>

          {/* ── Access ── */}
          <div className="pt-2 pb-1">
            <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider">
              {t(locale, "staff.roleLabel")}
            </p>
          </div>

          {/* Admin Panel Access */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "staff.adminAccessLabel")}
            </label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all appearance-none"
            >
              {adminRoleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(locale, opt.key)}
                </option>
              ))}
            </select>
          </div>

          {/* POS Access */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "staff.posAccessLabel")}
            </label>
            <select
              value={formPosRole}
              onChange={(e) => setFormPosRole(e.target.value)}
              className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all appearance-none"
            >
              {posRoleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(locale, opt.key)}
                </option>
              ))}
            </select>
          </div>

          {/* Location assignment */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "staff.locationsLabel") || "Locations"}
            </label>
            {formRole === "merchant_owner" ? (
              <p className="text-[13px] text-text-tertiary italic">
                {t(locale, "staff.ownerAllLocations") || "Owners have access to all locations"}
              </p>
            ) : locations.length === 0 ? (
              <p className="text-[13px] text-text-tertiary">{t(locale, "staff.noLocationsAvailable") || "No locations available"}</p>
            ) : (
              <div className="space-y-1.5">
                {locations.map((loc) => (
                  <label key={loc.id} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formLocationIds.includes(loc.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormLocationIds((prev) => [...prev, loc.id]);
                        } else {
                          setFormLocationIds((prev) => prev.filter((id) => id !== loc.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-[13px] text-text-primary group-hover:text-accent transition-colors">{loc.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* PIN (visible when POS role is set) */}
          {formPosRole && (
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                {t(locale, "staff.pinLabel")}
              </label>
              <div className="relative">
                <input
                  type={showPin ? "text" : "password"}
                  value={formPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setFormPin(val);
                  }}
                  placeholder={isEditing ? "Leave blank to keep current" : "Enter 4-6 digit PIN"}
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full h-10 px-3 pr-10 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-[13px] font-medium text-text-primary mb-1.5">
              {t(locale, "staff.passwordLabel")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={isEditing ? "Leave blank to keep current" : "Min 6 characters"}
                className="w-full h-10 px-3 pr-10 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-text-tertiary hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-[13px] font-medium text-text-primary">{t(locale, "staff.activeLabel")}</p>
              <p className="text-[12px] text-text-tertiary mt-0.5">
                {t(locale, "staff.inactiveWarning")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formActive}
              onClick={() => setFormActive(!formActive)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors shrink-0",
                formActive ? "bg-success" : "bg-border-strong"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  formActive && "translate-x-5"
                )}
              />
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* ── Delete Confirmation ───────────────────────────── */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        staffName={deleteTarget?.name}
        isPending={isDeleting}
      />
    </>
  );
}
