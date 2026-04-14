"use client";

import { useState } from "react";
import { XMarkIcon, FunnelIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";

type CategoryNode = {
  name: string;
  slug: string | null;
  href: string;
  active: boolean;
  children?: CategoryNode[];
};

type Category = {
  name: string;
  slug: string | null;
  href: string;
  active: boolean;
  parentCategoryId?: string | null;
};

type SortOption = {
  value: string;
  label: string;
  href: string;
};

type Props = {
  categoryTree: CategoryNode[];
  categories: Category[];
  allHref: string;
  currentCategorySlug?: string;
  locale: string;
  sortOptions: SortOption[];
  currentSort: string;
};

const t = (locale: string, tc: string, en: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt: en, ja: en };
  return m[locale] || en;
};

export default function ProductFilters({ categoryTree, categories, allHref, currentCategorySlug, locale, sortOptions, currentSort }: Props) {
  const [open, setOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  return (
    <>
      {/* Mobile filter button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-m-2 ml-4 p-2 text-gray-400 hover:text-gray-500 sm:ml-6 lg:hidden"
      >
        <span className="sr-only">Filters</span>
        <FunnelIcon className="size-5" aria-hidden="true" />
      </button>

      {/* Mobile filter slide-over */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/25" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-40 flex">
            <div className="relative ml-auto flex size-full max-w-xs flex-col overflow-y-auto bg-white pt-4 pb-12 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {t(locale, "篩選", "Filters")}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="relative -mr-2 flex size-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-50"
                >
                  <XMarkIcon className="size-6" />
                </button>
              </div>

              {/* Category tree */}
              <div className="mt-4 border-t border-gray-200">
                <h3 className="sr-only">Categories</h3>

                {/* All products link */}
                <div className="px-4 pt-4">
                  <a
                    href={allHref}
                    onClick={() => setOpen(false)}
                    className={`block py-2 text-sm font-medium ${!currentCategorySlug ? "text-sf-accent" : "text-gray-900"}`}
                  >
                    {t(locale, "全部商品", "All Products")}
                  </a>
                </div>

                {/* Category tree — drill-down style */}
                <ul role="list" className="px-4 space-y-1 pb-4">
                  {(() => {
                    // Find active parent
                    const activeParent = categoryTree.find(
                      (p) => p.active || p.children?.some((c) => c.active)
                    );

                    // Drill-down: if a parent is active, show only that parent + its sub-categories
                    if (activeParent) {
                      const hasChildren = activeParent.children && activeParent.children.length > 0;
                      return (
                        <li>
                          <a
                            href={activeParent.href}
                            onClick={() => setOpen(false)}
                            className={`block py-2 text-sm font-medium ${activeParent.active ? "text-sf-accent" : "font-semibold text-gray-900"}`}
                          >
                            {activeParent.name}
                          </a>
                          {hasChildren && (
                            <ul className="ml-4 space-y-1 pb-2">
                              {activeParent.children!.map((child) => (
                                <li key={child.slug || child.name}>
                                  <a
                                    href={child.href}
                                    onClick={() => setOpen(false)}
                                    className={`block py-1.5 text-sm ${child.active ? "text-sf-accent font-medium" : "text-gray-500 hover:text-gray-700"}`}
                                  >
                                    {child.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    }

                    // No active parent: show all top-level categories
                    return categoryTree.map((parent) => (
                      <li key={parent.slug || parent.name}>
                        <a
                          href={parent.href}
                          onClick={() => setOpen(false)}
                          className="block py-2 text-sm font-medium text-gray-900 hover:text-gray-600"
                        >
                          {parent.name}
                        </a>
                      </li>
                    ));
                  })()}
                </ul>

                {/* Sort section */}
                <div className="border-t border-gray-200 px-4 py-6">
                  <h3 className="-mx-2 -my-3 flow-root">
                    <button
                      type="button"
                      onClick={() => setSortOpen(!sortOpen)}
                      className="flex w-full items-center justify-between bg-white px-2 py-3 text-gray-400 hover:text-gray-500"
                    >
                      <span className="font-medium text-gray-900">
                        {t(locale, "排序", "Sort by")}
                      </span>
                      <span className="ml-6 flex items-center">
                        {sortOpen ? (
                          <MinusIcon className="size-5" />
                        ) : (
                          <PlusIcon className="size-5" />
                        )}
                      </span>
                    </button>
                  </h3>
                  {sortOpen && (
                    <div className="pt-6 space-y-4">
                      {sortOptions.map((opt) => (
                        <div key={opt.value}>
                          <a
                            href={opt.href}
                            onClick={() => setOpen(false)}
                            className={`block text-sm ${currentSort === opt.value ? "text-sf-accent font-medium" : "text-gray-500 hover:text-gray-700"}`}
                          >
                            {opt.label}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
