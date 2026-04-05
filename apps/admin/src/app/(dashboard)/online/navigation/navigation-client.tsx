"use client";

import { useState } from "react";
import { ArrowLeftIcon, PlusIcon, ChevronUpIcon, ChevronDownIcon, Trash2Icon, GripVerticalIcon, MenuIcon, FootprintsIcon } from "lucide-react";
import { savePreferences } from "@/lib/actions/storefront-actions";

type NavLink = {
  label: string;
  href: string;
  type: "category" | "page" | "custom";
};

type Config = {
  branding: Record<string, unknown>;
  header: Record<string, unknown>;
  footer: Record<string, unknown>;
};

const DEFAULT_HEADER_LINKS: NavLink[] = [
  { label: "口罩/呼吸器", href: "/tc/categories/facemask-respirator", type: "category" },
  { label: "飲品", href: "/tc/categories/beverages", type: "category" },
  { label: "零食", href: "/tc/categories/snacks", type: "category" },
  { label: "冷凍", href: "/tc/categories/frozen", type: "category" },
  { label: "乳製品", href: "/tc/categories/dairy", type: "category" },
  { label: "家居", href: "/tc/categories/household", type: "category" },
  { label: "全部商品", href: "/tc/products", type: "custom" },
];

const COMMON_PAGES = [
  { label: "關於我們", href: "/tc/pages/about" },
  { label: "條款及細則", href: "/tc/pages/terms" },
  { label: "私隱政策", href: "/tc/pages/privacy" },
  { label: "退換貨政策", href: "/tc/pages/returns" },
  { label: "聯絡我們", href: "/tc/pages/contact" },
];

export default function NavigationClient({ initialConfig }: { initialConfig: Config }) {
  const h = initialConfig.header;
  const savedLinks = (h.navLinks as NavLink[]);
  const [headerLinks, setHeaderLinks] = useState<NavLink[]>(
    savedLinks && savedLinks.length > 0 ? savedLinks : DEFAULT_HEADER_LINKS
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const moveLink = (index: number, direction: "up" | "down") => {
    const next = [...headerLinks];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setHeaderLinks(next);
  };

  const removeLink = (index: number) => {
    setHeaderLinks(headerLinks.filter((_, i) => i !== index));
  };

  const addLink = () => {
    if (!newLabel.trim() || !newHref.trim()) return;
    setHeaderLinks([...headerLinks, { label: newLabel.trim(), href: newHref.trim(), type: "custom" }]);
    setNewLabel("");
    setNewHref("");
    setShowAddForm(false);
  };

  const addPageLink = (page: { label: string; href: string }) => {
    if (headerLinks.some((l) => l.href === page.href)) return;
    setHeaderLinks([...headerLinks, { ...page, type: "page" }]);
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await savePreferences({
      header: { ...initialConfig.header, navLinks: headerLinks },
    });
    setSaving(false);
    if (result.success) {
      setToast({ type: "success", message: "Navigation saved!" });
    } else {
      setToast({ type: "error", message: result.error || "Failed to save" });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const inputClass = "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/online" className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]">
            <ArrowLeftIcon size={20} />
          </a>
          <div>
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Navigation</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">Manage your storefront header navigation</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-[var(--accent)] px-5 py-2 text-[13px] font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {toast && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${toast.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ============================================================ */}
        {/* Main menu links                                              */}
        {/* ============================================================ */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MenuIcon size={18} className="text-gray-500" />
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Main Menu</h2>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                {headerLinks.length} items
              </span>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
            >
              <PlusIcon size={14} />
              Add Link
            </button>
          </div>

          {/* Link list */}
          <div className="space-y-1.5">
            {headerLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-white px-3 py-2.5">
                <GripVerticalIcon size={14} className="shrink-0 text-gray-300" />

                {/* Up/Down */}
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button onClick={() => moveLink(i, "up")} disabled={i === 0} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                    <ChevronUpIcon size={12} />
                  </button>
                  <button onClick={() => moveLink(i, "down")} disabled={i === headerLinks.length - 1} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                    <ChevronDownIcon size={12} />
                  </button>
                </div>

                {/* Link info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{link.label}</p>
                  <p className="text-[11px] text-gray-400 truncate">{link.href}</p>
                </div>

                {/* Type badge */}
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  link.type === "category" ? "bg-blue-50 text-blue-600" :
                  link.type === "page" ? "bg-green-50 text-green-600" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {link.type}
                </span>

                {/* Delete */}
                <button onClick={() => removeLink(i)} className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2Icon size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add custom link form */}
          {showAddForm && (
            <div className="mt-3 rounded-lg border border-dashed border-[var(--border-default)] bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Add Custom Link</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Label</label>
                  <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className={inputClass} placeholder="Sale" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">URL</label>
                  <input type="text" value={newHref} onChange={(e) => setNewHref(e.target.value)} className={inputClass} placeholder="/tc/products?category=特價" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={addLink} disabled={!newLabel.trim() || !newHref.trim()} className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
                  Add
                </button>
                <button onClick={() => { setShowAddForm(false); setNewLabel(""); setNewHref(""); }} className="rounded-lg border border-gray-300 px-4 py-1.5 text-[13px] font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {headerLinks.length === 0 && !showAddForm && (
            <div className="mt-4 rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
              <p className="text-sm text-gray-500">No navigation links. Add some to customize your header.</p>
              <button onClick={() => setShowAddForm(true)} className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Add first link
              </button>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* Quick add panel                                              */}
        {/* ============================================================ */}
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">Quick Add</h2>

          {/* Pages */}
          <div className="rounded-lg border border-[var(--border-default)] bg-white overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Store Pages</p>
            </div>
            <div className="divide-y divide-gray-50">
              {COMMON_PAGES.map((page) => {
                const alreadyAdded = headerLinks.some((l) => l.href === page.href);
                return (
                  <div key={page.href} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-gray-700">{page.label}</span>
                    <button
                      onClick={() => addPageLink(page)}
                      disabled={alreadyAdded}
                      className={`rounded px-2 py-1 text-[11px] font-medium ${alreadyAdded ? "text-gray-400 cursor-default" : "text-indigo-600 hover:bg-indigo-50"}`}
                    >
                      {alreadyAdded ? "Added" : "+ Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset */}
          <button
            onClick={() => setHeaderLinks(DEFAULT_HEADER_LINKS)}
            className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
