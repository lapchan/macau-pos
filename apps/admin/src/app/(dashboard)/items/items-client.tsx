"use client";

import { useState, useMemo, useEffect, useCallback, useTransition, Fragment } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import ProductEditor from "@/components/items/product-editor";
import DeleteConfirmDialog from "@/components/items/delete-confirm-dialog";
import BulkActionsBar from "@/components/items/bulk-actions-bar";
import CategoryManager, { type CategoryWithCount } from "@/components/items/category-manager";
import { deleteProduct, bulkDeleteProducts, bulkUpdateStatus } from "@/lib/product-actions";
import { getProductVariants } from "@/lib/variant-actions";
import { useLocale } from "@/i18n/context";
import { t } from "@/i18n/locales";
import { interpolate } from "@macau-pos/i18n";
import {
  Search, Plus, Upload, Download, MoreHorizontal, Package,
  ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, ChevronDown,
  Edit2, Copy, Trash2, Settings2, Layers,
} from "lucide-react";

export type Product = {
  id: string;
  name: string;
  translations?: Record<string, string> | null;
  sku: string | null;
  barcode?: string | null;
  price: number;
  sellingPrice?: string;
  originalPrice?: string | null;
  cost: number | null;
  stock: number | null;
  category: string;
  categoryId?: string | null;
  status: "active" | "draft" | "inactive" | "sold_out";
  image: string | null;
  isPopular?: boolean;
  hasVariants?: boolean;
  variantCount?: number;
  version?: number;
  updatedAt: Date;
};

export type CategoryOption = {
  id: string;
  name: string;
  nameCn?: string;
};

type SortKey = "name" | "price" | "stock" | "category" | "updatedAt";
type SortDir = "asc" | "desc";

const statusDotColor: Record<string, string> = {
  active: "bg-success",
  draft: "bg-warning",
  inactive: "bg-text-tertiary",
  sold_out: "bg-danger",
};

const statusBadgeClass: Record<string, string> = {
  active: "bg-success-light text-success",
  draft: "bg-warning-light text-warning",
  inactive: "bg-surface-hover text-text-tertiary",
  sold_out: "bg-danger-light text-danger",
};

const statusLabelKeys: Record<string, string> = {
  active: "common.statusActive",
  draft: "common.statusDraft",
  inactive: "common.statusInactive",
  sold_out: "common.statusSoldOut",
};

function SortIcon({ columnKey, activeKey, dir }: { columnKey: SortKey; activeKey: SortKey; dir: SortDir }) {
  if (columnKey !== activeKey) return <ArrowUpDown className="h-3 w-3" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

type Props = {
  products: Product[];
  categories: string[];
  categoryOptions?: CategoryOption[];
  categoriesForManager?: CategoryWithCount[];
};

const ITEMS_PER_PAGE = 25;

export default function ItemsClient({ products, categories, categoryOptions = [], categoriesForManager = [] }: Props) {
  const { locale } = useLocale();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All items");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [variantCache, setVariantCache] = useState<Record<string, { name: string; sku: string | null; image: string | null; sellingPrice: string; stock: number | null; isActive: boolean; optionCombo: Record<string, string> }[]>>({});

  // CRUD state
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [slideOverOpen, setSlideOverOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && menuOpen) setMenuOpen(null);
  }, [menuOpen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCategory !== "All items") {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          ((p as any).nameCn && (p as any).nameCn.includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null || bVal == null) return 0;
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [products, search, activeCategory, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, activeCategory]);

  // Toggle variant expansion
  const toggleExpand = useCallback(async (productId: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) { next.delete(productId); } else { next.add(productId); }
      return next;
    });
    // Fetch variants if not cached
    if (!variantCache[productId]) {
      try {
        const variants = await getProductVariants(productId);
        setVariantCache((prev) => ({
          ...prev,
          [productId]: variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            image: v.image,
            sellingPrice: v.sellingPrice,
            stock: v.stock,
            isActive: v.isActive,
            optionCombo: v.optionCombo as Record<string, string>,
          })),
        }));
      } catch (err) {
        console.error("Failed to load variants:", err);
      }
    }
  }, [variantCache]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function toggleAll() {
    selected.size === paginatedItems.length ? setSelected(new Set()) : setSelected(new Set(paginatedItems.map((p) => p.id)));
  }

  // CRUD handlers
  const handleAdd = () => { setEditingProduct(null); setSlideOverOpen(true); };
  const handleEdit = (product: Product) => { setEditingProduct(product); setSlideOverOpen(true); setMenuOpen(null); };
  const handleDeleteClick = (product: Product) => { setDeleteTarget({ id: product.id, name: product.name }); setMenuOpen(null); };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    startDeleteTransition(async () => {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      setSelected((prev) => { const next = new Set(prev); next.delete(deleteTarget.id); return next; });
    });
  };

  const handleBulkDelete = () => {
    startDeleteTransition(async () => {
      await bulkDeleteProducts([...selected]);
      setBulkDeleteOpen(false);
      setSelected(new Set());
    });
  };

  const handleBulkStatusChange = (status: string) => {
    startDeleteTransition(async () => {
      await bulkUpdateStatus([...selected], status);
      setSelected(new Set());
    });
  };

  const allSelected = paginatedItems.length > 0 && paginatedItems.every(p => selected.has(p.id));
  const isFiltered = activeCategory !== "All items" || search.length > 0;
  const subtitle = isFiltered
    ? interpolate(t(locale, "items.filteredCount"), { filtered: filtered.length, total: products.length })
    : interpolate(t(locale, "items.itemCount"), { count: products.length });

  return (
    <>
      <PageHeader title={t(locale, "items.title")} subtitle={subtitle}>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-[var(--radius-sm)] hover:bg-surface-hover transition-colors">
            <Upload className="h-3.5 w-3.5" /> {t(locale, "common.import")}
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-[var(--radius-sm)] hover:bg-surface-hover transition-colors">
            <Download className="h-3.5 w-3.5" /> {t(locale, "common.export")}
          </button>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" /> {t(locale, "items.addItem")}
          </button>
        </div>
      </PageHeader>

      {/* Category tabs — scrollable with hidden scrollbar */}
      <div className="flex items-center gap-0.5 mb-4 border-b border-border overflow-x-auto scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-3 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors -mb-px shrink-0",
              activeCategory === cat
                ? "border-text-primary text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong"
            )}
          >
            {cat}
          </button>
        ))}
        {/* Manage categories button */}
        <button
          onClick={() => setCategoryManagerOpen(true)}
          aria-label={t(locale, "items.manageCategories")}
          title={t(locale, "items.manageCategories")}
          className="ml-auto px-2 py-2.5 text-text-tertiary hover:text-text-primary transition-colors shrink-0 -mb-px border-b-2 border-transparent"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder={t(locale, "items.searchPlaceholder")}
            aria-label={t(locale, "common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          />
        </div>
        <span className="text-xs text-text-tertiary ml-auto">{interpolate(t(locale, "items.itemsCount"), { count: filtered.length })}</span>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-hidden">
          <table className="w-full text-sm" aria-label={t(locale, "items.title")}>
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 px-3 py-3 shrink-0">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={t(locale, "items.selectAll")} className="rounded border-border-strong accent-accent" />
                </th>
                <th className="text-left px-3 py-3">
                  <button onClick={() => toggleSort("name")} aria-label={interpolate(t(locale, "items.sortBy"), { column: t(locale, "items.colItem") })} className={cn("inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:text-text-primary transition-colors", sortKey === "name" ? "text-text-primary" : "text-text-secondary")}>
                    {t(locale, "items.colItem")}
                    <SortIcon columnKey="name" activeKey={sortKey} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-3 py-3 hidden lg:table-cell">
                  <button onClick={() => toggleSort("category")} aria-label={interpolate(t(locale, "items.sortBy"), { column: t(locale, "items.colCategory") })} className={cn("inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:text-text-primary transition-colors whitespace-nowrap", sortKey === "category" ? "text-text-primary" : "text-text-secondary")}>
                    {t(locale, "items.colCategory")}
                    <SortIcon columnKey="category" activeKey={sortKey} dir={sortDir} />
                  </button>
                </th>
                <th className="text-right px-3 py-3">
                  <button onClick={() => toggleSort("price")} aria-label={interpolate(t(locale, "items.sortBy"), { column: t(locale, "items.colPrice") })} className={cn("inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:text-text-primary transition-colors ml-auto whitespace-nowrap", sortKey === "price" ? "text-text-primary" : "text-text-secondary")}>
                    {t(locale, "items.colPrice")}
                    <SortIcon columnKey="price" activeKey={sortKey} dir={sortDir} />
                  </button>
                </th>
                <th className="text-right px-3 py-3">
                  <button onClick={() => toggleSort("stock")} aria-label={interpolate(t(locale, "items.sortBy"), { column: t(locale, "items.colStock") })} className={cn("inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:text-text-primary transition-colors ml-auto whitespace-nowrap", sortKey === "stock" ? "text-text-primary" : "text-text-secondary")}>
                    {t(locale, "items.colStock")}
                    <SortIcon columnKey="stock" activeKey={sortKey} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-3 py-3"><span className="text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">{t(locale, "items.colStatus")}</span></th>
                <th className="px-3 py-3 text-right" />
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((product) => {
                const badgeClass = statusBadgeClass[product.status] || statusBadgeClass.active;
                const badgeLabel = t(locale, (statusLabelKeys[product.status] || "common.statusActive") as any);
                const isSelected = selected.has(product.id);
                return (<Fragment key={product.id}>
                  <tr className={cn("border-b border-border last:border-0 transition-colors group cursor-pointer", isSelected ? "bg-accent-light/30" : "hover:bg-surface-hover/50")} onClick={(e) => { if ((e.target as HTMLElement).closest("button, input, a, [role=menuitem]")) return; handleEdit(product); }}>
                    <td className="px-3 py-2.5"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(product.id)} aria-label={interpolate(t(locale, "items.selectItem"), { name: product.name })} className="rounded border-border-strong accent-accent" /></td>
                    <td className="px-3 py-2.5 max-w-[400px]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Expand chevron for products with variants */}
                        {product.hasVariants && (product.variantCount || 0) > 0 ? (
                          <button
                            onClick={() => toggleExpand(product.id)}
                            aria-label="Toggle variants"
                            className="h-5 w-5 flex items-center justify-center shrink-0 text-text-tertiary hover:text-text-primary transition-colors"
                          >
                            <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expandedProducts.has(product.id) && "rotate-90")} />
                          </button>
                        ) : (
                          <div className="w-5 shrink-0" />
                        )}
                        <div className="h-9 w-9 rounded-[var(--radius-sm)] bg-surface-hover flex items-center justify-center shrink-0 overflow-hidden">
                          {product.image ? (
                            <img src={product.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-4 w-4 text-text-tertiary" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[13px] font-medium text-text-primary truncate">{product.name}</p>
                            {product.hasVariants && (product.variantCount || 0) > 0 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-accent bg-accent-light rounded-[var(--radius-full)] shrink-0">
                                <Layers className="h-2.5 w-2.5" />
                                {product.variantCount}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-text-tertiary truncate">{product.translations?.en || ""}{product.sku ? ` · ${product.sku}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] text-text-secondary truncate hidden lg:table-cell">{product.category}</td>
                    <td className="px-3 py-2.5 text-right text-[13px] font-medium tabular-nums text-text-primary whitespace-nowrap">${product.price.toFixed(0)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <span className={cn("text-[13px] font-medium", product.stock === 0 ? "text-danger" : (product.stock || 0) < 30 ? "text-warning" : "text-text-primary")}>
                        {product.stock ?? "∞"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="relative group/status flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", statusDotColor[product.status] || "bg-text-tertiary")} />
                        {/* Text — hidden on small screens, show on lg */}
                        <span className="hidden lg:inline text-[12px] text-text-secondary whitespace-nowrap">{badgeLabel}</span>
                        {/* Tooltip — only when text is hidden */}
                        <div className="lg:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[11px] font-medium text-white bg-text-primary rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 pointer-events-none group-hover/status:opacity-100 transition-opacity shadow-lg">
                          {badgeLabel}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-text-primary" />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 justify-end">
                        {/* Edit button — icon-only on small screens with tooltip, icon+text on large */}
                        <div className="relative group/edit">
                          <button
                            onClick={() => handleEdit(product)}
                            aria-label={`${t(locale, "common.edit")} ${product.name}`}
                            className="h-7 w-7 lg:w-auto lg:px-2.5 rounded-[var(--radius-sm)] text-[12px] font-medium text-text-secondary border border-border hover:bg-surface-hover hover:text-text-primary transition-colors flex items-center justify-center lg:justify-start gap-1"
                          >
                            <Edit2 className="h-3 w-3 shrink-0" />
                            <span className="hidden lg:inline">{t(locale, "common.edit")}</span>
                          </button>
                          {/* Tooltip — only on small screens where text is hidden */}
                          <div className="lg:hidden absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[11px] font-medium text-white bg-text-primary rounded-[var(--radius-sm)] whitespace-nowrap opacity-0 pointer-events-none group-hover/edit:opacity-100 transition-opacity shadow-lg">
                            {t(locale, "common.edit")}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-text-primary" />
                          </div>
                        </div>
                        {/* More menu */}
                        <div className="relative">
                          <button onClick={() => setMenuOpen(menuOpen === product.id ? null : product.id)} aria-label={interpolate(t(locale, "items.actionsFor"), { name: product.name })} className="h-7 w-7 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors flex items-center justify-center">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menuOpen === product.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
                              <div role="menu" className="fixed z-50 w-36 bg-surface border border-border rounded-[var(--radius-md)] shadow-xl py-1" style={{ top: 'auto', right: 16 }}>
                                <button role="menuitem" onClick={() => setMenuOpen(null)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors">
                                  <Copy className="h-3.5 w-3.5" /> {t(locale, "common.duplicate")}
                                </button>
                                <button role="menuitem" onClick={() => handleDeleteClick(product)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-light transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" /> {t(locale, "common.delete")}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  {/* Variant sub-rows */}
                  {expandedProducts.has(product.id) && variantCache[product.id]?.map((variant, vi) => (
                    <tr key={`${product.id}-v-${vi}`} className={cn("border-b border-border last:border-0", variant.isActive ? "bg-surface-hover/20" : "bg-surface-hover/40 opacity-60")}>
                      <td className="px-3 py-1.5" />
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2 min-w-0 pl-5">
                          {/* Tree connector */}
                          <div className="w-5 shrink-0 flex justify-center">
                            <div className="w-px h-full bg-border-strong/40" />
                          </div>
                          {/* Variant image */}
                          <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-surface-hover flex items-center justify-center shrink-0 overflow-hidden">
                            {variant.image ? (
                              <img src={variant.image} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-3 w-3 text-text-tertiary" strokeWidth={1.5} />
                            )}
                          </div>
                          {/* Variant info */}
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium text-text-secondary truncate">
                              {Object.values(variant.optionCombo).join(" / ")}
                            </p>
                            {variant.sku && <p className="text-[10px] text-text-tertiary">{variant.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 hidden lg:table-cell" />
                      <td className="px-3 py-1.5 text-right text-[12px] tabular-nums text-text-secondary">${parseFloat(variant.sellingPrice).toFixed(0)}</td>
                      <td className="px-3 py-1.5 text-right text-[12px] tabular-nums text-text-tertiary">{variant.stock ?? "∞"}</td>
                      <td className="px-3 py-1.5">
                        {/* Variant status dot */}
                        <div className="flex items-center gap-1.5">
                          <span className={cn("h-2 w-2 rounded-full shrink-0", variant.isActive ? "bg-success" : "bg-text-tertiary")} />
                        </div>
                      </td>
                      <td className="px-3 py-1.5" />
                    </tr>
                  ))}
                  {expandedProducts.has(product.id) && !variantCache[product.id] && (
                    <tr className="bg-surface-hover/30 border-b border-border">
                      <td colSpan={7} className="px-3 py-3 text-center">
                        <span className="h-4 w-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin inline-block" />
                      </td>
                    </tr>
                  )}
                </Fragment>);
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center mb-3"><Package className="h-6 w-6 text-text-tertiary" strokeWidth={1.5} /></div>
                    <p className="text-sm font-medium text-text-primary mb-1">{t(locale, "items.noItemsFound")}</p>
                    <p className="text-xs text-text-secondary">{t(locale, "items.noItemsHint")}</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2.5 border-t border-border">
            <span className="text-xs text-text-tertiary">
              {interpolate(t(locale, "common.showingRange"), {
                start: startIdx + 1,
                end: Math.min(startIdx + ITEMS_PER_PAGE, filtered.length),
                total: filtered.length,
              })}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-0.5">
                {/* Previous */}
                <button
                  disabled={safeCurrentPage <= 1}
                  onClick={() => setCurrentPage(safeCurrentPage - 1)}
                  aria-label={t(locale, "common.previousPage")}
                  className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-sm)] text-text-tertiary hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page numbers */}
                {(() => {
                  const pages: (number | "...")[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (safeCurrentPage > 3) pages.push("...");
                    const start = Math.max(2, safeCurrentPage - 1);
                    const end = Math.min(totalPages - 1, safeCurrentPage + 1);
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (safeCurrentPage < totalPages - 2) pages.push("...");
                    pages.push(totalPages);
                  }
                  return pages.map((p, idx) =>
                    p === "..." ? (
                      <span key={`dots-${idx}`} className="h-8 w-6 flex items-center justify-center text-xs text-text-tertiary">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        aria-label={`Page ${p}`}
                        aria-current={p === safeCurrentPage ? "page" : undefined}
                        className={cn(
                          "h-8 min-w-[32px] px-1.5 rounded-[var(--radius-sm)] text-[13px] font-medium transition-colors",
                          p === safeCurrentPage
                            ? "bg-text-primary text-white"
                            : "text-text-secondary hover:bg-surface-hover"
                        )}
                      >
                        {p}
                      </button>
                    )
                  );
                })()}

                {/* Next */}
                <button
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() => setCurrentPage(safeCurrentPage + 1)}
                  aria-label={t(locale, "common.nextPage")}
                  className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-sm)] text-text-tertiary hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── CRUD Overlays ── */}

      {/* Product editor (bottom sheet) */}
      <ProductEditor
        key={editingProduct?.id || "new"}
        open={slideOverOpen}
        onClose={() => { setSlideOverOpen(false); setEditingProduct(null); }}
        product={editingProduct ? {
          id: editingProduct.id,
          name: editingProduct.name,
          translations: editingProduct.translations || null,
          sku: editingProduct.sku,
          barcode: editingProduct.barcode || null,
          image: editingProduct.image,
          sellingPrice: editingProduct.sellingPrice || String(editingProduct.price),
          originalPrice: editingProduct.originalPrice || null,
          stock: editingProduct.stock,
          categoryId: editingProduct.categoryId || null,
          status: editingProduct.status,
          isPopular: editingProduct.isPopular || false,
          hasVariants: editingProduct.hasVariants || false,
          version: editingProduct.version || 1,
          optionGroups: [],
          variants: [],
        } : null}
        categories={categoryOptions}
      />

      {/* Delete confirmation (single) */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        productName={deleteTarget?.name}
        isPending={isDeleting}
      />

      {/* Delete confirmation (bulk) */}
      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        count={selected.size}
        isPending={isDeleting}
      />

      {/* Bulk actions bar */}
      <BulkActionsBar
        count={selected.size}
        onDelete={() => setBulkDeleteOpen(true)}
        onStatusChange={handleBulkStatusChange}
        onClear={() => setSelected(new Set())}
      />

      {/* Category manager */}
      <CategoryManager
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        categories={categoriesForManager}
      />
    </>
  );
}
