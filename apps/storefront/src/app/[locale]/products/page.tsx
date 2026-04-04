import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontProducts, getStorefrontCategories } from "@/lib/storefront-queries";
import { getDisplayName } from "@macau-pos/database";
import { notFound } from "next/navigation";
import ProductCard from "@/components/product/product-card";

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

  const sortOptions = [
    { value: "popular", label: t(locale, "熱門", "Most Popular", "Mais Popular", "人気順") },
    { value: "newest", label: t(locale, "最新", "Newest", "Mais Recente", "新着順") },
    { value: "price_asc", label: t(locale, "價格低到高", "Price: Low to High", "Menor Preço", "価格: 安い順") },
    { value: "price_desc", label: t(locale, "價格高到低", "Price: High to Low", "Maior Preço", "価格: 高い順") },
    { value: "name", label: t(locale, "名稱", "Name", "Nome", "名前順") },
  ];

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

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 lg:max-w-7xl lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{pageTitle}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {total} {t(locale, "件商品", "products", "produtos", "商品")}
            </p>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">
              {t(locale, "排序", "Sort by", "Ordenar", "並び替え")}
            </span>
            <div className="flex gap-2">
              {sortOptions.map((opt) => (
                <a
                  key={opt.value}
                  href={buildUrl({ sort: opt.value === "popular" ? undefined : opt.value, page: undefined })}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${sortBy === opt.value ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {opt.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 lg:grid lg:grid-cols-4 lg:gap-x-8">
          {/* Sidebar filters */}
          <aside className="hidden lg:block">
            {/* Categories */}
            <h3 className="text-sm font-medium text-gray-900">
              {t(locale, "分類", "Categories", "Categorias", "カテゴリー")}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href={buildUrl({ category: undefined, page: undefined })}
                  className={`block text-sm px-2 py-1.5 rounded-md ${!categorySlug ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {t(locale, "全部", "All", "Todos", "すべて")}
                </a>
              </li>
              {categories.map((cat) => {
                const catName = getDisplayName(cat.name, cat.translations as Record<string, string>, locale);
                return (
                  <li key={cat.id}>
                    <a
                      href={buildUrl({ category: cat.slug || undefined, page: undefined })}
                      className={`block text-sm px-2 py-1.5 rounded-md ${categorySlug === cat.slug ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
                    >
                      {catName}
                    </a>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Products grid */}
          <div className="lg:col-span-3">
            {/* Mobile category pills */}
            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar lg:hidden">
              <a
                href={buildUrl({ category: undefined, page: undefined })}
                className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-medium ${!categorySlug ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {t(locale, "全部", "All", "Todos", "すべて")}
              </a>
              {categories.slice(0, 10).map((cat) => {
                const catName = getDisplayName(cat.name, cat.translations as Record<string, string>, locale);
                return (
                  <a
                    key={cat.id}
                    href={buildUrl({ category: cat.slug || undefined, page: undefined })}
                    className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm font-medium ${categorySlug === cat.slug ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    {catName}
                  </a>
                );
              })}
            </div>

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
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-3 xl:gap-x-6">
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
      </div>
    </div>
  );
}
