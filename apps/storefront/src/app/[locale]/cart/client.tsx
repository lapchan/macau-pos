"use client";

import CartPageView from "@/components/cart/cart-page-view";
import { updateCartItemQuantity, removeCartItem } from "@/lib/actions/cart";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

type CartItemData = {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  inStock: boolean;
  maxQuantity?: number;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function CartPageClient({
  items,
  locale,
  themeId,
}: {
  items: CartItemData[];
  locale: string;
  themeId?: string;
}) {
  const router = useRouter();

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    await updateCartItemQuantity(id, quantity);
    router.refresh();
  };

  const handleRemove = async (id: string) => {
    await removeCartItem(id);
    router.refresh();
  };

  // ── HUMAN MADE variant ──────────────────────────────────
  if (themeId === "humanmade") {
    return (
      <HumanMadeCart
        items={items}
        locale={locale}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
      />
    );
  }

  // ── Default variant ─────────────────────────────────────
  return (
    <CartPageView
      items={items}
      locale={locale}
      onUpdateQuantity={handleUpdateQuantity}
      onRemove={handleRemove}
    />
  );
}

// ── HUMAN MADE Cart Component ───────────────────────────────
function HumanMadeCart({
  items,
  locale,
  onUpdateQuantity,
  onRemove,
}: {
  items: CartItemData[];
  locale: string;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleQtyChange = async (id: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(id);
    await onUpdateQuantity(id, newQty);
    setUpdatingId(null);
  };

  const handleRemove = async (id: string) => {
    setUpdatingId(id);
    await onRemove(id);
    setUpdatingId(null);
  };

  // ── Empty cart ──────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="bg-white min-h-[60vh] flex flex-col">
        <div className="w-full max-w-[960px] mx-auto px-4 py-16">
          {/* Breadcrumb */}
          <nav className="mb-10" style={{ fontSize: "11px", letterSpacing: "0.05em", color: "#121212" }}>
            <a href={`/${locale}`} className="opacity-60 hover:opacity-100">TOP</a>
            <span className="mx-2 opacity-40">&gt;</span>
            <span>{t(locale, "購物車", "CART", "CARRINHO", "カート")}</span>
          </nav>

          <h1
            className="text-center font-normal mb-12"
            style={{ fontSize: "20px", letterSpacing: "0.08em", color: "#121212" }}
          >
            {t(locale, "購物車", "CART", "CARRINHO", "カート")}
          </h1>

          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p style={{ fontSize: "13px", letterSpacing: "0.05em", color: "#121212" }}>
              {t(locale, "購物車內沒有任何商品。", "Your cart is empty.", "Seu carrinho está vazio.", "カートに商品がありません。")}
            </p>
            <a
              href={`/${locale}/products`}
              className="mt-8 inline-block bg-[#121212] text-white text-center hover:opacity-80 transition-opacity"
              style={{
                fontSize: "12px",
                letterSpacing: "0.1em",
                padding: "14px 48px",
              }}
            >
              {t(locale, "繼續購物", "CONTINUE SHOPPING", "CONTINUAR COMPRANDO", "買い物を続ける")}
            </a>
          </div>
        </div>

        {/* Bottom breadcrumb (mobile) */}
        <div className="mt-auto border-t border-[#e5e5e5] py-4 px-4 sm:hidden">
          <nav style={{ fontSize: "10px", letterSpacing: "0.05em", color: "#121212" }}>
            <a href={`/${locale}`} className="opacity-60">TOP</a>
            <span className="mx-1.5 opacity-40">&gt;</span>
            <span>{t(locale, "購物車", "CART", "CARRINHO", "カート")}</span>
          </nav>
        </div>
      </div>
    );
  }

  // ── Cart with items ─────────────────────────────────────
  return (
    <div className="bg-white min-h-[60vh]">
      <div className="w-full max-w-[960px] mx-auto px-4 py-16">
        {/* Breadcrumb */}
        <nav className="mb-10" style={{ fontSize: "11px", letterSpacing: "0.05em", color: "#121212" }}>
          <a href={`/${locale}`} className="opacity-60 hover:opacity-100">TOP</a>
          <span className="mx-2 opacity-40">&gt;</span>
          <span>{t(locale, "購物車", "CART", "CARRINHO", "カート")}</span>
        </nav>

        <h1
          className="text-center font-normal mb-12"
          style={{ fontSize: "20px", letterSpacing: "0.08em", color: "#121212" }}
        >
          {t(locale, "購物車", "CART", "CARRINHO", "カート")}
        </h1>

        {/* Cart items — desktop table */}
        <div className="hidden sm:block">
          {/* Table header */}
          <div
            className="grid border-b border-[#121212] pb-3"
            style={{
              gridTemplateColumns: "100px 1fr 140px 120px 100px 40px",
              gap: "16px",
              fontSize: "11px",
              letterSpacing: "0.05em",
              color: "rgba(18,18,18,0.6)",
            }}
          >
            <div></div>
            <div>{t(locale, "商品", "PRODUCT", "PRODUTO", "商品")}</div>
            <div className="text-center">{t(locale, "單價", "PRICE", "PREÇO", "価格")}</div>
            <div className="text-center">{t(locale, "數量", "QTY", "QTD", "数量")}</div>
            <div className="text-right">{t(locale, "小計", "TOTAL", "TOTAL", "合計")}</div>
            <div></div>
          </div>

          {/* Items */}
          {items.map((item) => (
            <div
              key={item.id}
              className="grid items-center border-b border-[#e5e5e5] py-6"
              style={{
                gridTemplateColumns: "100px 1fr 140px 120px 100px 40px",
                gap: "16px",
                opacity: updatingId === item.id ? 0.5 : 1,
                transition: "opacity 0.2s",
              }}
            >
              {/* Image */}
              <div className="relative w-[100px] h-[100px] bg-white">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="100px"
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#f5f5f5]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
                      <rect width="18" height="18" x="3" y="3" rx="0" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product name */}
              <div>
                <p style={{ fontSize: "12px", letterSpacing: "0.05em", color: "#121212", lineHeight: "1.6" }}>
                  {item.name}
                </p>
              </div>

              {/* Unit price */}
              <div className="text-center" style={{ fontSize: "12px", letterSpacing: "0.05em", color: "#121212" }}>
                MOP$ {item.price.toLocaleString()}
              </div>

              {/* Quantity controls */}
              <div className="flex items-center justify-center gap-0">
                <button
                  onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1 || updatingId === item.id}
                  className="w-8 h-8 flex items-center justify-center border border-[#e5e5e5] hover:border-[#121212] transition-colors disabled:opacity-30"
                  style={{ fontSize: "14px", color: "#121212" }}
                >
                  −
                </button>
                <div
                  className="w-10 h-8 flex items-center justify-center border-t border-b border-[#e5e5e5]"
                  style={{ fontSize: "12px", letterSpacing: "0.05em", color: "#121212" }}
                >
                  {item.quantity}
                </div>
                <button
                  onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                  disabled={updatingId === item.id}
                  className="w-8 h-8 flex items-center justify-center border border-[#e5e5e5] hover:border-[#121212] transition-colors disabled:opacity-30"
                  style={{ fontSize: "14px", color: "#121212" }}
                >
                  +
                </button>
              </div>

              {/* Line total */}
              <div className="text-right" style={{ fontSize: "12px", letterSpacing: "0.05em", color: "#121212" }}>
                MOP$ {(item.price * item.quantity).toLocaleString()}
              </div>

              {/* Remove */}
              <button
                onClick={() => handleRemove(item.id)}
                disabled={updatingId === item.id}
                className="flex items-center justify-center hover:opacity-60 transition-opacity disabled:opacity-30"
                style={{ color: "#121212" }}
                title={t(locale, "移除", "Remove", "Remover", "削除")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Cart items — mobile list */}
        <div className="sm:hidden">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 border-b border-[#e5e5e5] py-5"
              style={{ opacity: updatingId === item.id ? 0.5 : 1, transition: "opacity 0.2s" }}
            >
              {/* Image */}
              <div className="relative w-[80px] h-[80px] shrink-0 bg-white">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#f5f5f5]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
                      <rect width="18" height="18" x="3" y="3" rx="0" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p
                    className="truncate pr-2"
                    style={{ fontSize: "12px", letterSpacing: "0.05em", color: "#121212", lineHeight: "1.6" }}
                  >
                    {item.name}
                  </p>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="shrink-0 hover:opacity-60"
                    style={{ color: "#121212" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="mt-1" style={{ fontSize: "12px", letterSpacing: "0.05em", color: "#121212" }}>
                  MOP$ {item.price.toLocaleString()}
                </p>

                {/* Qty controls */}
                <div className="flex items-center gap-0 mt-3">
                  <button
                    onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-7 h-7 flex items-center justify-center border border-[#e5e5e5] disabled:opacity-30"
                    style={{ fontSize: "13px", color: "#121212" }}
                  >
                    −
                  </button>
                  <div
                    className="w-9 h-7 flex items-center justify-center border-t border-b border-[#e5e5e5]"
                    style={{ fontSize: "11px", color: "#121212" }}
                  >
                    {item.quantity}
                  </div>
                  <button
                    onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center border border-[#e5e5e5]"
                    style={{ fontSize: "13px", color: "#121212" }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="mt-10 flex flex-col items-end">
          {/* Subtotal */}
          <div className="w-full sm:w-[320px]">
            <div className="flex justify-between items-center py-3 border-b border-[#e5e5e5]">
              <span style={{ fontSize: "12px", letterSpacing: "0.05em", color: "rgba(18,18,18,0.6)" }}>
                {t(locale, "小計", "SUBTOTAL", "SUBTOTAL", "小計")}
              </span>
              <span style={{ fontSize: "14px", letterSpacing: "0.05em", color: "#121212" }}>
                MOP$ {subtotal.toLocaleString()}
              </span>
            </div>

            <p className="mt-3" style={{ fontSize: "11px", letterSpacing: "0.03em", color: "rgba(18,18,18,0.5)" }}>
              {t(locale, "運費將於結帳時計算", "Shipping calculated at checkout", "Frete calculado no checkout", "送料はチェックアウト時に計算されます")}
            </p>

            {/* Checkout button */}
            <a
              href={`/${locale}/checkout`}
              className="mt-6 w-full flex items-center justify-center bg-[#121212] text-white hover:opacity-80 transition-opacity"
              style={{
                fontSize: "12px",
                letterSpacing: "0.1em",
                padding: "15px 0",
              }}
            >
              {t(locale, "結帳", "CHECKOUT", "FINALIZAR", "チェックアウト")}
            </a>

            {/* Continue shopping */}
            <a
              href={`/${locale}/products`}
              className="mt-4 w-full flex items-center justify-center border border-[#121212] text-[#121212] hover:bg-[#121212] hover:text-white transition-colors"
              style={{
                fontSize: "12px",
                letterSpacing: "0.1em",
                padding: "15px 0",
              }}
            >
              {t(locale, "繼續購物", "CONTINUE SHOPPING", "CONTINUAR COMPRANDO", "買い物を続ける")}
            </a>
          </div>
        </div>
      </div>

      {/* Bottom breadcrumb (mobile) */}
      <div className="border-t border-[#e5e5e5] py-4 px-4 sm:hidden">
        <nav style={{ fontSize: "10px", letterSpacing: "0.05em", color: "#121212" }}>
          <a href={`/${locale}`} className="opacity-60">TOP</a>
          <span className="mx-1.5 opacity-40">&gt;</span>
          <span>{t(locale, "購物車", "CART", "CARRINHO", "カート")}</span>
        </nav>
      </div>
    </div>
  );
}
