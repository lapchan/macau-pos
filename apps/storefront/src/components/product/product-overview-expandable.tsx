"use client";

import { useState, useCallback, useRef, type CSSProperties } from "react";
import Image from "@/components/shared/store-image";
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
  items?: string[];
  content?: string;
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

type ColorVariant = {
  id: string;
  name: string;
  colorName: string | null;
  image: string | null;
  images: { url: string; alt?: string }[];
  stock: number | null;
  price: number;
  isCurrent: boolean;
};

type Props = {
  product: ProductDetail;
  locale: string;
  currency?: string;
  detailSections?: DetailSection[];
  relatedProducts?: RelatedProduct[];
  colorVariants?: ColorVariant[];
  themeId?: string;
  onAddToCart?: (productId: string, quantity: number) => Promise<{ error?: string; success?: boolean }>;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

// Expandable disclosure section — supports bullet items OR rich text content
function DisclosureSection({ title, items, content, defaultOpen = false }: { title: string; items?: string[]; content?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <h3>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="group relative flex w-full items-center justify-between py-6 text-left"
        >
          <span className={`text-sm font-medium ${open ? "text-sf-accent" : "text-gray-900"}`}>
            {title}
          </span>
          <span className="ml-6 flex items-center">
            {open ? (
              <MinusIcon className="size-6 text-sf-accent" aria-hidden="true" />
            ) : (
              <PlusIcon className="size-6 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
            )}
          </span>
        </button>
      </h3>
      {open && (
        <div className="pb-6">
          {content ? (
            <div className="text-sm/6 text-gray-500 whitespace-pre-line">{content}</div>
          ) : items ? (
            <ul role="list" className="list-disc space-y-1 pl-5 text-sm/6 text-gray-500 marker:text-gray-300">
              {items.map((item, i) => (
                <li key={i} className="pl-2">{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}

// HUMAN MADE disclosure section — clean minimal accordion
function HMDisclosureSection({ title, items, content, defaultOpen = false }: { title: string; items?: string[]; content?: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <h3>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="group relative flex w-full items-center justify-between py-4 text-left"
        >
          <span
            className="text-[#121212]"
            style={{ fontSize: "12px", letterSpacing: "0.05em" }}
          >
            {title}
          </span>
          <span className="ml-6 flex items-center text-[#121212]/40">
            {open ? (
              <MinusIcon className="size-4" aria-hidden="true" />
            ) : (
              <PlusIcon className="size-4" aria-hidden="true" />
            )}
          </span>
        </button>
      </h3>
      {open && (
        <div className="pb-4">
          {content ? (
            <div className="text-[#121212]/60 whitespace-pre-line" style={{ fontSize: "12px", letterSpacing: "0.04em", lineHeight: "1.8" }}>{content}</div>
          ) : items ? (
            <ul role="list" className="space-y-1.5 text-[#121212]/60" style={{ fontSize: "12px", letterSpacing: "0.04em", lineHeight: "1.8" }}>
              {items.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}

// HUMAN MADE size guide — expandable section with measurement table
function HMSizeGuideSection({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<"cm" | "in">("cm");

  return (
    <div>
      <h3>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="group relative flex w-full items-center justify-between py-4 text-left"
        >
          <span className="text-[#121212]" style={{ fontSize: "12px", letterSpacing: "0.05em" }}>
            {t(locale, "尺碼表", "SIZE GUIDE", "GUIA DE TAMANHOS", "サイズガイド")}
          </span>
          <span className="ml-6 flex items-center text-[#121212]/40">
            {open ? (
              <MinusIcon className="size-4" aria-hidden="true" />
            ) : (
              <PlusIcon className="size-4" aria-hidden="true" />
            )}
          </span>
        </button>
      </h3>
      {open && (
        <div className="pb-4">
          {/* Unit toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setUnit("cm")}
              className={`px-2 py-0.5 transition-colors ${unit === "cm" ? "bg-[#121212] text-white" : "bg-[#f5f5f5] text-[#121212]/60"}`}
              style={{ fontSize: "11px", letterSpacing: "0.05em" }}
            >
              cm
            </button>
            <button
              type="button"
              onClick={() => setUnit("in")}
              className={`px-2 py-0.5 transition-colors ${unit === "in" ? "bg-[#121212] text-white" : "bg-[#f5f5f5] text-[#121212]/60"}`}
              style={{ fontSize: "11px", letterSpacing: "0.05em" }}
            >
              in
            </button>
          </div>
          {/* Size table */}
          <table className="w-full border-collapse" style={{ fontSize: "11px", letterSpacing: "0.04em" }}>
            <thead>
              <tr className="border-b border-[#121212]/10">
                <th className="text-left py-2 text-[#121212]/60 font-normal"></th>
                <th className="text-left py-2 text-[#121212]/60 font-normal">F</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#121212]/10">
                <td className="py-2 text-[#121212]/60">HEAD MEASUREMENT</td>
                <td className="py-2 text-[#121212]">{unit === "cm" ? "57~62" : "22.4~24.4"}</td>
              </tr>
            </tbody>
          </table>
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
  colorVariants = [],
  themeId,
  onAddToCart,
}: Props) {
  // ── Color variant state (client-side switching with slide transitions) ──
  const initialVariantIdx = colorVariants.length > 1
    ? Math.max(0, colorVariants.findIndex(v => v.isCurrent))
    : -1;
  const [activeVariantIdx, setActiveVariantIdx] = useState(initialVariantIdx);
  const [slidePhase, setSlidePhase] = useState<'idle' | 'slide-out' | 'slide-in'>('idle');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const animatingRef = useRef(false);

  // Derive gallery from active variant (if available) or fall back to product images
  const activeVariant = activeVariantIdx >= 0 ? colorVariants[activeVariantIdx] : null;
  const images: ProductImage[] = activeVariant && activeVariant.images.length > 0
    ? activeVariant.images
    : product.images?.length
    ? product.images
    : product.image
    ? [{ url: product.image, alt: product.name }]
    : [];
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  // Compute slide transform style for images only
  const slideStyle: CSSProperties = slidePhase === 'slide-out'
    ? {
        transform: `translateX(${slideDirection === 'left' ? '-40px' : '40px'})`,
        opacity: 0,
        transition: 'transform 250ms ease-in-out, opacity 250ms ease-in-out',
      }
    : slidePhase === 'slide-in'
    ? {
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'transform 250ms ease-in-out, opacity 250ms ease-in-out',
      }
    : { transform: 'translateX(0)', opacity: 1 };

  // Handle color variant switch with slide transition
  const handleVariantSwitch = useCallback((idx: number) => {
    if (idx === activeVariantIdx || animatingRef.current) return;
    animatingRef.current = true;

    const dir = idx > activeVariantIdx ? 'left' : 'right';
    setSlideDirection(dir);
    setSlidePhase('slide-out');

    // After slide-out, swap content and slide in
    setTimeout(() => {
      setActiveVariantIdx(idx);
      setSelectedImage(0);
      // Brief delay then slide in
      requestAnimationFrame(() => {
        setSlidePhase('slide-in');
        setTimeout(() => {
          setSlidePhase('idle');
          animatingRef.current = false;
        }, 280);
      });
    }, 260);
  }, [activeVariantIdx]);

  const name = activeVariant
    ? (product.translations?.[locale] || activeVariant.name)
    : (product.translations?.[locale] || product.name);
  const description = product.descTranslations?.[locale] || product.description;
  const price = activeVariant ? activeVariant.price : parseFloat(String(product.sellingPrice));
  const activeStock = activeVariant ? activeVariant.stock : product.stock;
  const inStock = activeStock == null || activeStock > 0;
  const activeColorName = activeVariant?.colorName || colorVariants.find(v => v.isCurrent)?.colorName || "";

  // Default detail sections — 商品描述 first, then shipping/returns
  const sections: DetailSection[] = detailSections || [
    // Product description as first expandable section (like Savewo's layout)
    ...(description ? [{
      title: t(locale, "商品描述", "Product Description", "Descrição", "商品説明"),
      content: description,
      defaultOpen: true,
    }] : []),
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
    const productId = activeVariant ? activeVariant.id : product.id;
    const result = await onAddToCart(productId, 1);
    setAdding(false);
    if (result.success) {
      window.dispatchEvent(new CustomEvent("storefront:cart-open"));
    } else if (result.error) {
      setAddedMessage(result.error);
    }
  };

  const catName = product.categoryName
    ? (product.categoryTranslations?.[locale] || product.categoryName)
    : null;

  /* ─── HUMAN MADE variant ───
     Large image left, minimal product info right, clean accordion,
     #121212 text, 12px font, no rounded corners, black add-to-cart button
  */
  if (themeId === "humanmade") {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb — TOP > ALL ITEMS > CATEGORY > PRODUCT */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-[#121212]/60" style={{ fontSize: "11px", letterSpacing: "0.08em" }}>
              <li><a href={`/${locale}`} className="hover:text-[#121212] transition-colors">TOP</a></li>
              <li><span>&gt;</span></li>
              <li><a href={`/${locale}/products`} className="hover:text-[#121212] transition-colors">{t(locale, "全部商品", "ALL ITEMS", "TODOS", "全商品")}</a></li>
              {catName && product.categorySlug && (
                <>
                  <li><span>&gt;</span></li>
                  <li><a href={`/${locale}/categories/${product.categorySlug}`} className="hover:text-[#121212] transition-colors">{catName.toUpperCase()}</a></li>
                </>
              )}
              <li><span>&gt;</span></li>
              <li className="text-[#121212] truncate max-w-[200px]">{name}</li>
            </ol>
          </nav>

          <div className="lg:grid lg:grid-cols-2 lg:gap-x-10">
            {/* ── Image gallery ── */}
            <div>
              {/* Main image — no rounded corners, object-contain like humanmade.jp */}
              <div
                className="relative w-full overflow-hidden bg-[#f5f5f5]"
                style={{ aspectRatio: "1/1", ...slideStyle }}
              >
                {images.length > 0 ? (
                  <Image
                    src={images[selectedImage]?.url}
                    alt={images[selectedImage]?.alt || name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    className="object-contain"
                  />
                ) : (
                  <div className="size-full flex items-center justify-center text-[#121212]/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Thumbnail row */}
              {images.length > 1 && (
                <div
                  className="mt-3 grid grid-cols-4 gap-2"
                  style={slideStyle}
                >
                  {images.slice(0, 4).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`relative aspect-square overflow-hidden bg-[#f5f5f5] ${i === selectedImage ? "ring-1 ring-[#121212]" : "ring-1 ring-transparent hover:ring-[#121212]/30"} transition-all`}
                    >
                      <Image src={img.url} alt={img.alt || name} fill sizes="80px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Product info ── */}
            <div className="mt-8 lg:mt-0">
              {/* NEW badge */}
              <div style={{ minHeight: "1.4rem" }}>
                <span className="text-[#dc3545]" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>NEW</span>
              </div>

              {/* Product name + price — static, doesn't change between variants */}
              <h1
                className="text-[#121212]"
                style={{ fontSize: "16px", letterSpacing: "0.06rem", lineHeight: "1.6" }}
              >
                {name}
              </h1>

              {/* Price */}
              <p className="mt-3 text-[#121212]" style={{ fontSize: "14px", letterSpacing: "0.06rem" }}>
                MOP${price.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </p>

              {/* Color variants — clickable product image swatches with crossfade */}
              {colorVariants.length > 1 && (
                <div className="mt-5">
                  <p className="text-[#121212]/60" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>
                    Color: <span className="text-[#121212]">{activeColorName}</span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {colorVariants.map((variant, idx) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => handleVariantSwitch(idx)}
                        className={`relative block overflow-hidden transition-all cursor-pointer ${
                          idx === activeVariantIdx
                            ? "ring-1 ring-[#121212]"
                            : "ring-1 ring-[#e5e5e5] hover:ring-[#121212]/50"
                        }`}
                        style={{ width: "64px", height: "64px" }}
                        title={variant.colorName || variant.name}
                      >
                        {variant.image ? (
                          <Image
                            src={variant.image}
                            alt={variant.colorName || variant.name}
                            fill
                            sizes="64px"
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#f5f5f5] flex items-center justify-center">
                            <span className="text-[#121212]/30" style={{ fontSize: "9px" }}>
                              {variant.colorName?.charAt(0) || "?"}
                            </span>
                          </div>
                        )}
                        {/* Sold out overlay */}
                        {variant.stock !== null && variant.stock <= 0 && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <span className="text-[#121212]/50" style={{ fontSize: "7px", letterSpacing: "0.05em" }}>
                              SOLD OUT
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size selector */}
              <div className="mt-6">
                <p className="text-[#121212]/60" style={{ fontSize: "11px", letterSpacing: "0.05em" }}>SIZE</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["F"].map((size) => (
                    <button
                      key={size}
                      className="flex items-center justify-center border border-[#121212] bg-[#121212] text-white px-4 py-2 transition-colors"
                      style={{ fontSize: "12px", letterSpacing: "0.05em", minWidth: "48px" }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add to cart — full-width black button */}
              <div className="mt-8">
                <button
                  type="button"
                  disabled={!inStock || adding}
                  onClick={handleAddToCart}
                  className="w-full bg-[#121212] py-4 text-white hover:bg-[#121212]/90 transition-colors disabled:bg-[#121212]/30 disabled:cursor-not-allowed"
                  style={{ fontSize: "13px", letterSpacing: "0.1em" }}
                >
                  {adding
                    ? "..."
                    : !inStock
                    ? t(locale, "售罄", "SOLD OUT", "ESGOTADO", "在庫切れ")
                    : t(locale, "加入購物車", "ADD TO CART", "ADICIONAR", "カートに追加")
                  }
                </button>
              </div>

              {/* Added message */}
              {addedMessage && (
                <p className="mt-3 text-[#121212]" style={{ fontSize: "12px", letterSpacing: "0.05em" }}>{addedMessage}</p>
              )}

              {/* Wishlist */}
              <button
                type="button"
                className="mt-3 flex items-center gap-2 text-[#121212]/60 hover:text-[#121212] transition-colors"
                style={{ fontSize: "12px", letterSpacing: "0.05em" }}
              >
                <HeartIcon className="size-4" />
                {t(locale, "加入收藏", "ADD TO WISHLIST", "ADICIONAR AOS FAVORITOS", "ウィッシュリストに追加")}
              </button>

              {/* Description — shown directly (not in accordion) for HM theme */}
              {description && (
                <div className="mt-8 border-t border-[#121212]/10 pt-6">
                  <div className="text-[#121212]/70 whitespace-pre-line" style={{ fontSize: "12px", letterSpacing: "0.04em", lineHeight: "2" }}>
                    {description}
                  </div>
                </div>
              )}

              {/* Expandable sections — size guide + shipping/returns */}
              <div className="mt-4 divide-y divide-[#121212]/10 border-t border-[#121212]/10">
                <HMSizeGuideSection locale={locale} />
                {sections.filter(s => !s.defaultOpen).map((section, i) => (
                  <HMDisclosureSection
                    key={i}
                    title={section.title}
                    items={section.items}
                    content={section.content}
                    defaultOpen={section.defaultOpen}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Related products ── */}
          {relatedProducts.length > 0 && (
            <section className="mt-16 border-t border-[#121212]/8 pt-10">
              <h2
                className="text-center text-[#121212]"
                style={{ fontSize: "16px", letterSpacing: "0.1rem" }}
              >
                {t(locale, "你可能也會喜歡", "YOU MAY ALSO LIKE", "VOCÊ TAMBÉM PODE GOSTAR", "おすすめ商品")}
              </h2>

              <div className="mt-8 grid grid-cols-2 gap-x-2 gap-y-6 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-8">
                {relatedProducts.map((rp) => (
                  <a
                    key={rp.id}
                    href={rp.slug ? `/${locale}/products/${rp.slug}` : "#"}
                    className="group block"
                  >
                    <div className="relative overflow-hidden bg-[#f5f5f5]" style={{ aspectRatio: "1/1" }}>
                      {rp.image ? (
                        <Image
                          src={rp.image}
                          alt={rp.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          className="object-contain transition-transform duration-500 ease-in-out group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center text-[#121212]/20">
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <h3
                        className="text-[#121212] line-clamp-1"
                        style={{ fontSize: "12px", letterSpacing: "0.06rem", lineHeight: "1.5" }}
                      >
                        {rp.name}
                      </h3>
                      <p className="mt-0.5 text-[#121212]" style={{ fontSize: "12px", letterSpacing: "0.06rem" }}>
                        MOP${rp.price.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        {/* Breadcrumb — full width */}
        <nav aria-label="Breadcrumb" className="mb-8 border-b border-gray-200 pb-4">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
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
            <li className="text-gray-900 font-medium">{name}</li>
          </ol>
        </nav>

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
                      className="relative flex aspect-square cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium text-gray-900 uppercase hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sf-accent/50 focus:ring-offset-4"
                    >
                      <span className="sr-only">{img.alt || `Image ${i + 1}`}</span>
                      <span className="absolute inset-0 overflow-hidden rounded-md">
                        <Image src={img.url} alt={img.alt || name} fill sizes="80px" className="object-cover" />
                      </span>
                      {/* Selection ring */}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-0 rounded-md ring-2 ring-offset-2 ${i === selectedImage ? "ring-sf-accent" : "ring-transparent"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              {images.length > 0 ? (
                <Image
                  src={images[selectedImage]?.url}
                  alt={images[selectedImage]?.alt || name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-cover sm:rounded-lg"
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
                      <StarSolidIcon key={star} className="size-5 shrink-0 text-sf-accent-hover" />
                    ) : (
                      <StarSolidIcon key={star} className="size-5 shrink-0 text-gray-300" />
                    )
                  )}
                </div>
                <p className="sr-only">4 out of 5 stars</p>
              </div>
            </div>

            {/* Short description (first sentence/paragraph) */}
            {description && (
              <div className="mt-6">
                <h3 className="sr-only">{t(locale, "描述", "Description", "Descrição", "説明")}</h3>
                <p className="text-base text-gray-700 line-clamp-3">
                  {description.split("\n")[0]}
                </p>
              </div>
            )}

            {/* Add to bag + Favorite */}
            <div className="mt-10 flex">
              <button
                type="button"
                disabled={!inStock || adding}
                onClick={handleAddToCart}
                className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-sf-accent px-8 py-3 text-base font-medium text-white hover:bg-sf-accent focus:outline-2 focus:ring-sf-accent focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full disabled:bg-gray-300 disabled:cursor-not-allowed"
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
                    content={section.content}
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
                        <Image src={rp.image} alt={rp.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover" />
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
