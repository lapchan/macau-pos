import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontProducts, getStorefrontCategories } from "@/lib/storefront-queries";
import { getDisplayName } from "@macau-pos/database";
import { notFound } from "next/navigation";
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
    : t(locale, "全部商品", "New Arrivals", "Novidades", "新着商品");
  const pageSubtitle = currentCategory
    ? `${total} ${t(locale, "件商品", "products", "produtos", "商品")}`
    : t(locale, "瀏覽我們的精選商品，找到您喜愛的好物。", "Checkout out our latest products, curated for you.", "Confira nossos produtos mais recentes.", "最新商品をチェックしてください。");

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
        {/* ============================================================ */}
        {/* Hero header with background                                  */}
        {/* ============================================================ */}
        <div className="relative overflow-hidden rounded-lg bg-gray-900 px-6 py-16 sm:py-24 text-center mt-6">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-950" />
          <div className="relative">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{pageTitle}</h1>
            <p className="mt-4 text-base text-gray-300">{pageSubtitle}</p>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Filter bar + content                                         */}
        {/* ============================================================ */}
        <div className="flex items-center justify-between border-b border-gray-200 pt-10 pb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{total} {t(locale, "件商品", "products", "produtos", "商品")}</span>
          </div>
          <div className="flex items-center gap-4">
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
            {/* Sidebar filters (desktop)                                    */}
            {/* ============================================================ */}
            <aside className="hidden lg:block">
              {/* Categories — checkbox style */}
              <form>
                {/* Category section */}
                <fieldset>
                  <legend className="block text-sm font-medium text-gray-900">
                    {t(locale, "分類", "Category", "Categoria", "カテゴリー")}
                  </legend>
                  <div className="space-y-3 pt-6">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!categorySlug}
                        readOnly
                        className="size-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <a href={buildUrl({ category: undefined, page: undefined })} className="text-sm text-gray-600">
                        {t(locale, "全部", "All", "Todos", "すべて")}
                      </a>
                    </div>
                    {categoryLinks.map((cat) => (
                      <div key={cat.slug} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={cat.active}
                          readOnly
                          className="size-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <a href={cat.href} className="text-sm text-gray-600">
                          {cat.name}
                        </a>
                      </div>
                    ))}
                  </div>
                </fieldset>

                {/* Sort section */}
                <fieldset className="mt-8 border-t border-gray-200 pt-8">
                  <legend className="block text-sm font-medium text-gray-900">
                    {t(locale, "排序", "Sort", "Ordenar", "並べ替え")}
                  </legend>
                  <div className="space-y-3 pt-6">
                    {sortOptions.map((opt) => (
                      <div key={opt.value} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={sortBy === opt.value}
                          readOnly
                          className="size-4 rounded-sm border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <a href={opt.href} className="text-sm text-gray-600">
                          {opt.label}
                        </a>
                      </div>
                    ))}
                  </div>
                </fieldset>
              </form>
            </aside>

            {/* ============================================================ */}
            {/* Product grid — with details (name + desc + price)            */}
            {/* ============================================================ */}
            <div className="lg:col-span-3">
              {products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-gray-500">
                    {t(locale, "找不到商品", "No products found", "Nenhum produto encontrado", "商品が見つかりません")}
                  </p>
                  <a href={`/${locale}/products`} className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    {t(locale, "查看全部商品", "View all products", "Ver todos", "すべて見る")}
                  </a>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:gap-x-8">
                    {products.map((product) => {
                      const name = getDisplayName(product.name, product.translations as Record<string, string>, locale);
                      const price = parseFloat(String(product.sellingPrice));
                      const originalPrice = product.originalPrice ? parseFloat(String(product.originalPrice)) : null;
                      const catName = product.categoryName
                        ? getDisplayName(product.categoryName, product.categoryTranslations as Record<string, string>, locale)
                        : null;
                      const inStock = product.stock === null || (product.stock !== null && product.stock > 0);
                      const href = product.slug ? `/${locale}/products/${product.slug}` : "#";

                      return (
                        <a key={product.id} href={href} className="group">
                          {/* Image */}
                          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={name}
                                className="size-full object-cover object-center group-hover:opacity-75 transition-opacity"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                  <circle cx="9" cy="9" r="2" />
                                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                </svg>
                              </div>
                            )}

                            {/* Sold out badge */}
                            {!inStock && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
                                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                  {t(locale, "售罄", "Sold out", "Esgotado", "売り切れ")}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Product details — below image */}
                          <div className="mt-4 flex justify-between">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">{name}</h3>
                              {catName && !categorySlug && (
                                <p className="mt-1 text-sm text-gray-500">{catName}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">MOP {price.toFixed(2)}</p>
                              {originalPrice && originalPrice > price && (
                                <p className="mt-1 text-sm text-gray-400 line-through">MOP {originalPrice.toFixed(2)}</p>
                              )}
                            </div>
                          </div>
                        </a>
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
