"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/shared/card";
import {
  Search, Plus, Upload, Download, MoreHorizontal, Package,
  ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight,
  Edit2, Copy, Trash2, Eye,
} from "lucide-react";

export type Product = {
  id: string;
  name: string;
  nameCn: string | null;
  sku: string | null;
  price: number;
  cost: number | null;
  stock: number | null;
  category: string;
  status: "active" | "draft" | "inactive" | "sold_out";
  image: string | null;
  updatedAt: Date;
};

type SortKey = "name" | "price" | "stock" | "category" | "updatedAt";
type SortDir = "asc" | "desc";

const statusBadge: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-success-light text-success" },
  draft: { label: "Draft", className: "bg-warning-light text-warning" },
  inactive: { label: "Inactive", className: "bg-surface-hover text-text-tertiary" },
  sold_out: { label: "Sold Out", className: "bg-danger-light text-danger" },
};

function SortIcon({ columnKey, activeKey, dir }: { columnKey: SortKey; activeKey: SortKey; dir: SortDir }) {
  if (columnKey !== activeKey) return <ArrowUpDown className="h-3 w-3" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

type Props = {
  products: Product[];
  categories: string[];
};

export default function ItemsClient({ products, categories }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All items");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

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
          (p.nameCn && p.nameCn.includes(q)) ||
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

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }

  function toggleAll() {
    selected.size === filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map((p) => p.id)));
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const isFiltered = activeCategory !== "All items" || search.length > 0;
  const subtitle = isFiltered
    ? `${filtered.length} of ${products.length} items`
    : `${products.length} items in catalog`;

  return (
    <>
      <PageHeader title="Items & services" subtitle={subtitle}>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-[var(--radius-sm)] hover:bg-surface-hover transition-colors">
            <Upload className="h-3.5 w-3.5" /> Import
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-[var(--radius-sm)] hover:bg-surface-hover transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-text-primary rounded-[var(--radius-sm)] hover:opacity-90 active:scale-[0.98] transition-all">
            <Plus className="h-4 w-4" /> Add item
          </button>
        </div>
      </PageHeader>

      {/* Category tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-border overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
              activeCategory === cat
                ? "border-text-primary text-text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search + bulk */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Search items by name, SKU..."
            aria-label="Search items"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface border border-border rounded-[var(--radius-sm)] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
          />
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-text-secondary">{selected.size} selected</span>
            <button className="px-3 py-1.5 text-xs font-medium text-danger border border-danger/20 rounded-[var(--radius-sm)] hover:bg-danger-light transition-colors">Delete</button>
            <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 text-xs font-medium text-text-secondary border border-border rounded-[var(--radius-sm)] hover:bg-surface-hover transition-colors">Clear</button>
          </div>
        )}
        <span className="text-xs text-text-tertiary ml-auto">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Items catalog">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all items" className="rounded border-border-strong accent-accent" />
                </th>
                {([
                  { key: "name" as SortKey, label: "Item" },
                  { key: "category" as SortKey, label: "Category" },
                  { key: "price" as SortKey, label: "Price", right: true },
                  { key: "stock" as SortKey, label: "Stock", right: true },
                ] as const).map((col) => (
                  <th key={col.key} className={cn("px-4 py-3", col.right ? "text-right" : "text-left")}>
                    <button
                      onClick={() => toggleSort(col.key)}
                      aria-label={`Sort by ${col.label}`}
                      className={cn("inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:text-text-primary transition-colors", sortKey === col.key ? "text-text-primary" : "text-text-secondary", col.right && "ml-auto")}
                    >
                      {col.label}
                      <SortIcon columnKey={col.key} activeKey={sortKey} dir={sortDir} />
                    </button>
                  </th>
                ))}
                <th className="text-left px-4 py-3"><span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</span></th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const badge = statusBadge[product.status] || statusBadge.active;
                const isSelected = selected.has(product.id);
                return (
                  <tr key={product.id} className={cn("border-b border-border last:border-0 transition-colors group", isSelected ? "bg-accent-light/30" : "hover:bg-surface-hover/50")}>
                    <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(product.id)} aria-label={`Select ${product.name}`} className="rounded border-border-strong accent-accent" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-surface-hover flex items-center justify-center shrink-0"><Package className="h-5 w-5 text-text-tertiary" strokeWidth={1.5} /></div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary truncate">{product.name}</p>
                          <p className="text-xs text-text-tertiary truncate">{product.nameCn}{product.sku ? ` · ${product.sku}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{product.category}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-text-primary">MOP {product.price.toFixed(1)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={cn("font-medium", product.stock === 0 ? "text-danger" : (product.stock || 0) < 30 ? "text-warning" : "text-text-primary")}>
                        {product.stock ?? "∞"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex px-2 py-0.5 text-xs font-medium rounded-[var(--radius-full)]", badge.className)}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button onClick={() => setMenuOpen(menuOpen === product.id ? null : product.id)} aria-label={`Actions for ${product.name}`} aria-expanded={menuOpen === product.id} className="p-1 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuOpen === product.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                            <div role="menu" className="absolute right-0 top-full mt-1 w-36 bg-surface border border-border rounded-[var(--radius-md)] shadow-lg z-20 py-1">
                              {[
                                { icon: Eye, label: "View" },
                                { icon: Edit2, label: "Edit" },
                                { icon: Copy, label: "Duplicate" },
                                { icon: Trash2, label: "Delete", danger: true },
                              ].map((action) => (
                                <button key={action.label} role="menuitem" onClick={() => setMenuOpen(null)} className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors", "danger" in action && action.danger ? "text-danger hover:bg-danger-light" : "text-text-secondary hover:bg-surface-hover hover:text-text-primary")}>
                                  <action.icon className="h-3.5 w-3.5" />{action.label}
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
                <tr><td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-[var(--radius-md)] bg-surface-hover flex items-center justify-center mb-3"><Package className="h-6 w-6 text-text-tertiary" strokeWidth={1.5} /></div>
                    <p className="text-sm font-medium text-text-primary mb-1">No items found</p>
                    <p className="text-xs text-text-secondary">Try adjusting your search or filter</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-text-tertiary">Showing 1–{filtered.length} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button disabled aria-label="Previous page" className="p-1.5 rounded-[var(--radius-sm)] text-text-tertiary disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <button aria-label="Page 1" aria-current="page" className="h-8 w-8 rounded-[var(--radius-sm)] text-sm font-medium bg-text-primary text-white">1</button>
              <button disabled aria-label="Next page" className="p-1.5 rounded-[var(--radius-sm)] text-text-tertiary disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
