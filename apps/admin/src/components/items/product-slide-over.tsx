"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import {
  X,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Star,
} from "lucide-react";
import { createProduct, updateProduct } from "@/lib/product-actions";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";

type CategoryOption = {
  id: string;
  name: string;
  nameCn?: string;
};

type ProductData = {
  id: string;
  name: string;
  nameCn: string | null;
  nameJa: string | null;
  namePt: string | null;
  sku: string | null;
  barcode: string | null;
  image: string | null;
  sellingPrice: string;
  originalPrice: string | null;
  stock: number | null;
  categoryId: string | null;
  status: string;
  isPopular: boolean;
  version: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  product?: ProductData | null;
  categories: CategoryOption[];
};

export default function ProductSlideOver({ open, onClose, product, categories }: Props) {
  const { locale } = useLocale();
  const isEdit = !!product;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showTranslations, setShowTranslations] = useState(false);
  const [unlimitedStock, setUnlimitedStock] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form when product changes
  useEffect(() => {
    if (open) {
      setError(null);
      setImagePath(product?.image || null);
      setShowTranslations(!!(product?.nameJa || product?.namePt));
      setUnlimitedStock(product ? product.stock === null : true);
    }
  }, [open, product]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open && !isPending) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, isPending]);

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
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  // Handle form submit
  const handleSubmit = useCallback(
    (formData: FormData) => {
      setError(null);
      formData.set("image", imagePath || "");

      if (isEdit && product) {
        formData.set("id", product.id);
        formData.set("version", String(product.version));
      }

      startTransition(async () => {
        const result = isEdit ? await updateProduct(formData) : await createProduct(formData);
        if (result.success) {
          onClose();
        } else {
          setError(result.error || "Something went wrong");
        }
      });
    },
    [isEdit, product, imagePath, onClose]
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 animate-[fadeIn_0.2s_ease-out]"
        onClick={isPending ? undefined : onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[480px] bg-surface border-l border-border shadow-2xl flex flex-col animate-[slideInRight_0.3s_cubic-bezier(0.16,1,0.3,1)]">
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-5 border-b border-border shrink-0">
          <h2 className="text-[15px] font-semibold text-text-primary">
            {isEdit ? t(locale, "items.editProduct") : t(locale, "items.addProduct")}
          </h2>
          <button
            onClick={onClose}
            disabled={isPending}
            aria-label={t(locale, "common.close")}
            className="h-8 w-8 rounded-[var(--radius-sm)] flex items-center justify-center text-text-tertiary hover:bg-surface-hover transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} action={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {/* Error */}
            {error && (
              <div className="text-[13px] text-danger bg-danger-light px-3 py-2.5 rounded-[var(--radius-md)] border border-danger/10">
                {error}
              </div>
            )}

            {/* Image upload */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">{t(locale, "items.image")}</label>
              {imagePath ? (
                <div className="relative w-full aspect-[3/2] rounded-[var(--radius-md)] border border-border overflow-hidden bg-surface-hover group">
                  <img
                    src={imagePath}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePath(null)}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 rounded-[var(--radius-md)] border-2 border-dashed border-border hover:border-accent/40 hover:bg-accent-light cursor-pointer transition-colors">
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

            {/* Product name (English — required) */}
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

            {/* Chinese name */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">
                {t(locale, "items.chineseName")}
              </label>
              <input
                name="nameCn"
                type="text"
                defaultValue={product?.nameCn || ""}
                placeholder={t(locale, "items.chineseNamePlaceholder")}
                className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>

            {/* More translations (collapsible) */}
            <div>
              <button
                type="button"
                onClick={() => setShowTranslations(!showTranslations)}
                className="flex items-center gap-1.5 text-[12px] text-text-secondary hover:text-text-primary transition-colors"
              >
                {showTranslations ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                {t(locale, "items.moreTranslations")}
              </button>
              {showTranslations && (
                <div className="mt-3 space-y-3">
                  <input
                    name="nameJa"
                    type="text"
                    defaultValue={product?.nameJa || ""}
                    placeholder={t(locale, "items.japaneseName")}
                    className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                  <input
                    name="namePt"
                    type="text"
                    defaultValue={product?.namePt || ""}
                    placeholder={t(locale, "items.portugueseName")}
                    className="w-full h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

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

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Stock */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-medium text-text-primary">{t(locale, "items.inventory")}</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[12px] text-text-secondary">{t(locale, "common.unlimited")}</span>
                  <button
                    type="button"
                    onClick={() => setUnlimitedStock(!unlimitedStock)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      unlimitedStock ? "bg-accent" : "bg-border-strong"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        unlimitedStock ? "translate-x-[18px]" : "translate-x-0.5"
                      }`}
                    />
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

            {/* Category */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-1.5">{t(locale, "items.category")}</label>
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

            {/* Status */}
            <div>
              <label className="block text-[13px] font-medium text-text-primary mb-2">{t(locale, "common.status")}</label>
              <div className="flex gap-2">
                {[
                  { value: "active", label: t(locale, "common.statusActive"), color: "bg-success-light text-success" },
                  { value: "draft", label: t(locale, "common.statusDraft"), color: "bg-warning-light text-warning" },
                  { value: "inactive", label: t(locale, "common.statusInactive"), color: "bg-surface-hover text-text-secondary" },
                ].map((s) => (
                  <label key={s.value} className="flex-1">
                    <input
                      type="radio"
                      name="status"
                      value={s.value}
                      defaultChecked={
                        product ? product.status === s.value : s.value === "active"
                      }
                      className="peer hidden"
                    />
                    <div className={`h-10 rounded-[var(--radius-md)] border border-border flex items-center justify-center text-[13px] font-medium cursor-pointer transition-all peer-checked:border-accent peer-checked:ring-2 peer-checked:ring-accent/20 hover:bg-surface-hover ${s.color}`}>
                      {s.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Popular toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />
                <span className="text-[13px] font-medium text-text-primary">{t(locale, "items.markPopular")}</span>
              </div>
              <input
                type="hidden"
                name="isPopular"
                value={product?.isPopular ? "true" : "false"}
              />
              <button
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  input.value = input.value === "true" ? "false" : "true";
                  e.currentTarget.setAttribute(
                    "data-checked",
                    input.value
                  );
                }}
                data-checked={product?.isPopular ? "true" : "false"}
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  product?.isPopular ? "bg-warning" : "bg-border-strong"
                } data-[checked=true]:bg-warning data-[checked=false]:bg-border-strong`}
              >
                <div
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    product?.isPopular ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                  style={{}}
                />
              </button>
            </label>
          </div>
        </form>

        {/* Sticky footer */}
        <div className="flex gap-2.5 p-5 border-t border-border shrink-0 bg-surface">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 h-10 rounded-[var(--radius-md)] border border-border text-[13px] font-medium text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            {t(locale, "common.cancel")}
          </button>
          <button
            type="button"
            disabled={isPending || uploading}
            onClick={() => formRef.current?.requestSubmit()}
            className="flex-1 h-10 rounded-[var(--radius-md)] bg-accent text-white text-[13px] font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isEdit ? (
              t(locale, "common.saveChanges")
            ) : (
              t(locale, "items.addProduct")
            )}
          </button>
        </div>
      </div>
    </>
  );
}
