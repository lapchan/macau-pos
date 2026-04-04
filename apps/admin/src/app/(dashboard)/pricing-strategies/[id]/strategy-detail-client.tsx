"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  updateStrategy,
  deleteStrategy,
  upsertStrategyItem,
  removeStrategyItem,
} from "@/lib/pricing-strategy-actions";
import type { PricingStrategy } from "@macau-pos/database";
import type { StrategyItemRow } from "@/lib/pricing-strategy-queries";
import {
  ArrowLeft,
  DollarSign,
  Settings,
  Package,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────

type Tab = "overrides" | "settings";

interface AvailableProduct {
  id: string;
  name: string;
  translations: Record<string, string> | null;
  sellingPrice: string;
  originalPrice: string | null;
  stock: number | null;
  sku: string | null;
  image: string | null;
}

interface Props {
  strategy: PricingStrategy;
  items: StrategyItemRow[];
  availableProducts: AvailableProduct[];
}

// ─── Shared UI ──────────────────────────────────────────────

function SuccessToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-[var(--radius-md)] shadow-lg">
        <Check className="h-4 w-4 text-emerald-600" />
        <span className="text-[13px] font-medium text-emerald-700">{message}</span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function StrategyDetailClient({ strategy, items, availableProducts }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overrides");
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleRemoveItem(itemId: string) {
    startTransition(async () => {
      const result = await removeStrategyItem(itemId, strategy.id);
      if (result.success) {
        showToast("Override removed");
        router.refresh();
      }
    });
  }

  function handleToggleAvailability(item: StrategyItemRow) {
    const formData = new FormData();
    formData.set("strategyId", strategy.id);
    formData.set("productId", item.productId);
    formData.set("sellingPrice", item.sellingPrice ?? "");
    formData.set("isAvailable", String(!item.isAvailable));
    startTransition(async () => {
      const result = await upsertStrategyItem(formData);
      if (result.success) {
        showToast(item.isAvailable ? "Product hidden" : "Product visible");
        router.refresh();
      }
    });
  }

  function handleAddProduct(productId: string) {
    const formData = new FormData();
    formData.set("strategyId", strategy.id);
    formData.set("productId", productId);
    formData.set("isAvailable", "true");
    startTransition(async () => {
      const result = await upsertStrategyItem(formData);
      if (result.success) {
        showToast("Product added");
        router.refresh();
      }
    });
  }

  function handleSavePrice(item: StrategyItemRow, newPrice: string) {
    const formData = new FormData();
    formData.set("strategyId", strategy.id);
    formData.set("productId", item.productId);
    formData.set("sellingPrice", newPrice);
    formData.set("isAvailable", String(item.isAvailable));
    startTransition(async () => {
      const result = await upsertStrategyItem(formData);
      if (result.success) {
        showToast("Price updated");
        router.refresh();
      }
    });
  }

  function handleUpdateStrategy(formData: FormData) {
    startTransition(async () => {
      const result = await updateStrategy(formData);
      if (result.success) {
        showToast("Strategy updated");
        router.refresh();
      }
    });
  }

  function handleDelete() {
    if (!confirm("Delete this strategy? Locations will revert to catalog defaults.")) return;
    startTransition(async () => {
      const result = await deleteStrategy(strategy.id);
      if (result.success) {
        router.push("/pricing-strategies");
      }
    });
  }

  const TABS = [
    { id: "overrides" as const, label: "Product Overrides", icon: Package },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/pricing-strategies"
          className="inline-flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Pricing Strategies
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{strategy.name}</h1>
            {strategy.description && (
              <p className="text-xs text-text-tertiary mt-0.5">{strategy.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors",
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Overrides Tab */}
      {tab === "overrides" && (
        <div className="space-y-4">
          {/* Add product button */}
          <div className="flex justify-between items-center">
            <p className="text-[13px] text-text-tertiary">
              {items.length} product override{items.length !== 1 ? "s" : ""} · Products without overrides use catalog defaults
            </p>
            <button
              onClick={() => setShowAddProduct(!showAddProduct)}
              className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-accent text-white rounded-md hover:bg-accent/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Override
            </button>
          </div>

          {/* Add product dropdown */}
          {showAddProduct && availableProducts.length > 0 && (
            <div className="border border-border rounded-lg bg-surface overflow-hidden max-h-60 overflow-y-auto">
              {availableProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleAddProduct(p.id)}
                  disabled={isPending}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-surface-hover transition-colors border-b border-border/50 last:border-0"
                >
                  <div>
                    <span className="text-[13px] font-medium text-text-primary">{p.name}</span>
                    {p.sku && <span className="text-[11px] text-text-tertiary ml-2">{p.sku}</span>}
                  </div>
                  <span className="text-[13px] text-text-secondary">MOP {p.sellingPrice}</span>
                </button>
              ))}
            </div>
          )}
          {showAddProduct && availableProducts.length === 0 && (
            <p className="text-xs text-text-tertiary py-3 text-center border border-dashed border-border rounded-lg">
              All products already have overrides in this strategy
            </p>
          )}

          {/* Overrides table */}
          {items.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_100px_100px_80px_60px] gap-2 px-4 py-2 bg-surface-hover text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
                <span>Product</span>
                <span>Catalog</span>
                <span>Override</span>
                <span>Visible</span>
                <span />
              </div>

              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "grid grid-cols-[1fr_100px_100px_80px_60px] gap-2 px-4 py-3 items-center border-t border-border/50",
                    !item.isAvailable && "opacity-50 bg-surface-hover/30"
                  )}
                >
                  {/* Product name */}
                  <div>
                    <span className="text-[13px] font-medium text-text-primary">{item.productName}</span>
                    {item.productSku && (
                      <span className="text-[10px] text-text-tertiary ml-2">{item.productSku}</span>
                    )}
                  </div>

                  {/* Catalog price */}
                  <span className="text-[13px] text-text-tertiary">{item.catalogPrice}</span>

                  {/* Override price */}
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={item.sellingPrice ?? ""}
                    placeholder="—"
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val !== (item.sellingPrice ?? "")) {
                        handleSavePrice(item, val);
                      }
                    }}
                    className="h-8 w-24 px-2 text-[13px] border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />

                  {/* Visibility toggle */}
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    disabled={isPending}
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded",
                      item.isAvailable
                        ? "text-emerald-600 hover:bg-emerald-50"
                        : "text-red-500 hover:bg-red-50"
                    )}
                  >
                    {item.isAvailable ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={isPending}
                    className="text-text-tertiary hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && !showAddProduct && (
            <div className="text-center py-12 border border-dashed border-border rounded-lg">
              <Package className="h-8 w-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-sm text-text-secondary font-medium">No product overrides</p>
              <p className="text-xs text-text-tertiary mt-1">All products will use catalog default prices</p>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="space-y-6">
          <form action={handleUpdateStrategy}>
            <input type="hidden" name="id" value={strategy.id} />
            <div className="bg-surface border border-border rounded-[var(--radius-lg)] overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-[15px] font-semibold text-text-primary">Strategy Details</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[13px] font-medium text-text-primary">Name *</label>
                  <input
                    name="name"
                    required
                    defaultValue={strategy.name}
                    className="w-full mt-1 h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-text-primary">Description</label>
                  <input
                    name="description"
                    defaultValue={strategy.description ?? ""}
                    placeholder="Optional description"
                    className="w-full mt-1 h-10 px-3 text-[14px] bg-background border border-border rounded-[var(--radius-md)] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="h-10 px-6 rounded-[var(--radius-md)] bg-accent text-white text-[13px] font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="bg-surface border border-red-200 rounded-[var(--radius-lg)] overflow-hidden">
            <div className="px-6 py-4 border-b border-red-200">
              <h3 className="text-[15px] font-semibold text-red-600">Danger Zone</h3>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-text-primary">Delete this strategy</p>
                <p className="text-[12px] text-text-tertiary">Locations will revert to catalog default pricing</p>
              </div>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="h-9 px-4 text-[13px] font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Delete Strategy
              </button>
            </div>
          </div>
        </div>
      )}

      <SuccessToast message={toast} />
    </div>
  );
}
