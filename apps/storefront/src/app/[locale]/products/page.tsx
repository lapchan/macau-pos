import type { Metadata } from "next";
import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontProducts, getStorefrontCategories, getStorefrontConfig } from "@/lib/storefront-queries";
import { getDisplayName } from "@macau-pos/database";
import { notFound } from "next/navigation";
import Image from "@/components/shared/store-thumb";
import ProductCard from "@/components/product/product-card";
import ProductFilters from "./filters";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

const t = (locale: string, tc: string, en: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt: en, ja: en };
  return m[locale] || en;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const tenant = await resolveTenant();
  if (!tenant) return {};

  const categorySlug = sp.category;
  if (categorySlug) {
    const categories = await getStorefrontCategories(tenant.id);
    const cat = categories.find((c) => c.slug === categorySlug);
    if (cat) {
      const catName = getDisplayName(cat.name, cat.translations as Record<string, string>, locale);
      return {
        title: catName,
        description: t(locale, `${catName} — 瀏覽我們的${catName}系列`, `${catName} — Browse our ${catName} collection`),
      };
    }
  }

  return {
    title: t(locale, "全部商品", "All Products"),
    description: t(locale, "瀏覽我們的精選商品", "Browse our curated product collection"),
  };
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const categorySlug = sp.category;
  const search = sp.q;
  const sortBy = (sp.sort as "newest" | "price_asc" | "price_desc" | "popular" | "name") || "popular";
  const page = parseInt(sp.page || "1");
  const cardView = (sp.view as "grid" | "overlay" | "details" | "border" | "swatches") || "grid";

  const [{ products, total, totalPages }, allCategories, config] = await Promise.all([
    getStorefrontProducts(tenant.id, {
      categorySlug: categorySlug || undefined,
      search: search || undefined,
      sortBy,
      page,
      pageSize: 24,
    }),
    getStorefrontCategories(tenant.id),
    getStorefrontConfig(tenant.id),
  ]);

  const branding = config.branding as Record<string, unknown>;
  const themeId = (branding?.themeId as string) || "modern";

  // Build category hierarchy: top-level + children
  const topCategories = allCategories.filter((c) => !c.parentCategoryId);
  const childCategories = allCategories.filter((c) => c.parentCategoryId);
  const categoryTree = topCategories.map((parent) => ({
    ...parent,
    displayName: getDisplayName(parent.name, parent.translations as Record<string, string>, locale),
    children: childCategories
      .filter((c) => c.parentCategoryId === parent.id)
      .map((c) => ({
        ...c,
        displayName: getDisplayName(c.name, c.translations as Record<string, string>, locale),
      })),
  }));

  const currentCategory = categorySlug
    ? allCategories.find((c) => c.slug === categorySlug)
    : null;
  const pageTitle = currentCategory
    ? getDisplayName(currentCategory.name, currentCategory.translations as Record<string, string>, locale)
    : t(locale, "新品上架", "New Arrivals");

  // Build URL helper
  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = {
      category: categorySlug,
      sort: sortBy !== "popular" ? sortBy : undefined,
      q: search,
      page: page > 1 ? String(page) : undefined,
      view: cardView !== "grid" ? cardView : undefined,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return `/${locale}/products${qs ? `?${qs}` : ""}`;
  };

  const sortOptions = [
    { value: "popular", label: t(locale, "最熱門", "Most Popular"), href: buildUrl({ sort: undefined, page: undefined }) },
    { value: "newest", label: t(locale, "最新", "Newest"), href: buildUrl({ sort: "newest", page: undefined }) },
    { value: "price_asc", label: t(locale, "價格低到高", "Price: Low to High"), href: buildUrl({ sort: "price_asc", page: undefined }) },
    { value: "price_desc", label: t(locale, "價格高到低", "Price: High to Low"), href: buildUrl({ sort: "price_desc", page: undefined }) },
  ];

  // Flat category links for mobile
  const categoryLinks = allCategories.map((cat) => ({
    name: getDisplayName(cat.name, cat.translations as Record<string, string>, locale),
    slug: cat.slug,
    href: buildUrl({ category: cat.slug || undefined, page: undefined }),
    active: categorySlug === cat.slug,
    parentCategoryId: cat.parentCategoryId,
  }));

  // Sidebar tree data for filters component
  const sidebarTree = categoryTree.map((parent) => ({
    name: parent.displayName,
    slug: parent.slug,
    href: buildUrl({ category: parent.slug || undefined, page: undefined }),
    active: categorySlug === parent.slug,
    children: parent.children.map((child) => ({
      name: child.displayName,
      slug: child.slug,
      href: buildUrl({ category: child.slug || undefined, page: undefined }),
      active: categorySlug === child.slug,
    })),
  }));

  /* ─── HUMAN MADE variant ───
     Full-width grid, white image bg, near-zero gap, large title
     Matches humanmade.jp/zh_hant/all/ exactly
  */
  if (themeId === "humanmade") {
    const hmPageTitle = currentCategory ? pageTitle.toUpperCase() : t(locale, "新品上架", "NEW ARRIVALS");

    return (
      <div className="bg-white">
        <main className="w-full">
          {/* Breadcrumb — flush left with page padding */}
          <nav aria-label="Breadcrumb" className="px-4 pt-4 pb-2 sm:px-6">
            <ol className="flex items-center gap-1.5 text-[#121212]/50" style={{ fontSize: "11px", letterSpacing: "0.06em" }}>
              <li><a href={`/${locale}`} className="hover:text-[#121212] transition-colors">TOP</a></li>
              <li><span className="mx-0.5">›</span></li>
              {currentCategory ? (
                <>
                  <li><a href={`/${locale}/products`} className="hover:text-[#121212] transition-colors">{t(locale, "全部商品", "ALL ITEMS")}</a></li>
                  <li><span className="mx-0.5">›</span></li>
                  <li className="text-[#121212]">{pageTitle.toUpperCase()}</li>
                </>
              ) : (
                <li className="text-[#121212]">{hmPageTitle}</li>
              )}
            </ol>
          </nav>

          {/* Page title — large, centered, like humanmade.jp */}
          <div className="pt-8 pb-10 text-center">
            <h1
              className="text-[#121212] font-normal"
              style={{ fontSize: "32px", letterSpacing: "0.12em", lineHeight: "1.2" }}
            >
              {hmPageTitle}
            </h1>
          </div>

          {/* VIEW ALL COLORS toggle row — right-aligned */}
          <div className="flex items-center justify-end px-4 pb-4 sm:px-6">
            <SortDropdownHM options={sortOptions} currentSort={sortBy} />
          </div>

          {/* Product grid — 2 cols mobile, 4 cols desktop, ZERO horizontal gap like humanmade.jp */}
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[#121212]/50" style={{ fontSize: "12px", letterSpacing: "0.05em" }}>
                {t(locale, "找不到商品", "No products found")}
              </p>
              <a
                href={`/${locale}/products`}
                className="mt-4 inline-block text-[#121212]/60 hover:text-[#121212] transition-colors"
                style={{ fontSize: "12px", letterSpacing: "0.05em" }}
              >
                {t(locale, "查看全部商品", "VIEW ALL ITEMS")} →
              </a>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: "0px" }}>
                {products.map((product) => {
                  const pName = getDisplayName(product.name, product.translations as Record<string, string>, locale);
                  const pPrice = parseFloat(String(product.sellingPrice));
                  const pHref = product.slug ? `/${locale}/products/${product.slug}` : "#";
                  const pInStock = product.stock == null || (product.stock as number) > 0;

                  return (
                    <a
                      key={product.id}
                      href={pHref}
                      className="group block"
                    >
                      {/* Image — 1:1 square, white bg, object-contain, zero gap between tiles */}
                      <div className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: "1/1" }}>
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={pName}
                            fill
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-contain object-center transition-transform duration-500 ease-in-out group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center bg-[#f7f7f7] text-[#121212]/8">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.3">
                              <rect width="18" height="18" x="3" y="3" rx="1" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                          </div>
                        )}
                        {/* Sold out overlay */}
                        {!pInStock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-[#121212]/30">
                            <span className="text-white font-medium" style={{ fontSize: "14px", letterSpacing: "0.15em" }}>SOLD OUT</span>
                          </div>
                        )}
                      </div>

                      {/* Product info — below image with small padding */}
                      <div className="px-2 pt-2 pb-6">
                        <div style={{ height: "17px" }}>
                          <span className="text-[#dc3545]" style={{ fontSize: "10px", letterSpacing: "0.05em" }}>NEW</span>
                        </div>
                        <h3
                          className="text-[#121212] line-clamp-2 sm:line-clamp-1"
                          style={{ fontSize: "12px", letterSpacing: "0.05em", lineHeight: "1.5" }}
                        >
                          {pName}
                        </h3>
                        <p className="mt-0.5 text-[#121212]" style={{ fontSize: "12px", letterSpacing: "0.05em" }}>
                          MOP${pPrice.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                        </p>
                        {/* Color swatches */}
                        <div className="mt-2 flex gap-px">
                          <span className="block bg-[#121212]" style={{ height: "8px", width: "35px" }} />
                          <span className="block bg-[#bbb]" style={{ height: "8px", width: "35px" }} />
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-4 flex items-center justify-center gap-4 border-t border-[#121212]/8 py-8">
                  {page > 1 && (
                    <a
                      href={buildUrl({ page: String(page - 1) })}
                      className="text-[#121212]/60 hover:text-[#121212] transition-colors"
                      style={{ fontSize: "12px", letterSpacing: "0.05em" }}
                    >
                      ← {t(locale, "上一頁", "PREV")}
                    </a>
                  )}
                  <span className="text-[#121212]/40" style={{ fontSize: "12px", letterSpacing: "0.05em" }}>
                    {page} / {totalPages}
                  </span>
                  {page < totalPages && (
                    <a
                      href={buildUrl({ page: String(page + 1) })}
                      className="text-[#121212]/60 hover:text-[#121212] transition-colors"
                      style={{ fontSize: "12px", letterSpacing: "0.05em" }}
                    >
                      {t(locale, "下一頁", "NEXT")} →
                    </a>
                  )}
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="pt-6">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
            <li><a href={`/${locale}`} className="hover:text-gray-700">{t(locale, "首頁", "Home")}</a></li>
            <li><span className="text-gray-300">/</span></li>
            {currentCategory ? (
              <>
                <li><a href={`/${locale}/products`} className="hover:text-gray-700">{t(locale, "全部商品", "All Products")}</a></li>
                <li><span className="text-gray-300">/</span></li>
                <li className="text-gray-900 font-medium">{pageTitle}</li>
              </>
            ) : (
              <li className="text-gray-900 font-medium">{t(locale, "全部商品", "All Products")}</li>
            )}
          </ol>
        </nav>

        {/* ============================================================ */}
        {/* Page header: Title + Sort + Grid icon + Mobile filter btn    */}
        {/* ============================================================ */}
        <div className="flex items-baseline justify-between border-b border-gray-200 pt-6 pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">{pageTitle}</h1>

          <div className="flex items-center">
            {/* Sort dropdown (server-rendered as links) */}
            <SortDropdown
              options={sortOptions}
              currentSort={sortBy}
              locale={locale}
            />

            {/* View switcher */}
            <div className="hidden sm:flex items-center gap-0.5 border-l border-gray-200 pl-4 ml-4">
              {[
                { value: "grid", icon: <Squares2X2Icon /> },
                { value: "details", icon: <ListBulletIcon /> },
                { value: "border", icon: <BorderIcon /> },
              ].map((v) => (
                <a
                  key={v.value}
                  href={buildUrl({ view: v.value === "grid" ? undefined : v.value, page: undefined })}
                  className={`p-2 rounded ${cardView === v.value ? "text-gray-900" : "text-gray-400 hover:text-gray-500"}`}
                >
                  {v.icon}
                </a>
              ))}
            </div>

            {/* Mobile filter button */}
            <ProductFilters
              categoryTree={sidebarTree}
              categories={categoryLinks}
              allHref={buildUrl({ category: undefined, page: undefined })}
              currentCategorySlug={categorySlug}
              locale={locale}
              sortOptions={sortOptions}
              currentSort={sortBy}
            />
          </div>
        </div>

        <section aria-labelledby="products-heading" className="pt-6 pb-24">
          <h2 id="products-heading" className="sr-only">Products</h2>

          <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4">
            {/* ============================================================ */}
            {/* Sidebar: Top-level categories + expandable sub-categories    */}
            {/* ============================================================ */}
            <aside className="hidden lg:block">
              {/* Top-level category links */}
              <h3 className="sr-only">{t(locale, "分類", "Categories")}</h3>
              <ul role="list" className="space-y-4 border-b border-gray-200 pb-6 text-sm font-medium text-gray-900">
                <li>
                  <a
                    href={buildUrl({ category: undefined, page: undefined })}
                    className={!categorySlug ? "text-indigo-600 font-semibold" : "hover:text-gray-600"}
                  >
                    {t(locale, "全部商品", "All Products")}
                  </a>
                </li>
                {(() => {
                  // Find active parent (either directly selected or parent of selected sub-cat)
                  const activeParent = categoryTree.find(
                    (p) => categorySlug === p.slug || p.children.some((c) => categorySlug === c.slug)
                  );

                  // Drill-down: if a parent is active, show only that parent + its sub-categories
                  if (activeParent) {
                    const parentHref = buildUrl({ category: activeParent.slug || undefined, page: undefined });
                    return (
                      <li>
                        <a
                          href={parentHref}
                          className={categorySlug === activeParent.slug ? "text-indigo-600 font-semibold" : "font-semibold text-gray-900 hover:text-gray-600"}
                        >
                          {activeParent.displayName}
                        </a>
                        {activeParent.children.length > 0 && (
                          <ul className="mt-3 ml-4 space-y-3">
                            {activeParent.children.map((child) => {
                              const childHref = buildUrl({ category: child.slug || undefined, page: undefined });
                              return (
                                <li key={child.id}>
                                  <a
                                    href={childHref}
                                    className={categorySlug === child.slug ? "text-indigo-600 font-medium" : "text-gray-500 hover:text-gray-700"}
                                  >
                                    {child.displayName}
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                    );
                  }

                  // No active parent: show all top-level categories
                  return categoryTree.map((parent) => {
                    const parentHref = buildUrl({ category: parent.slug || undefined, page: undefined });
                    return (
                      <li key={parent.id}>
                        <a href={parentHref} className="hover:text-gray-600">
                          {parent.displayName}
                        </a>
                      </li>
                    );
                  });
                })()}
              </ul>

              {/* Expandable filter sections */}
              {/* Sort filter */}
              <ExpandableSection
                title={t(locale, "排序", "Sort by")}
                defaultOpen={sortBy !== "popular"}
              >
                <div className="space-y-4">
                  {sortOptions.map((opt) => (
                    <div key={opt.value} className="flex items-center">
                      <a
                        href={opt.href}
                        className={`text-sm ${sortBy === opt.value ? "text-indigo-600 font-medium" : "text-gray-600 hover:text-gray-900"}`}
                      >
                        {opt.label}
                      </a>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            </aside>

            {/* ============================================================ */}
            {/* Product grid                                                 */}
            {/* ============================================================ */}
            <div className="lg:col-span-3">
              {/* Search indicator + result count */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {search && (
                    <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700">
                      <span>{t(locale, `搜尋: "${search}"`, `Search: "${search}"`)}</span>
                      <a href={buildUrl({ q: undefined, page: undefined })} className="text-indigo-400 hover:text-indigo-600" aria-label="Clear search">
                        <svg className="size-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                      </a>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    {t(locale, `顯示 ${total} 件商品`, `Showing ${total} products`)}
                  </p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-gray-500">
                    {t(locale, "找不到商品", "No products found")}
                  </p>
                  <a href={`/${locale}/products`} className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    {t(locale, "查看全部商品", "View all products")}
                  </a>
                </div>
              ) : (
                <>
                  <div className={`grid gap-y-10 ${
                    cardView === "border"
                      ? "grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:gap-x-8"
                  }`}>
                    {products.map((product) => {
                      const variantMap: Record<string, "with-inline" | "with-overlay" | "with-details" | "border-grid" | "with-swatches"> = {
                        grid: "with-inline",
                        overlay: "with-overlay",
                        details: "with-details",
                        border: "border-grid",
                        swatches: "with-swatches",
                      };
                      return (
                        <ProductCard
                          key={product.id}
                          product={product as any}
                          locale={locale}
                          variant={variantMap[cardView] || "with-inline"}
                          showCategory={!categorySlug}
                        />
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <nav className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6">
                      <div className="flex flex-1 justify-between sm:justify-end gap-3">
                        {page > 1 && (
                          <a
                            href={buildUrl({ page: String(page - 1) })}
                            className="relative inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            {t(locale, "上一頁", "Previous")}
                          </a>
                        )}
                        <span className="flex items-center text-sm text-gray-500">
                          {page} / {totalPages}
                        </span>
                        {page < totalPages && (
                          <a
                            href={buildUrl({ page: String(page + 1) })}
                            className="relative inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          >
                            {t(locale, "下一頁", "Next")}
                          </a>
                        )}
                      </div>
                    </nav>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ================================================================== */
/* Sub-components                                                      */
/* ================================================================== */

function Squares2X2Icon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h2.5A2.25 2.25 0 0 0 9 15.75v-2.5A2.25 2.25 0 0 0 6.75 11h-2.5Zm9-9A2.25 2.25 0 0 0 11 4.25v2.5A2.25 2.25 0 0 0 13.25 9h2.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 11 13.25v2.5A2.25 2.25 0 0 0 13.25 18h2.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11h-2.5Z" clipRule="evenodd" />
    </svg>
  );
}

function ListBulletIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M2 3.75A.75.75 0 0 1 2.75 3h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75Zm0 4.167a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 4.166a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 4.167a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
    </svg>
  );
}

function BorderIcon() {
  return (
    <svg className="size-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="16" height="16" rx="2" />
      <line x1="10" y1="2" x2="10" y2="18" />
      <line x1="2" y1="10" x2="18" y2="10" />
    </svg>
  );
}

/** Server-rendered sort dropdown with CSS-only hover */
function SortDropdown({ options, currentSort, locale }: { options: { value: string; label: string; href: string }[]; currentSort: string; locale: string }) {
  const currentLabel = options.find((o) => o.value === currentSort)?.label || options[0].label;
  return (
    <div className="relative inline-block text-left group">
      <button
        type="button"
        className="group inline-flex items-center justify-center text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        {currentLabel}
        <svg className="-mr-1 ml-1 size-5 shrink-0 text-gray-400 group-hover:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-2xl ring-1 ring-black/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
        <div className="py-1">
          {options.map((opt) => (
            <a
              key={opt.value}
              href={opt.href}
              className={`block px-4 py-2 text-sm ${currentSort === opt.value ? "font-medium text-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              {opt.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/** HUMAN MADE sort dropdown — clean minimal style */
function SortDropdownHM({ options, currentSort }: { options: { value: string; label: string; href: string }[]; currentSort: string }) {
  const currentLabel = options.find((o) => o.value === currentSort)?.label || options[0].label;
  return (
    <div className="relative inline-block text-left group">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-[#121212]/60 hover:text-[#121212] transition-colors"
        style={{ fontSize: "12px", letterSpacing: "0.05em" }}
      >
        {currentLabel}
        <svg className="size-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="absolute right-0 z-10 mt-2 w-40 origin-top-right bg-white shadow-lg ring-1 ring-[#121212]/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
        <div className="py-1">
          {options.map((opt) => (
            <a
              key={opt.value}
              href={opt.href}
              className={`block px-4 py-2 transition-colors ${currentSort === opt.value ? "text-[#121212] bg-[#121212]/5" : "text-[#121212]/60 hover:text-[#121212] hover:bg-[#121212]/5"}`}
              style={{ fontSize: "12px", letterSpacing: "0.05em" }}
            >
              {opt.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Expandable filter section with +/- toggle (server-rendered, uses <details>) */
function ExpandableSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details className="group border-b border-gray-200 py-6" open={defaultOpen || undefined}>
      <summary className="flex w-full items-center justify-between text-sm text-gray-400 hover:text-gray-500 cursor-pointer [&::-webkit-details-marker]:hidden list-none">
        <span className="font-medium text-gray-900">{title}</span>
        <span className="ml-6 flex items-center">
          {/* Plus icon (shown when closed) */}
          <svg className="size-5 group-open:hidden" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          {/* Minus icon (shown when open) */}
          <svg className="size-5 hidden group-open:block" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clipRule="evenodd" />
          </svg>
        </span>
      </summary>
      <div className="pt-6">{children}</div>
    </details>
  );
}
