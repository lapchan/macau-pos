"use client";

import { useState } from "react";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { StarIcon, HeartIcon, PlusIcon, MinusIcon } from "@heroicons/react/24/outline";

type ProductImage = { url: string; alt?: string };

type ProductDetail = {
  id: string;
  slug: string | null;
  name: string;
  description?: string | null;
  descTranslations?: Record<string, string> | null;
  translations?: Record<string, string> | null;
  sellingPrice: string | number;
  originalPrice?: string | number | null;
  image?: string | null;
  images?: ProductImage[];
  stock?: number | null;
  hasVariants?: boolean | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  categoryTranslations?: Record<string, string> | null;
};

type DetailSection = {
  title: string;
  items: string[];
  defaultOpen?: boolean;
};

type RelatedProduct = {
  id: string;
  slug: string | null;
  name: string;
  color?: string;
  price: number;
  image?: string | null;
};

type Props = {
  product: ProductDetail;
  locale: string;
  currency?: string;
  detailSections?: DetailSection[];
  relatedProducts?: RelatedProduct[];
  onAddToCart?: (productId: string, quantity: number) => Promise<{ error?: string; success?: boolean }>;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

// Expandable disclosure section
function DisclosureSection({ title, items, defaultOpen = false }: { title: string; items: string[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <h3>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="group relative flex w-full items-center justify-between py-6 text-left"
        >
          <span className={`text-sm font-medium ${open ? "text-indigo-600" : "text-gray-900"}`}>
            {title}
          </span>
          <span className="ml-6 flex items-center">
            {open ? (
              <MinusIcon className="size-6 text-indigo-400" aria-hidden="true" />
            ) : (
              <PlusIcon className="size-6 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
            )}
          </span>
        </button>
      </h3>
      {open && (
        <div className="pb-6">
          <ul role="list" className="list-disc space-y-1 pl-5 text-sm/6 text-gray-500 marker:text-gray-300">
            {items.map((item, i) => (
              <li key={i} className="pl-2">{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ProductOverviewExpandable({
  product,
  locale,
  currency = "MOP",
  detailSections,
  relatedProducts = [],
  onAddToCart,
}: Props) {
  const images: ProductImage[] = product.images?.length
    ? product.images
    : product.image
    ? [{ url: product.image, alt: product.name }]
    : [];
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  const name = product.translations?.[locale] || product.name;
  const description = product.descTranslations?.[locale] || product.description;
  const price = parseFloat(String(product.sellingPrice));
  const inStock = product.stock == null || product.stock > 0;

  // Default detail sections if none provided
  const sections = detailSections || [
    {
      title: t(locale, "產品特色", "Features", "Características", "特徴"),
      items: [
        t(locale, "優質材料製造", "Premium quality materials", "Materiais de qualidade premium", "高品質素材"),
        t(locale, "精心設計", "Carefully designed", "Design cuidadoso", "丁寧なデザイン"),
        t(locale, "耐用持久", "Durable and long-lasting", "Durável e duradouro", "耐久性あり"),
      ],
      defaultOpen: true,
    },
    {
      title: t(locale, "送貨資訊", "Shipping", "Envio", "配送情報"),
      items: [
        t(locale, "滿MOP 200免運費", "Free shipping on orders over MOP 200", "Frete grátis acima de MOP 200", "MOP 200以上で送料無料"),
        t(locale, "澳門本地配送", "Local delivery in Macau", "Entrega local em Macau", "マカオ本土配送"),
        t(locale, "預計1-3個工作天送達", "Estimated 1-3 business days", "Estimativa de 1-3 dias úteis", "1〜3営業日で配達"),
      ],
    },
    {
      title: t(locale, "退換政策", "Returns", "Devoluções", "返品ポリシー"),
      items: [
        t(locale, "7天退換保障", "7-day return policy", "Política de 7 dias", "7日間返品保証"),
        t(locale, "簡易退換流程", "Easy return process", "Processo fácil", "簡単な返品手続き"),
        t(locale, "未開封商品全額退款", "Full refund for unopened items", "Reembolso total", "未開封品は全額返金"),
      ],
    },
  ];

  const handleAddToCart = async () => {
    if (!onAddToCart) return;
    setAdding(true);
    setAddedMessage(null);
    const result = await onAddToCart(product.id, 1);
    setAdding(false);
    if (result.success) {
      setAddedMessage(t(locale, "已加入購物車！", "Added to cart!", "Adicionado!", "カートに追加しました！"));
      setTimeout(() => setAddedMessage(null), 3000);
    } else if (result.error) {
      setAddedMessage(result.error);
    }
  };

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          {/* ============================================================ */}
          {/* Image gallery with tabs                                      */}
          {/* ============================================================ */}
          <div className="flex flex-col-reverse">
            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
                <div className="grid grid-cols-4 gap-6">
                  {images.slice(0, 4).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className="relative flex aspect-square cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium text-gray-900 uppercase hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-4"
                    >
                      <span className="sr-only">{img.alt || `Image ${i + 1}`}</span>
                      <span className="absolute inset-0 overflow-hidden rounded-md">
                        <img src={img.url} alt="" className="size-full object-cover" />
                      </span>
                      {/* Selection ring */}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-0 rounded-md ring-2 ring-offset-2 ${i === selectedImage ? "ring-indigo-500" : "ring-transparent"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main image */}
            <div className="aspect-square w-full overflow-hidden rounded-lg">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]?.url}
                  alt={images[selectedImage]?.alt || name}
                  className="size-full object-cover sm:rounded-lg"
                />
              ) : (
                <div className="size-full flex items-center justify-center bg-gray-100 text-gray-300 sm:rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* Product info                                                 */}
          {/* ============================================================ */}
          <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{name}</h1>

            {/* Price */}
            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl tracking-tight text-gray-900">{currency} {price.toFixed(2)}</p>
            </div>

            {/* Rating */}
            <div className="mt-3">
              <h3 className="sr-only">Reviews</h3>
              <div className="flex items-center">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) =>
                    star <= 4 ? (
                      <StarSolidIcon key={star} className="size-5 shrink-0 text-indigo-500" />
                    ) : (
                      <StarSolidIcon key={star} className="size-5 shrink-0 text-gray-300" />
                    )
                  )}
                </div>
                <p className="sr-only">4 out of 5 stars</p>
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="mt-6">
                <h3 className="sr-only">{t(locale, "描述", "Description", "Descrição", "説明")}</h3>
                <div className="space-y-6 text-base text-gray-700">
                  <p>{description}</p>
                </div>
              </div>
            )}

            {/* Add to bag + Favorite */}
            <div className="mt-10 flex">
              <button
                type="button"
                disabled={!inStock || adding}
                onClick={handleAddToCart}
                className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {adding
                  ? "..."
                  : !inStock
                  ? t(locale, "售罄", "Out of stock", "Esgotado", "在庫切れ")
                  : t(locale, "加入購物車", "Add to bag", "Adicionar", "カートに追加")
                }
              </button>

              <button
                type="button"
                className="ml-4 flex items-center justify-center rounded-md px-3 py-3 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
              >
                <HeartIcon className="size-6 shrink-0" aria-hidden="true" />
                <span className="sr-only">{t(locale, "加入收藏", "Add to favorites", "Adicionar aos favoritos", "お気に入りに追加")}</span>
              </button>
            </div>

            {/* Added message */}
            {addedMessage && (
              <p className="mt-3 text-sm font-medium text-green-600 animate-fade-in">{addedMessage}</p>
            )}

            {/* ============================================================ */}
            {/* Expandable detail sections (accordion)                       */}
            {/* ============================================================ */}
            <section aria-labelledby="details-heading" className="mt-12">
              <h2 id="details-heading" className="sr-only">
                {t(locale, "詳細資訊", "Additional details", "Detalhes adicionais", "詳細情報")}
              </h2>

              <div className="divide-y divide-gray-200 border-t border-gray-200">
                {sections.map((section, i) => (
                  <DisclosureSection
                    key={i}
                    title={section.title}
                    items={section.items}
                    defaultOpen={section.defaultOpen}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ============================================================ */}
        {/* Related products — "Customers also bought"                   */}
        {/* ============================================================ */}
        {relatedProducts.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-10 border-t border-gray-200 px-4 py-16 sm:px-0">
            <h2 id="related-heading" className="text-xl font-bold text-gray-900">
              {t(locale, "其他顧客也買了", "Customers also bought", "Clientes também compraram", "他のお客様も購入")}
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
              {relatedProducts.map((rp) => (
                <div key={rp.id}>
                  <div className="relative">
                    {/* Image */}
                    <div className="relative h-72 w-full overflow-hidden rounded-lg">
                      {rp.image ? (
                        <img src={rp.image} alt={rp.name} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center bg-gray-100 text-gray-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="relative mt-4">
                      <h3 className="text-sm font-medium text-gray-900">{rp.name}</h3>
                      {rp.color && <p className="mt-1 text-sm text-gray-500">{rp.color}</p>}
                    </div>
                    {/* Price overlay */}
                    <div className="absolute inset-x-0 top-0 flex h-72 items-end justify-end overflow-hidden rounded-lg p-4">
                      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black opacity-50" />
                      <p className="relative text-lg font-semibold text-white">{currency} {rp.price.toFixed(2)}</p>
                    </div>
                  </div>
                  {/* Add to bag link */}
                  <div className="mt-6">
                    <a
                      href={rp.slug ? `/${locale}/products/${rp.slug}` : "#"}
                      className="relative flex items-center justify-center rounded-md border border-transparent bg-gray-100 px-8 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
                    >
                      {t(locale, "加入購物車", "Add to bag", "Adicionar", "カートに追加")}
                      <span className="sr-only">, {rp.name}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
