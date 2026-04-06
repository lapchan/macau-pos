"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import { cn } from "@/lib/cn";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";
import { createCategory, updateCategory, deleteCategory } from "@/lib/category-actions";
import IconPicker, { ICON_MAP } from "./icon-picker";
import {
  X,
  Plus,
  GripVertical,
  Edit2,
  Trash2,
  ChevronLeft,
  AlertTriangle,
  LayoutGrid,
} from "lucide-react";

export type CategoryWithCount = {
  id: string;
  name: string;
  translations: Record<string, string> | null;
  parentCategoryId: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  categories: CategoryWithCount[];
};

type View = "list" | "edit";

export default function CategoryManager({ open, onClose, categories }: Props) {
  const { locale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<View>("list");
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Form state for icon picker
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Build hierarchical list: parents first, children nested under them
  const topCategories = categories.filter((c) => !c.parentCategoryId);
  const childMap = new Map<string, CategoryWithCount[]>();
  for (const c of categories) {
    if (c.parentCategoryId) {
      const siblings = childMap.get(c.parentCategoryId) || [];
      siblings.push(c);
      childMap.set(c.parentCategoryId, siblings);
    }
  }
  // Flat ordered list: parent, then its children, then next parent...
  const orderedCategories: (CategoryWithCount & { depth: number })[] = [];
  for (const parent of topCategories) {
    orderedCategories.push({ ...parent, depth: 0 });
    const children = childMap.get(parent.id) || [];
    for (const child of children) {
      orderedCategories.push({ ...child, depth: 1 });
    }
  }
  // Orphaned children (parent not in list) — shouldn't happen but be safe
  for (const c of categories) {
    if (c.parentCategoryId && !topCategories.find((p) => p.id === c.parentCategoryId)) {
      orderedCategories.push({ ...c, depth: 1 });
    }
  }

  // Reset when opening/closing
  useEffect(() => {
    if (open) {
      setView("list");
      setEditingCategory(null);
      setError(null);
      setDeleteTarget(null);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !isPending) {
        if (deleteTarget) setDeleteTarget(null);
        else if (view === "edit") { setView("list"); setError(null); }
        else onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, isPending, view, deleteTarget]);

  const handleAdd = () => {
    setEditingCategory(null);
    setSelectedIcon(null);
    setSelectedParentId(null);
    setError(null);
    setView("edit");
  };

  const handleEdit = (cat: CategoryWithCount) => {
    setEditingCategory(cat);
    setSelectedIcon(cat.icon);
    setSelectedParentId(cat.parentCategoryId);
    setError(null);
    setView("edit");
  };

  const handleSubmit = useCallback(
    (formData: FormData) => {
      setError(null);
      formData.set("icon", selectedIcon || "");
      formData.set("parentCategoryId", selectedParentId || "");

      if (editingCategory) {
        formData.set("id", editingCategory.id);
      }

      startTransition(async () => {
        const result = editingCategory
          ? await updateCategory(formData)
          : await createCategory(formData);
        if (result.success) {
          setView("list");
          setEditingCategory(null);
        } else {
          setError(result.error || "Something went wrong");
        }
      });
    },
    [editingCategory, selectedIcon, selectedParentId]
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteCategory(deleteTarget.id);
      if (result.success) {
        setDeleteTarget(null);
      } else {
        setError(result.error || "Failed to delete");
        setDeleteTarget(null);
      }
    });
  }, [deleteTarget]);

  const handleToggleActive = useCallback((cat: CategoryWithCount) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", cat.id);
      formData.set("name", cat.name);
      formData.set("isActive", String(!cat.isActive));
      await updateCategory(formData);
    });
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 animate-[fadeIn_0.2s_ease-out]"
        onClick={isPending ? undefined : onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[440px] bg-surface border-l border-border shadow-2xl flex flex-col animate-[slideInRight_0.3s_cubic-bezier(0.16,1,0.3,1)]">
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            {view === "edit" && (
              <button
                onClick={() => { setView("list"); setError(null); }}
                disabled={isPending}
                aria-label="Back"
                className="h-8 w-8 -ml-1 rounded-[var(--radius-sm)] flex items-center justify-center text-text-tertiary hover:bg-surface-hover transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <h2 className="text-[15px] font-semibold text-text-primary">
              {view === "edit"
                ? editingCategory
                  ? t(locale, "items.editCategory")
                  : t(locale, "items.addCategory")
                : t(locale, "items.categoryManager")}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            aria-label={t(locale, "common.close")}
            className="h-8 w-8 rounded-[var(--radius-sm)] flex items-center justify-center text-text-tertiary hover:bg-surface-hover transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <>
            <div className="flex-1 overflow-y-auto">
              {/* Error from delete */}
              {error && (
                <div className="mx-4 mt-4 text-[13px] text-danger bg-danger-light px-3 py-2.5 rounded-[var(--radius-md)] border border-danger/10">
                  {error}
                </div>
              )}

              <div className="p-4 space-y-1">
                {orderedCategories.map((cat) => {
                  const Icon = (cat.icon && ICON_MAP[cat.icon]) || LayoutGrid;
                  const trans = cat.translations as Record<string, string> | null;
                  const nameEn = trans?.en || null;
                  return (
                    <div
                      key={cat.id}
                      className={cn(
                        "flex items-center gap-3 py-3 rounded-[var(--radius-md)] group transition-colors",
                        cat.depth === 0 ? "px-3" : "px-3 ml-8",
                        cat.isActive
                          ? "hover:bg-surface-hover"
                          : "opacity-50 hover:bg-surface-hover"
                      )}
                    >
                      {/* Grip */}
                      <GripVertical className="h-4 w-4 text-text-tertiary shrink-0 opacity-0 group-hover:opacity-100 cursor-grab" />

                      {/* Icon */}
                      <div className={cn(
                        "rounded-[var(--radius-sm)] bg-surface-hover flex items-center justify-center shrink-0",
                        cat.depth === 0 ? "h-9 w-9" : "h-7 w-7"
                      )}>
                        <Icon className={cn(
                          "text-text-secondary",
                          cat.depth === 0 ? "h-4.5 w-4.5" : "h-3.5 w-3.5"
                        )} strokeWidth={1.75} />
                      </div>

                      {/* Names */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-medium text-text-primary truncate",
                          cat.depth === 0 ? "text-[13px]" : "text-[12px]"
                        )}>
                          {cat.name}
                        </p>
                        <p className="text-[11px] text-text-tertiary truncate">
                          {nameEn || "—"}
                        </p>
                      </div>

                      {/* Product count */}
                      <span className="text-[11px] text-text-tertiary tabular-nums shrink-0">
                        {cat.productCount > 0
                          ? interpolate(t(locale, "items.categoryProducts"), { count: cat.productCount })
                          : t(locale, "items.categoryNoProducts")}
                      </span>

                      {/* Active toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(cat)}
                        disabled={isPending}
                        aria-label={cat.isActive ? t(locale, "items.categoryActive") : t(locale, "items.categoryInactive")}
                        className={cn(
                          "relative h-5 w-9 rounded-full transition-colors shrink-0",
                          cat.isActive ? "bg-success" : "bg-border-strong"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                            cat.isActive ? "translate-x-[18px]" : "translate-x-0.5"
                          )}
                        />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleEdit(cat)}
                        aria-label={t(locale, "common.edit")}
                        className="h-7 w-7 rounded-[var(--radius-sm)] flex items-center justify-center text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        aria-label={t(locale, "common.delete")}
                        className="h-7 w-7 rounded-[var(--radius-sm)] flex items-center justify-center text-text-tertiary hover:bg-danger-light hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}

                {orderedCategories.length === 0 && (
                  <div className="py-12 text-center">
                    <LayoutGrid className="h-8 w-8 text-text-tertiary mx-auto mb-2" strokeWidth={1.5} />
                    <p className="text-sm text-text-secondary">{t(locale, "items.categoryNoProducts")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Add button */}
            <div className="p-4 border-t border-border shrink-0">
              <button
                onClick={handleAdd}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border text-[13px] font-medium text-text-secondary hover:bg-surface-hover hover:border-accent/40 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {t(locale, "items.addCategory")}
              </button>
            </div>
          </>
        )}

        {/* ── EDIT VIEW ── */}
        {view === "edit" && (
          <>
            <form ref={formRef} action={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">
                {error && (
                  <div className="text-[13px] text-danger bg-danger-light px-3 py-2.5 rounded-[var(--radius-md)] border border-danger/10">
                    {error}
                  </div>
                )}

                {/* Parent category (only show top-level categories as options, exclude self) */}
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                    {t(locale, "items.parentCategory")}
                  </label>
                  <select
                    value={selectedParentId || ""}
                    onChange={(e) => setSelectedParentId(e.target.value || null)}
                    className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  >
                    <option value="">{t(locale, "items.parentCategoryNone")}</option>
                    {topCategories
                      .filter((c) => c.id !== editingCategory?.id)
                      .map((c) => {
                        const trans = c.translations as Record<string, string> | null;
                        return (
                          <option key={c.id} value={c.id}>
                            {c.name}{trans?.en ? ` (${trans.en})` : ""}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* Chinese name (required) */}
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                    {t(locale, "items.categoryNameLabel")} <span className="text-danger">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    defaultValue={editingCategory?.name || ""}
                    placeholder="e.g. 飲品"
                    className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                </div>

                {/* English name */}
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                    {t(locale, "items.categoryNameEn")}
                  </label>
                  <input
                    name="nameEn"
                    type="text"
                    defaultValue={(editingCategory?.translations as Record<string, string> | null)?.en || ""}
                    placeholder="e.g. Beverages"
                    className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                </div>

                {/* Portuguese + Japanese */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                      {t(locale, "items.categoryNamePt")}
                    </label>
                    <input
                      name="namePt"
                      type="text"
                      defaultValue={(editingCategory?.translations as Record<string, string> | null)?.pt || ""}
                      placeholder="e.g. Bebidas"
                      className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                      {t(locale, "items.categoryNameJa")}
                    </label>
                    <input
                      name="nameJa"
                      type="text"
                      defaultValue={(editingCategory?.translations as Record<string, string> | null)?.ja || ""}
                      placeholder="e.g. 飲料"
                      className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Sort order */}
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                    {t(locale, "items.categoryOrder")}
                  </label>
                  <input
                    name="sortOrder"
                    type="number"
                    min="0"
                    defaultValue={editingCategory?.sortOrder ?? categories.length}
                    className="w-24 h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all tabular-nums"
                  />
                </div>

                {/* Icon picker */}
                <div>
                  <label className="block text-[13px] font-medium text-text-primary mb-2">
                    {t(locale, "items.chooseIcon")}
                  </label>
                  <IconPicker value={selectedIcon} onChange={setSelectedIcon} />
                </div>
              </div>
            </form>

            {/* Sticky footer */}
            <div className="flex gap-2.5 p-5 border-t border-border shrink-0 bg-surface">
              <button
                type="button"
                onClick={() => { setView("list"); setError(null); }}
                disabled={isPending}
                className="flex-1 h-10 rounded-[var(--radius-md)] border border-border text-[13px] font-medium text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
              >
                {t(locale, "common.cancel")}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => formRef.current?.requestSubmit()}
                className="flex-1 h-10 rounded-[var(--radius-md)] bg-accent text-white text-[13px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : editingCategory ? (
                  t(locale, "common.saveChanges")
                ) : (
                  t(locale, "items.addCategory")
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation overlay */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/30 animate-[fadeIn_0.15s_ease-out]" onClick={() => setDeleteTarget(null)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-[360px] bg-surface rounded-[var(--radius-lg)] border border-border shadow-2xl animate-[scaleIn_0.2s_ease-out]">
              <div className="flex items-start gap-3 p-5 pb-3">
                <div className="h-10 w-10 rounded-full bg-danger-light flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-danger" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-semibold text-text-primary">{t(locale, "items.deleteCategoryTitle")}</h3>
                  <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">
                    {deleteTarget.productCount > 0
                      ? interpolate(t(locale, "items.categoryProducts"), { count: deleteTarget.productCount }) + " — " + t(locale, "items.deleteCategoryDesc")
                      : t(locale, "items.deleteCategoryDesc")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 p-5 pt-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isPending}
                  className="flex-1 h-10 rounded-[var(--radius-md)] border border-border text-[13px] font-medium text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
                >
                  {t(locale, "common.cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 h-10 rounded-[var(--radius-md)] bg-danger text-white text-[13px] font-medium hover:bg-danger/90 transition-colors disabled:opacity-50 flex items-center justify-center"
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
      )}
    </>
  );
}
