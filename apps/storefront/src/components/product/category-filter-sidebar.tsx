"use client";

import { useState } from "react";
import { FunnelIcon, XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

type Category = {
  id: string;
  slug: string | null;
  name: string;
  count?: number;
};

type PriceRange = {
  min: number;
  max: number;
  label: string;
};

type Props = {
  categories: Category[];
  selectedCategorySlug?: string | null;
  priceRanges?: PriceRange[];
  selectedPriceRange?: { min?: number; max?: number };
  sortOptions?: { value: string; label: string }[];
  selectedSort?: string;
  locale: string;
  onCategoryChange?: (slug: string | null) => void;
  onPriceChange?: (range: { min?: number; max?: number }) => void;
  onSortChange?: (sort: string) => void;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function CategoryFilterSidebar({
  categories,
  selectedCategorySlug,
  priceRanges,
  selectedSort,
  sortOptions,
  locale,
  onCategoryChange,
  onSortChange,
}: Props) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  const defaultSortOptions = sortOptions || [
    { value: "popular", label: t(locale, "熱門", "Most Popular", "Mais Popular", "人気順") },
    { value: "newest", label: t(locale, "最新", "Newest", "Mais Recente", "新着順") },
    { value: "price_asc", label: t(locale, "價格低到高", "Price: Low to High", "Preço: Menor para Maior", "価格: 安い順") },
    { value: "price_desc", label: t(locale, "價格高到低", "Price: High to Low", "Preço: Maior para Menor", "価格: 高い順") },
  ];

  const defaultPriceRanges = priceRanges || [
    { min: 0, max: 10, label: `MOP 0 - 10` },
    { min: 10, max: 25, label: `MOP 10 - 25` },
    { min: 25, max: 50, label: `MOP 25 - 50` },
    { min: 50, max: 100, label: `MOP 50 - 100` },
    { min: 100, max: 99999, label: `MOP 100+` },
  ];

  const FilterContent = () => (
    <>
      {/* Sort */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-sm font-medium text-gray-900">
          {t(locale, "排序", "Sort by", "Ordenar por", "並び替え")}
        </h3>
        <div className="mt-3 space-y-2">
          {defaultSortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSortChange?.(opt.value)}
              className={`block w-full text-left text-sm px-2 py-1.5 rounded-md ${selectedSort === opt.value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="border-b border-gray-200 py-6">
        <button
          type="button"
          onClick={() => setCategoryOpen(!categoryOpen)}
          className="-mx-2 -my-3 flex w-full items-center justify-between px-2 py-3 text-gray-400 hover:text-gray-500"
        >
          <span className="text-sm font-medium text-gray-900">
            {t(locale, "分類", "Category", "Categoria", "カテゴリー")}
          </span>
          <ChevronDownIcon className={`size-5 transition-transform ${categoryOpen ? "rotate-180" : ""}`} />
        </button>
        {categoryOpen && (
          <div className="mt-4 space-y-2">
            <button
              onClick={() => onCategoryChange?.(null)}
              className={`block w-full text-left text-sm px-2 py-1.5 rounded-md ${!selectedCategorySlug ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {t(locale, "全部", "All", "Todos", "すべて")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onCategoryChange?.(cat.slug)}
                className={`flex w-full items-center justify-between text-left text-sm px-2 py-1.5 rounded-md ${selectedCategorySlug === cat.slug ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <span>{cat.name}</span>
                {cat.count !== undefined && <span className="text-xs text-gray-400">{cat.count}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price */}
      <div className="py-6">
        <button
          type="button"
          onClick={() => setPriceOpen(!priceOpen)}
          className="-mx-2 -my-3 flex w-full items-center justify-between px-2 py-3 text-gray-400 hover:text-gray-500"
        >
          <span className="text-sm font-medium text-gray-900">
            {t(locale, "價格", "Price", "Preço", "価格")}
          </span>
          <ChevronDownIcon className={`size-5 transition-transform ${priceOpen ? "rotate-180" : ""}`} />
        </button>
        {priceOpen && (
          <div className="mt-4 space-y-2">
            {defaultPriceRanges.map((range) => (
              <button
                key={range.label}
                className="block w-full text-left text-sm px-2 py-1.5 rounded-md text-gray-600 hover:bg-gray-50"
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <FunnelIcon className="size-4" />
          {t(locale, "篩選", "Filters", "Filtros", "フィルター")}
        </button>
      </div>

      {/* Mobile filter dialog */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/25" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xs flex-col overflow-y-auto bg-white px-4 py-4 shadow-xl">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-lg font-medium text-gray-900">
                {t(locale, "篩選", "Filters", "Filtros", "フィルター")}
              </h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="-mr-2 flex size-10 items-center justify-center rounded-md bg-white p-2 text-gray-400"
              >
                <XMarkIcon className="size-6" />
              </button>
            </div>
            <FilterContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>
    </>
  );
}
