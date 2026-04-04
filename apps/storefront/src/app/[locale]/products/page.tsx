import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontProducts, getStorefrontCategories } from "@/lib/storefront-queries";
import { getDisplayName } from "@macau-pos/database";
import { notFound } from "next/navigation";
import ProductCard from "@/components/product/product-card";
import ProductFilters from "./filters";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const categorySlug = sp.category;
  const search = sp.q;
  const sortBy = (sp.sort as "newest" | "price_asc" | "price_desc" | "popular" | "name") || "popular";
  const page = parseInt(sp.page || "1");

  const [{ products, total, totalPages }, categories] = await Promise.all([
    getStorefrontProducts(tenant.id, {
      categorySlug: categorySlug || undefined,
      search: search || undefined,
      sortBy,
      page,
      pageSize: 24,
    }),
    getStorefrontCategories(tenant.id),
  ]);

  const currentCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;
  const pageTitle = currentCategory
    ? getDisplayName(currentCategory.name, currentCategory.translations as Record<string, string>, locale)
    : t(locale, "全部商品", "All Products", "Todos os Produtos", "全商品");

  // Build URL helper
  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { category: categorySlug, sort: sortBy !== "popular" ? sortBy : undefined, q: search, page: page > 1 ? String(page) : undefined, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return `/${locale}/products${qs ? `?${qs}` : ""}`;
  };

  const sortOptions = [
    { value: "popular", label: t(locale, "最熱門", "Most Popular", "Mais Popular", "人気順"), href: buildUrl({ sort: undefined, page: undefined }) },
    { value: "newest", label: t(locale, "最新", "Newest", "Mais Recente", "新着順"), href: buildUrl({ sort: "newest", page: undefined }) },
    { value: "price_asc", label: t(locale, "價格低到高", "Price: Low to High", "Menor Preço", "安い順"), href: buildUrl({ sort: "price_asc", page: undefined }) },
    { value: "price_desc", label: t(locale, "價格高到低", "Price: High to Low", "Maior Preço", "高い順"), href: buildUrl({ sort: "price_desc", page: undefined }) },
  ];

  const categoryLinks = categories.map((cat) => ({
    name: getDisplayName(cat.name, cat.translations as Record<string, string>, locale),
    slug: cat.slug,
    href: buildUrl({ category: cat.slug || undefined, page: undefined }),
    active: categorySlug === cat.slug,
  }));

  return (
    <div className="bg-white">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-baseline justify-between border-b border-gray-200 pt-24 pb-6">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">{pageTitle}</h1>

          <div className="flex items-center">
            {/* Sort dropdown (desktop) */}
            <div className="relative hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t(locale, "排序", "Sort", "Ordenar", "並べ替え")}</span>
                {sortOptions.map((opt) => (
                  <a
                    key={opt.value}
                    href={opt.href}
                    className={`text-sm ${sortBy === opt.value ? "font-medium text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    {opt.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Mobile filter button */}
            <ProductFilters
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
            {/* Desktop sidebar filters                                      */}
            {/* ============================================================ */}
            <form className="hidden lg:block">
              {/* Category links */}
              <h3 className="sr-only">Categories</h3>
              <ul role="list" className="space-y-4 border-b border-gray-200 pb-6 text-sm font-medium text-gray-900">
                <li>
                  <a
                    href={buildUrl({ category: undefined, page: undefined })}
                    className={!categorySlug ? "text-indigo-600 font-semibold" : "hover:text-gray-600"}
                  >
                    {t(locale, "全部", "All", "Todos", "すべて")}
                  </a>
                </li>
                {categoryLinks.map((cat) => (
                  <li key={cat.slug}>
                    <a
                      href={cat.href}
                      className={cat.active ? "text-indigo-600 font-semibold" : "hover:text-gray-600"}
                    >
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Price filter section */}
              <details className="border-b border-gray-200 py-6">
                <summary className="flex w-full items-center justify-between cursor-pointer py-3 text-sm text-gray-400 hover:text-gray-500 [&::-webkit-details-marker]:hidden">
                  <span className="font-medium text-gray-900">{t(locale, "價格", "Price", "Preço", "価格")}</span>
                  <span className="ml-6 flex items-center">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="size-5"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
                  </span>
                </summary>
                <div className="pt-6 space-y-4">
                  {[
                    { label: `${t(locale, "低於", "Under", "Abaixo de", "")} MOP 10`, href: buildUrl({ sort: "price_asc", page: undefined }) },
                    { label: "MOP 10 - 25", href: buildUrl({ sort: "price_asc", page: undefined }) },
                    { label: "MOP 25 - 50", href: buildUrl({ sort: "price_asc", page: undefined }) },
                    { label: "MOP 50 - 100", href: buildUrl({ sort: "price_asc", page: undefined }) },
                    { label: `MOP 100+`, href: buildUrl({ sort: "price_desc", page: undefined }) },
                  ].map((range) => (
                    <div key={range.label} className="flex gap-3">
                      <div className="flex h-5 shrink-0 items-center">
                        <input type="checkbox" className="size-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      </div>
                      <label className="text-sm text-gray-600">{range.label}</label>
                    </div>
                  ))}
                </div>
              </details>

              {/* Sort filter (desktop sidebar) */}
              <details className="border-b border-gray-200 py-6" open>
                <summary className="flex w-full items-center justify-between cursor-pointer py-3 text-sm text-gray-400 hover:text-gray-500 [&::-webkit-details-marker]:hidden">
                  <span className="font-medium text-gray-900">{t(locale, "排序", "Sort by", "Ordenar", "並べ替え")}</span>
                  <span className="ml-6 flex items-center">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="size-5"><path d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clipRule="evenodd" fillRule="evenodd" /></svg>
                  </span>
                </summary>
                <div className="pt-6 space-y-4">
                  {sortOptions.map((opt) => (
                    <a key={opt.value} href={opt.href} className={`flex items-center gap-3 text-sm ${sortBy === opt.value ? "font-medium text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>
                      <span className={`size-4 rounded-full border-2 flex items-center justify-center ${sortBy === opt.value ? "border-indigo-600" : "border-gray-300"}`}>
                        {sortBy === opt.value && <span className="size-2 rounded-full bg-indigo-600" />}
                      </span>
                      {opt.label}
                    </a>
                  ))}
                </div>
              </details>
            </form>

            {/* ============================================================ */}
            {/* Product grid                                                 */}
            {/* ============================================================ */}
            <div className="lg:col-span-3">
              {/* Result count */}
              <p className="mb-6 text-sm text-gray-500">
                {total} {t(locale, "件商品", "products", "produtos", "商品")}
              </p>

              {products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-gray-500">
                    {t(locale, "找不到商品", "No products found", "Nenhum produto encontrado", "商品が見つかりません")}
                  </p>
                  <a href={`/${locale}/products`} className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    {t(locale, "查看全部商品", "View all products", "Ver todos os produtos", "すべての商品を見る")}
                  </a>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product as any}
                        locale={locale}
                        variant="with-inline"
                        showCategory={!categorySlug}
                      />
                    ))}
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
                            {t(locale, "上一頁", "Previous", "Anterior", "前へ")}
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
                            {t(locale, "下一頁", "Next", "Próximo", "次へ")}
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
