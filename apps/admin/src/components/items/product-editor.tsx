"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import {
  X,
  Trash2,
  ImageIcon,
  Star,
  Check,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createProduct, updateProduct } from "@/lib/product-actions";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import BottomSheet from "@/components/shared/bottom-sheet";
import MultiLangInput, { type LangEntry, type LangCode } from "@/components/shared/multi-lang-input";
import VariantEditor from "@/components/items/variant-editor";
import { getProductOptions, getProductVariants } from "@/lib/variant-actions";

type CategoryOption = {
  id: string;
  name: string;
  nameCn?: string;
};

type OptionValueData = { id: string; value: string; sortOrder: number };
type OptionGroupData = { id: string; name: string; sortOrder: number; values: OptionValueData[] };
type VariantData = { id: string; name: string; sku: string | null; sellingPrice: string; stock: number | null; optionCombo: Record<string, string>; isActive: boolean };

type ProductData = {
  id: string;
  name: string;
  translations: Record<string, string> | null;
  sku: string | null;
  barcode: string | null;
  image: string | null;
  sellingPrice: string;
  originalPrice: string | null;
  stock: number | null;
  categoryId: string | null;
  status: string;
  isPopular: boolean;
  hasVariants?: boolean;
  version: number;
  optionGroups?: OptionGroupData[];
  variants?: VariantData[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  product?: ProductData | null;
  categories: CategoryOption[];
};

export default function ProductEditor({ open, onClose, product, categories }: Props) {
  const { locale } = useLocale();
  const isEdit = !!product;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [unlimitedStock, setUnlimitedStock] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [translations, setTranslations] = useState<LangEntry[]>([{ lang: "en", value: "" }]);
  const [loadedOptionGroups, setLoadedOptionGroups] = useState<OptionGroupData[]>([]);
  const [loadedVariants, setLoadedVariants] = useState<VariantData[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset when product changes
  useEffect(() => {
    if (open) {
      setError(null);
      setImagePath(product?.image || null);
      setUnlimitedStock(product ? product.stock === null : true);
      setIsDirty(false);

      // Build translation entries from product data
      if (product?.translations && Object.keys(product.translations).length > 0) {
        const entries: LangEntry[] = Object.entries(product.translations).map(([lang, value]) => ({
          lang: lang as LangCode,
          value: value || "",
        }));
        // Ensure at least one entry
        if (entries.length === 0) entries.push({ lang: "en", value: "" });
        setTranslations(entries);
      } else {
        setTranslations([{ lang: "en", value: "" }]);
      }

      // Load variant data for edit mode
      if (product?.id && product?.hasVariants) {
        setVariantsLoading(true);
        Promise.all([
          getProductOptions(product.id),
          getProductVariants(product.id),
        ]).then(([groups, variants]) => {
          setLoadedOptionGroups(groups.map(g => ({
            id: g.id,
            name: g.name,
            sortOrder: g.sortOrder,
            values: g.values.map(v => ({ id: v.id, value: v.value, sortOrder: v.sortOrder })),
          })));
          setLoadedVariants(variants.map(v => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            barcode: v.barcode,
            sellingPrice: v.sellingPrice,
            stock: v.stock,
            optionCombo: v.optionCombo as Record<string, string>,
            isActive: v.isActive,
            image: v.image,
          })));
        }).catch(console.error).finally(() => setVariantsLoading(false));
      } else {
        setLoadedOptionGroups([]);
        setLoadedVariants([]);
      }
    }
  }, [open, product]);

  // Mark dirty on any input
  const markDirty = useCallback(() => {
    if (!isDirty) setIsDirty(true);
  }, [isDirty]);

  // Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        setImagePath(data.path);
        markDirty();
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }, [markDirty]);

  // Handle form submit
  const handleSubmit = useCallback(
    (formData: FormData) => {
      setError(null);
      formData.set("image", imagePath || "");
      // translations is already set by MultiLangInput's hidden input

      if (isEdit && product) {
        formData.set("id", product.id);
        formData.set("version", String(product.version));
      }
      startTransition(async () => {
        const result = isEdit ? await updateProduct(formData) : await createProduct(formData);
        if (result.success) {
          setIsDirty(false);
          onClose();
        } else {
          setError(result.error || "Something went wrong");
        }
      });
    },
    [isEdit, product, imagePath, onClose]
  );

  // Header
  const sheetHeader = (
    <div className="flex items-center justify-between h-12 px-5">
      <button
        onClick={onClose}
        disabled={isPending}
        aria-label={t(locale, "common.close")}
        className="h-8 w-8 rounded-[var(--radius-sm)] flex items-center justify-center text-text-tertiary hover:bg-surface-hover transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
      <h2 className="text-[15px] font-semibold text-text-primary">
        {isEdit ? t(locale, "items.editItem") : t(locale, "items.createItem")}
      </h2>
      <button
        type="button"
        disabled={isPending || uploading}
        onClick={() => formRef.current?.requestSubmit()}
        className="h-8 px-4 rounded-[var(--radius-sm)] bg-accent text-white text-[13px] font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {isPending ? (
          <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Check className="h-3.5 w-3.5" />
            {t(locale, "common.save")}
          </>
        )}
      </button>
    </div>
  );

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      isDirty={isDirty}
      snapPoints={[1.0]}
      header={sheetHeader}
    >
      <form
        ref={formRef}
        action={handleSubmit}
        onChange={markDirty}
        className="px-5 pb-8 max-w-5xl mx-auto"
      >
        {/* Error */}
        {error && (
          <div className="text-[13px] text-danger bg-danger-light px-3 py-2.5 rounded-[var(--radius-md)] border border-danger/10 mb-5 mt-2">
            {error}
          </div>
        )}

        {/* 2-column layout on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8 mt-2">
          {/* ─── LEFT COLUMN: Main form ─── */}
          <div className="space-y-5">
            {/* Image upload */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">
                {t(locale, "items.image")}
              </label>
              {imagePath ? (
                <div className="relative w-full aspect-[3/2] rounded-[var(--radius-md)] border border-border overflow-hidden bg-surface-hover group max-w-[320px]">
                  <img src={imagePath} alt="Product" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImagePath(null); markDirty(); }}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full max-w-[320px] h-32 rounded-[var(--radius-md)] border-2 border-dashed border-border hover:border-accent/40 hover:bg-accent-light cursor-pointer transition-colors">
                  {uploading ? (
                    <span className="h-6 w-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-text-tertiary mb-2" strokeWidth={1.5} />
                      <span className="text-[12px] text-text-secondary">{t(locale, "items.uploadImage")}</span>
                      <span className="text-[11px] text-text-tertiary mt-0.5">{t(locale, "items.uploadHint")}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </label>
              )}
            </div>

            {/* Product name (English) */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                {t(locale, "items.productName")} <span className="text-danger">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                defaultValue={product?.name || ""}
                placeholder={t(locale, "items.productNamePlaceholder")}
                className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>

            {/* Translations — dynamic multi-language input */}
            <MultiLangInput
              name="translations"
              value={translations}
              onChange={setTranslations}
              label={t(locale, "items.translations")}
              placeholder="{lang} name"
              onDirty={markDirty}
              addLanguageLabel={t(locale, "items.addLanguage")}
              removeLabel={t(locale, "items.removeTranslation")}
            />

            <div className="border-t border-border" />

            {/* Description (new field) */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                {t(locale, "items.description")}
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue=""
                placeholder={t(locale, "items.descriptionPlaceholder")}
                className="w-full px-3 py-2.5 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
              />
            </div>

            {/* SKU + Barcode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">{t(locale, "items.sku")}</label>
                <input
                  name="sku"
                  type="text"
                  defaultValue={product?.sku || ""}
                  placeholder={t(locale, "items.skuPlaceholder")}
                  className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">{t(locale, "items.barcode")}</label>
                <input
                  name="barcode"
                  type="text"
                  defaultValue={product?.barcode || ""}
                  placeholder={t(locale, "items.barcodePlaceholder")}
                  className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                  {t(locale, "items.sellingPrice")} <span className="text-danger">*</span>
                </label>
                <input
                  name="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={product?.sellingPrice || ""}
                  placeholder="0.00"
                  className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                  {t(locale, "items.costPrice")}
                </label>
                <input
                  name="originalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={product?.originalPrice || ""}
                  placeholder="0.00"
                  className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Side panel ─── */}
          <div className="space-y-5 md:border-l md:border-border md:pl-6">
            {/* Status */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">
                {t(locale, "items.availability")}
              </label>
              <div className="space-y-2">
                {[
                  { value: "active", label: t(locale, "common.statusActive"), desc: "Visible to customers", color: "border-success/30 bg-success-light" },
                  { value: "draft", label: t(locale, "common.statusDraft"), desc: "Hidden, work in progress", color: "border-warning/30 bg-warning-light" },
                  { value: "inactive", label: t(locale, "common.statusInactive"), desc: "Temporarily unavailable", color: "border-border bg-surface-hover" },
                ].map((s) => (
                  <label key={s.value} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={s.value}
                      defaultChecked={product ? product.status === s.value : s.value === "active"}
                      className="peer hidden"
                    />
                    <div className={cn(
                      "px-3.5 py-2.5 rounded-[var(--radius-md)] border transition-all",
                      "peer-checked:ring-2 peer-checked:ring-accent/20 peer-checked:border-accent",
                      s.color
                    )}>
                      <p className="text-[13px] font-medium text-text-primary">{s.label}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t border-border" />

            {/* Category */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                {t(locale, "items.category")}
              </label>
              <select
                name="categoryId"
                defaultValue={product?.categoryId || ""}
                className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all appearance-none cursor-pointer"
              >
                <option value="">{t(locale, "items.noCategory")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.nameCn ? `(${cat.nameCn})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-border" />

            {/* Inventory */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-medium text-text-primary">{t(locale, "items.inventory")}</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[12px] text-text-secondary">{t(locale, "common.unlimited")}</span>
                  <button
                    type="button"
                    onClick={() => { setUnlimitedStock(!unlimitedStock); markDirty(); }}
                    className={cn(
                      "relative h-5 w-9 rounded-full transition-colors",
                      unlimitedStock ? "bg-accent" : "bg-border-strong"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      unlimitedStock ? "translate-x-[18px]" : "translate-x-0.5"
                    )} />
                  </button>
                </label>
              </div>
              {!unlimitedStock && (
                <input
                  name="stock"
                  type="number"
                  min="0"
                  defaultValue={product?.stock ?? ""}
                  placeholder="0"
                  className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all tabular-nums"
                />
              )}
              {unlimitedStock && <input type="hidden" name="stock" value="" />}
            </div>

            <div className="border-t border-border" />

            {/* Popular toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                <span className="text-[13px] font-medium text-text-primary">{t(locale, "items.markPopular")}</span>
              </div>
              <input type="hidden" name="isPopular" value={product?.isPopular ? "true" : "false"} />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  input.value = input.value === "true" ? "false" : "true";
                  e.currentTarget.setAttribute("data-checked", input.value);
                  markDirty();
                }}
                data-checked={product?.isPopular ? "true" : "false"}
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  "data-[checked=true]:bg-warning data-[checked=false]:bg-border-strong"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                  product?.isPopular ? "translate-x-[18px]" : "translate-x-0.5"
                )} />
              </button>
            </label>
          </div>
        </div>

        {/* Variant editor — full width below the 2-column layout, only in edit mode */}
        {isEdit && product && !variantsLoading && (
          <div className="mt-6">
            <VariantEditor
              productId={product.id}
              initialGroups={loadedOptionGroups}
              initialVariants={loadedVariants}
              hasVariants={product.hasVariants || false}
              onDirty={markDirty}
            />
          </div>
        )}
        {isEdit && variantsLoading && (
          <div className="mt-6 flex items-center justify-center py-8 text-text-tertiary">
            <span className="h-5 w-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin mr-2" />
            Loading variants...
          </div>
        )}
      </form>
    </BottomSheet>
  );
}
