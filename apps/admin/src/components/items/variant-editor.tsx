"use client";

import { useState, useCallback, useTransition } from "react";
import { Plus, X, Trash2, ChevronDown, ChevronUp, Package, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import {
  createOptionGroup,
  addOptionValue,
  removeOptionValue,
  deleteOptionGroup,
  generateVariants,
  clearVariants,
  updateVariant,
} from "@/lib/variant-actions";

type OptionValue = { id: string; value: string; sortOrder: number };
type OptionGroup = { id: string; name: string; sortOrder: number; values: OptionValue[] };
type Variant = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  sellingPrice: string;
  stock: number | null;
  optionCombo: Record<string, string>;
  isActive: boolean;
};

type Props = {
  productId: string;
  initialGroups: OptionGroup[];
  initialVariants: Variant[];
  hasVariants: boolean;
  onDirty: () => void;
};

export default function VariantEditor({
  productId,
  initialGroups,
  initialVariants,
  hasVariants,
  onDirty,
}: Props) {
  const { locale } = useLocale();
  const [enabled, setEnabled] = useState(hasVariants);
  const [groups, setGroups] = useState<OptionGroup[]>(initialGroups);
  const [variants, setVariants] = useState<Variant[]>(initialVariants);
  const [expanded, setExpanded] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [newGroupName, setNewGroupName] = useState("");
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});

  // Add option group
  const handleAddGroup = useCallback(() => {
    if (!newGroupName.trim()) return;
    startTransition(async () => {
      const result = await createOptionGroup(productId, newGroupName.trim());
      if (result.success && result.data?.id) {
        setGroups((prev) => [
          ...prev,
          { id: result.data!.id as string, name: newGroupName.trim(), sortOrder: prev.length, values: [] },
        ]);
        setNewGroupName("");
        onDirty();
      }
    });
  }, [newGroupName, productId, onDirty]);

  // Delete option group
  const handleDeleteGroup = useCallback((groupId: string) => {
    startTransition(async () => {
      const result = await deleteOptionGroup(groupId);
      if (result.success) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        onDirty();
      }
    });
  }, [onDirty]);

  // Add value to group
  const handleAddValue = useCallback((groupId: string) => {
    const value = newValueInputs[groupId]?.trim();
    if (!value) return;
    startTransition(async () => {
      const result = await addOptionValue(groupId, value);
      if (result.success && result.data?.id) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId
              ? { ...g, values: [...g.values, { id: result.data!.id as string, value, sortOrder: g.values.length }] }
              : g
          )
        );
        setNewValueInputs((prev) => ({ ...prev, [groupId]: "" }));
        onDirty();
      }
    });
  }, [newValueInputs, onDirty]);

  // Remove value
  const handleRemoveValue = useCallback((groupId: string, valueId: string) => {
    startTransition(async () => {
      const result = await removeOptionValue(valueId);
      if (result.success) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId ? { ...g, values: g.values.filter((v) => v.id !== valueId) } : g
          )
        );
        onDirty();
      }
    });
  }, [onDirty]);

  // Generate variants from option combinations
  const handleGenerate = useCallback(() => {
    startTransition(async () => {
      const result = await generateVariants(productId);
      if (result.success) {
        setEnabled(true);
        // Reload variants — for now just reload the page
        window.location.reload();
      }
    });
  }, [productId]);

  // Clear all variants
  const handleClear = useCallback(() => {
    startTransition(async () => {
      const result = await clearVariants(productId);
      if (result.success) {
        setEnabled(false);
        setGroups([]);
        setVariants([]);
        onDirty();
      }
    });
  }, [productId, onDirty]);

  // Update variant inline
  const handleUpdateVariant = useCallback((variantId: string, field: string, value: string) => {
    startTransition(async () => {
      const data: Record<string, unknown> = {};
      if (field === "sellingPrice") data.sellingPrice = value;
      if (field === "sku") data.sku = value || null;
      if (field === "barcode") data.barcode = value || null;
      if (field === "stock") data.stock = value === "" ? null : parseInt(value, 10);
      await updateVariant(variantId, data as Parameters<typeof updateVariant>[1]);
      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, [field]: field === "stock" ? (value === "" ? null : parseInt(value, 10)) : value } : v))
      );
    });
  }, []);

  const totalValues = groups.reduce((sum, g) => sum + g.values.length, 0);
  const canGenerate = groups.length > 0 && totalValues > 0;

  return (
    <div className="border-t border-border pt-5">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full mb-4"
      >
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-text-secondary" />
          <span className="text-[13px] font-semibold text-text-primary">
            {t(locale, "items.hasVariants")}
          </span>
          {variants.length > 0 && (
            <span className="text-[11px] font-medium text-accent bg-accent-light px-1.5 py-0.5 rounded-[var(--radius-full)]">
              {variants.length}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-text-tertiary" /> : <ChevronDown className="h-4 w-4 text-text-tertiary" />}
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* Option groups */}
          {groups.map((group) => (
            <div key={group.id} className="bg-surface-hover/50 rounded-[var(--radius-md)] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-medium text-text-primary">{group.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(group.id)}
                  disabled={isPending}
                  className="text-text-tertiary hover:text-danger transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Values as chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {group.values.map((val) => (
                  <span
                    key={val.id}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium bg-surface border border-border rounded-[var(--radius-full)]"
                  >
                    {val.value}
                    <button
                      type="button"
                      onClick={() => handleRemoveValue(group.id, val.id)}
                      disabled={isPending}
                      className="text-text-tertiary hover:text-danger transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add value input */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder={`${t(locale, "common.add")} ${group.name}...`}
                  value={newValueInputs[group.id] || ""}
                  onChange={(e) => setNewValueInputs((prev) => ({ ...prev, [group.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddValue(group.id); } }}
                  className="flex-1 h-8 px-2.5 text-[12px] bg-background border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => handleAddValue(group.id)}
                  disabled={isPending || !newValueInputs[group.id]?.trim()}
                  className="h-8 px-2.5 text-[12px] font-medium text-accent border border-accent/30 rounded-[var(--radius-sm)] hover:bg-accent-light transition-colors disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add new option group */}
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder={t(locale, "items.addOptionGroup")}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddGroup(); } }}
              className="flex-1 h-9 px-3 text-[13px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
            />
            <button
              type="button"
              onClick={handleAddGroup}
              disabled={isPending || !newGroupName.trim()}
              className="h-9 px-3 text-[13px] font-medium text-white bg-accent rounded-[var(--radius-md)] hover:bg-accent-dark transition-colors disabled:opacity-40 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {t(locale, "common.add")}
            </button>
          </div>

          {/* Generate / Clear buttons */}
          {groups.length > 0 && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isPending || !canGenerate}
                className="flex-1 h-9 text-[13px] font-medium text-white bg-accent rounded-[var(--radius-md)] hover:bg-accent-dark transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
                {t(locale, "items.generateVariants")}
              </button>
              {variants.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isPending}
                  className="h-9 px-3 text-[13px] font-medium text-danger border border-danger/20 rounded-[var(--radius-md)] hover:bg-danger-light transition-colors disabled:opacity-40"
                >
                  {t(locale, "common.clearAll")}
                </button>
              )}
            </div>
          )}

          {/* Variants table */}
          {variants.length > 0 && (
            <div className="mt-3 border border-border rounded-[var(--radius-md)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-surface-hover/50 border-b border-border">
                      <th className="text-left px-3 py-2 font-semibold text-text-secondary whitespace-nowrap">{t(locale, "items.colItem")}</th>
                      <th className="text-left px-3 py-2 font-semibold text-text-secondary whitespace-nowrap">SKU</th>
                      <th className="text-left px-3 py-2 font-semibold text-text-secondary whitespace-nowrap">{t(locale, "items.barcode")}</th>
                      <th className="text-right px-3 py-2 font-semibold text-text-secondary whitespace-nowrap">{t(locale, "items.colPrice")}</th>
                      <th className="text-right px-3 py-2 font-semibold text-text-secondary whitespace-nowrap">{t(locale, "items.colStock")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={v.id} className="border-b border-border last:border-0 hover:bg-surface-hover/30 transition-colors">
                        <td className="px-3 py-2.5">
                          <span className="text-text-primary font-medium">
                            {Object.values(v.optionCombo).join(" / ")}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            defaultValue={v.sku || ""}
                            onBlur={(e) => handleUpdateVariant(v.id, "sku", e.target.value)}
                            placeholder="—"
                            className="w-24 h-7 px-1.5 text-[12px] bg-transparent border border-transparent hover:border-border focus:border-accent rounded text-text-primary focus:outline-none tabular-nums"
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            defaultValue={v.barcode || ""}
                            onBlur={(e) => handleUpdateVariant(v.id, "barcode", e.target.value)}
                            placeholder="—"
                            className="w-32 h-7 px-1.5 text-[12px] bg-transparent border border-transparent hover:border-border focus:border-accent rounded text-text-tertiary focus:text-text-primary focus:outline-none tabular-nums"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <input
                            type="number"
                            step="0.01"
                            defaultValue={v.sellingPrice}
                            onBlur={(e) => handleUpdateVariant(v.id, "sellingPrice", e.target.value)}
                            className="w-20 h-7 px-1.5 text-[12px] bg-transparent border border-transparent hover:border-border focus:border-accent rounded text-text-primary text-right tabular-nums focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <input
                            type="number"
                            defaultValue={v.stock ?? ""}
                            onBlur={(e) => handleUpdateVariant(v.id, "stock", e.target.value)}
                            placeholder="∞"
                            className="w-16 h-7 px-1.5 text-[12px] bg-transparent border border-transparent hover:border-border focus:border-accent rounded text-text-primary text-right tabular-nums focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
