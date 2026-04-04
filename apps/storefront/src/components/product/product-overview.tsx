"use client";

import { useState } from "react";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { StarIcon, HeartIcon, ShareIcon } from "@heroicons/react/24/outline";

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

type Props = {
  product: ProductDetail;
  locale: string;
  currency?: string;
  onAddToCart?: (productId: string, quantity: number) => Promise<{ error?: string; success?: boolean }>;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function ProductOverview({ product, locale, currency = "MOP", onAddToCart }: Props) {
  const [adding, setAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const images: ProductImage[] = product.images?.length
    ? product.images
    : product.image
    ? [{ url: product.image, alt: product.name }]
    : [];
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const name = product.translations?.[locale] || product.name;
  const description = product.descTranslations?.[locale] || product.description;
  const price = parseFloat(String(product.sellingPrice));
  const originalPrice = product.originalPrice ? parseFloat(String(product.originalPrice)) : null;
  const inStock = product.stock == null || product.stock > 0;
  const discount = originalPrice && originalPrice > price
    ? Math.round((1 - price / originalPrice) * 100)
    : null;
  const catName = product.categoryName
    ? (product.categoryTranslations?.[locale] || product.categoryName)
    : null;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-16 lg:max-w-7xl lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><a href={`/${locale}`} className="hover:text-gray-700">{t(locale, "首頁", "Home", "Início", "ホーム")}</a></li>
            <li><span className="text-gray-300">/</span></li>
            <li><a href={`/${locale}/products`} className="hover:text-gray-700">{t(locale, "商品", "Products", "Produtos", "商品")}</a></li>
            {catName && product.categorySlug && (
              <>
                <li><span className="text-gray-300">/</span></li>
                <li><a href={`/${locale}/categories/${product.categorySlug}`} className="hover:text-gray-700">{catName}</a></li>
              </>
            )}
            <li><span className="text-gray-300">/</span></li>
            <li className="text-gray-900 font-medium truncate max-w-[200px]">{name}</li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          {/* Image gallery */}
          <div className="flex flex-col-reverse">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative aspect-square overflow-hidden rounded-lg bg-gray-100 ${i === selectedImage ? "ring-2 ring-indigo-500" : "ring-1 ring-gray-200 hover:ring-gray-300"}`}
                  >
                    <img src={img.url} alt={img.alt || ""} className="size-full object-cover object-center" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]?.url}
                  alt={images[selectedImage]?.alt || name}
                  className="size-full object-cover object-center"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
              )}

              {/* Discount badge */}
              {discount && (
                <span className="absolute top-4 left-4 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                  -{discount}%
                </span>
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
            {/* Category */}
            {catName && (
              <a href={`/${locale}/categories/${product.categorySlug}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                {catName}
              </a>
            )}

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{name}</h1>

            {/* Price */}
            <div className="mt-3 flex items-center gap-3">
              <p className="text-3xl font-bold text-gray-900">{currency} {price.toFixed(2)}</p>
              {originalPrice && originalPrice > price && (
                <p className="text-lg text-gray-400 line-through">{currency} {originalPrice.toFixed(2)}</p>
              )}
            </div>

            {/* Rating (placeholder) */}
            <div className="mt-3 flex items-center">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  star <= 4 ? (
                    <StarSolidIcon key={star} className="size-5 text-yellow-400" />
                  ) : (
                    <StarIcon key={star} className="size-5 text-gray-300" />
                  )
                ))}
              </div>
              <a href="#reviews" className="ml-3 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                {t(locale, "0 則評價", "0 reviews", "0 avaliações", "0件のレビュー")}
              </a>
            </div>

            {/* Description */}
            {description && (
              <div className="mt-6">
                <h3 className="sr-only">{t(locale, "描述", "Description", "Descrição", "説明")}</h3>
                <p className="text-base text-gray-700 leading-relaxed">{description}</p>
              </div>
            )}

            {/* Stock status */}
            <div className="mt-6 flex items-center gap-2">
              {inStock ? (
                <>
                  <span className="size-2.5 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    {t(locale, "有貨", "In stock", "Em estoque", "在庫あり")}
                    {product.stock !== null && product.stock !== undefined && ` (${product.stock})`}
                  </span>
                </>
              ) : (
                <>
                  <span className="size-2.5 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-red-700">
                    {t(locale, "售罄", "Out of stock", "Esgotado", "在庫切れ")}
                  </span>
                </>
              )}
            </div>

            {/* Quantity + Add to cart */}
            <div className="mt-8">
              <div className="flex items-center gap-4">
                {/* Quantity selector */}
                <div className="flex items-center rounded-lg border border-gray-300">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    -
                  </button>
                  <span className="min-w-[3rem] text-center text-sm font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900"
                  >
                    +
                  </button>
                </div>

                {/* Add to cart */}
                <button
                  type="button"
                  disabled={!inStock || adding}
                  onClick={async () => {
                    if (!onAddToCart) return;
                    setAdding(true);
                    setAddedMessage(null);
                    const result = await onAddToCart(product.id, quantity);
                    setAdding(false);
                    if (result.success) {
                      setAddedMessage(t(locale, "已加入購物車！", "Added to cart!", "Adicionado!", "カートに追加しました！"));
                      setTimeout(() => setAddedMessage(null), 3000);
                    } else if (result.error) {
                      setAddedMessage(result.error);
                    }
                  }}
                  className="flex-1 rounded-lg bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {adding ? "..." : t(locale, "加入購物車", "Add to cart", "Adicionar ao carrinho", "カートに追加")}
                </button>

                {/* Wishlist */}
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 p-3 text-gray-400 hover:text-red-500 hover:border-red-200"
                >
                  <HeartIcon className="size-5" />
                </button>

                {/* Share */}
                <button
                  type="button"
                  className="rounded-lg border border-gray-300 p-3 text-gray-400 hover:text-gray-600 hover:border-gray-400"
                >
                  <ShareIcon className="size-5" />
                </button>
              </div>
            </div>

            {/* Added to cart message */}
            {addedMessage && (
              <p className="mt-3 text-sm font-medium text-green-600 animate-fade-in">{addedMessage}</p>
            )}

            {/* Trust badges */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-gray-200 pt-8">
              <div className="text-center">
                <svg className="mx-auto size-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
                <p className="mt-2 text-xs font-medium text-gray-600">{t(locale, "免運費", "Free shipping", "Frete grátis", "送料無料")}</p>
              </div>
              <div className="text-center">
                <svg className="mx-auto size-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                <p className="mt-2 text-xs font-medium text-gray-600">{t(locale, "安全付款", "Secure payment", "Pagamento seguro", "安全な支払い")}</p>
              </div>
              <div className="text-center">
                <svg className="mx-auto size-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                </svg>
                <p className="mt-2 text-xs font-medium text-gray-600">{t(locale, "7天退換", "7-day returns", "7 dias devolução", "7日間返品")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
