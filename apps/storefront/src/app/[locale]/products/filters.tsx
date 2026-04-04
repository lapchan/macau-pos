"use client";

import { useState } from "react";
import { XMarkIcon, FunnelIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";

type Category = {
  name: string;
  slug: string | null;
  href: string;
  active: boolean;
};

type SortOption = {
  value: string;
  label: string;
  href: string;
};

type Props = {
  categories: Category[];
  allHref: string;
  currentCategorySlug?: string;
  locale: string;
  sortOptions: SortOption[];
  currentSort: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function ProductFilters({ categories, allHref, currentCategorySlug, locale, sortOptions, currentSort }: Props) {
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(true);
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

      {/* Mobile filter dialog */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/25 animate-fade-in" onClick={() => setOpen(false)} />

          {/* Panel — slides from right */}
          <div className="fixed inset-y-0 right-0 z-40 flex">
            <div className="relative ml-auto flex size-full max-w-xs flex-col overflow-y-auto bg-white pt-4 pb-6 shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {t(locale, "篩選", "Filters", "Filtros", "フィルター")}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="relative -mr-2 flex size-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-50"
                >
                  <XMarkIcon className="size-6" />
                </button>
              </div>

              {/* Filter sections */}
              <div className="mt-4 border-t border-gray-200">
                {/* Category links */}
                <h3 className="sr-only">Categories</h3>
                <ul role="list" className="px-2 py-3 font-medium text-gray-900">
                  <li>
                    <a
                      href={allHref}
                      onClick={() => setOpen(false)}
                      className={`block px-2 py-3 ${!currentCategorySlug ? "text-indigo-600 font-semibold" : ""}`}
                    >
                      {t(locale, "全部", "All", "Todos", "すべて")}
                    </a>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.slug}>
                      <a
                        href={cat.href}
                        onClick={() => setOpen(false)}
                        className={`block px-2 py-3 ${cat.active ? "text-indigo-600 font-semibold" : ""}`}
                      >
                        {cat.name}
                      </a>
                    </li>
                  ))}
                </ul>

                {/* Category checkbox filter */}
                <div className="border-t border-gray-200 px-4 py-6">
                  <h3 className="-mx-2 -my-3 flow-root">
                    <button
                      type="button"
                      onClick={() => setCategoryOpen(!categoryOpen)}
                      className="flex w-full items-center justify-between bg-white px-2 py-3 text-gray-400 hover:text-gray-500"
                    >
                      <span className="font-medium text-gray-900">
                        {t(locale, "分類", "Category", "Categoria", "カテゴリー")}
                      </span>
                      <span className="ml-6 flex items-center">
                        {categoryOpen ? (
                          <MinusIcon className="size-5" />
                        ) : (
                          <PlusIcon className="size-5" />
                        )}
                      </span>
                    </button>
                  </h3>
                  {categoryOpen && (
                    <div className="pt-6 space-y-6">
                      {categories.map((cat, i) => (
                        <div key={cat.slug} className="flex gap-3">
                          <div className="flex h-5 shrink-0 items-center">
                            <input
                              id={`filter-mobile-cat-${i}`}
                              type="checkbox"
                              defaultChecked={cat.active}
                              onChange={() => { window.location.href = cat.active ? allHref : cat.href; }}
                              className="size-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </div>
                          <label htmlFor={`filter-mobile-cat-${i}`} className="min-w-0 flex-1 text-gray-500">
                            {cat.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort */}
                <div className="border-t border-gray-200 px-4 py-6">
                  <h3 className="-mx-2 -my-3 flow-root">
                    <button
                      type="button"
                      onClick={() => setSortOpen(!sortOpen)}
                      className="flex w-full items-center justify-between bg-white px-2 py-3 text-gray-400 hover:text-gray-500"
                    >
                      <span className="font-medium text-gray-900">
                        {t(locale, "排序", "Sort", "Ordenar", "並べ替え")}
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
                    <div className="pt-6 space-y-6">
                      {sortOptions.map((opt, i) => (
                        <div key={opt.value} className="flex gap-3">
                          <div className="flex h-5 shrink-0 items-center">
                            <input
                              id={`filter-mobile-sort-${i}`}
                              type="checkbox"
                              defaultChecked={currentSort === opt.value}
                              onChange={() => { window.location.href = opt.href; }}
                              className="size-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </div>
                          <label htmlFor={`filter-mobile-sort-${i}`} className="min-w-0 flex-1 text-gray-500">
                            {opt.label}
                          </label>
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
