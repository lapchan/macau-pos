"use client";

import { useState, useCallback, useTransition } from "react";
import { Plus, X, Trash2, ChevronDown, ChevronUp, Package, Loader2, ImagePlus } from "lucide-react";
import { useRef } from "react";
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

// Color name → hex lookup for swatch display
const COLOR_MAP: Record<string, string> = {
  "白": "#ffffff", "純白": "#ffffff", "純白色": "#ffffff", "純⽩⾊": "#ffffff", "白色": "#ffffff",
  "黑": "#1a1a1a", "黑色": "#1a1a1a", "暗魂黑": "#1a1a1a", "酷黑": "#111111",
  "灰": "#9ca3af", "灰色": "#9ca3af", "城堡灰": "#8b8680",
  "綠": "#22c55e", "綠色": "#22c55e", "森林綠": "#2d5a27",
  "藍": "#3b82f6", "藍色": "#3b82f6", "深海藍": "#1e3a5f",
  "粉紅": "#f9a8d4", "粉紅色": "#f9a8d4", "粉藍": "#93c5fd", "粉藍色": "#93c5fd",
  "薄荷": "#a7f3d0", "薄荷色": "#a7f3d0", "薄荷⾊": "#a7f3d0",
  "奶茶": "#c4a882", "奶茶色": "#c4a882", "奶茶⾊": "#c4a882",
  "紫": "#a855f7", "橙": "#f97316", "金": "#eab308", "銀": "#c0c0c0",
  "河津櫻": "#f4c2c2", "丁香": "#c8a2c8", "乾燥玫瑰": "#c08081", "夜海": "#2c3e6b",
  "晨霧": "#d3d3d3", "焙茶": "#8b6914", "紫滕": "#9370db", "落日珊瑚": "#f08080",
  "薰衣草": "#b57edc", "藍雪花": "#6495ed", "風鈴木": "#f0c420", "綠桔梗": "#77b28c",
  "蝶豆花": "#4a3fc4", "青檸": "#a8d600", "桂枝": "#c4996c",
  "white": "#ffffff", "black": "#1a1a1a", "grey": "#9ca3af", "gray": "#9ca3af",
  "green": "#22c55e", "blue": "#3b82f6", "red": "#ef4444", "pink": "#f9a8d4",
  "mint": "#a7f3d0", "silver": "#c0c0c0", "gold": "#eab308",
};

function getColorHex(name: string): string | null {
  if (COLOR_MAP[name]) return COLOR_MAP[name];
  const lower = name.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (name.includes(key) || lower.includes(key.toLowerCase())) return hex;
  }
  return null;
}

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
  image: string | null;
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

  // Upload variant image
  const handleVariantImageUpload = useCallback(async (variantId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success && data.path) {
      await updateVariant(variantId, { image: data.path });
      setVariants((prev) => prev.map((v) => v.id === variantId ? { ...v, image: data.path } : v));
    }
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
                      <th className="text-center px-2 py-2 font-semibold text-text-secondary whitespace-nowrap w-[52px]">{t(locale, "items.image") || "Image"}</th>
                      <th className="text-left px-3 py-2 font-semibold text-text-secondary whitespace-nowrap">{t(locale, "items.colItem")}</th>
                      <th className="text-left px-3 py-2 font-semibold text-text-secondary whitespace-nowrap">SKU</th>
                      <th className="text-left px-3 py-2 font-semibold text-text-secondary whitespace-nowrap">{t(locale, "items.barcode")}</th>
                      <th className="text-right px-3 py-2 font-semibold text-text-secondary whitespace-nowrap">{t(locale, "items.colPrice")}</th>
                      <th className="text-right px-3 py-2 font-semibold text-text-secondary whitespace-nowrap">{t(locale, "items.colStock")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => {
                      const comboValues = Object.values(v.optionCombo);
                      const colorHex = comboValues.length > 0 ? getColorHex(comboValues[0]) : null;
                      return (
                      <tr key={v.id} className="border-b border-border last:border-0 hover:bg-surface-hover/30 transition-colors">
                        {/* Image / Color swatch */}
                        <td className="px-2 py-2 text-center">
                          <label className="cursor-pointer inline-flex items-center justify-center">
                            {v.image ? (
                              <div className="relative group">
                                <img src={v.image} alt="" className="h-8 w-8 rounded-full object-cover border border-border" />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    updateVariant(v.id, { image: null });
                                    setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, image: null } : x));
                                  }}
                                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            ) : colorHex ? (
                              <div className="relative group">
                                <span
                                  className="block h-8 w-8 rounded-full border border-border"
                                  style={{
                                    backgroundColor: colorHex,
                                    boxShadow: colorHex === "#ffffff" ? "inset 0 0 0 1px rgba(0,0,0,0.1)" : undefined,
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ImagePlus className="h-3.5 w-3.5 text-white drop-shadow-md" />
                                </div>
                              </div>
                            ) : (
                              <span className="h-8 w-8 rounded-full border border-dashed border-border flex items-center justify-center text-text-tertiary hover:border-accent hover:text-accent transition-colors">
                                <ImagePlus className="h-3.5 w-3.5" />
                              </span>
                            )}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleVariantImageUpload(v.id, file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-text-primary font-medium">
                            {comboValues.join(" / ")}
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
                      );
                    })}
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
