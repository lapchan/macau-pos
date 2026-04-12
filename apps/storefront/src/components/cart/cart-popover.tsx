"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Image from "@/components/shared/store-thumb";
import { ShoppingBagIcon, XMarkIcon, TrashIcon, MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { updateCartItemQuantity, removeCartItem } from "@/lib/actions/cart";

type CartItem = {
  id: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  image?: string | null;
  slug?: string | null;
};

type Props = {
  items: CartItem[];
  itemCount: number;
  locale: string;
  currency?: string;
  isDark?: boolean;
  themeId?: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

function formatPrice(currency: string, amount: number) {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CartPopover({
  items,
  itemCount,
  locale,
  currency = "MOP",
  isDark = true,
  themeId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [localItems, setLocalItems] = useState(items);
  const [, startTransition] = useTransition();
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open]);

  const isHumanMade = themeId === "humanmade";

  const handleQty = (id: string, next: number) => {
    if (next < 1) {
      setLocalItems((prev) => prev.filter((i) => i.id !== id));
      startTransition(() => { removeCartItem(id); });
      return;
    }
    setLocalItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: next } : i)));
    startTransition(() => { updateCartItemQuantity(id, next); });
  };

  const handleRemove = (id: string) => {
    setLocalItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => { removeCartItem(id); });
  };

  const subtotal = localItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const localItemCount = localItems.reduce((sum, i) => sum + i.quantity, 0);

  // Theme tokens
  const panelBg = "bg-white";
  const panelRadius = isHumanMade ? "" : "rounded-xl";
  const panelShadow = "shadow-2xl";
  const panelRing = isHumanMade ? "border border-[#121212]/10" : "ring-1 ring-gray-900/5";
  const headingFont = isHumanMade
    ? "text-[18px] font-normal tracking-[0.12em] uppercase text-[#121212]"
    : "text-base font-semibold text-gray-900";
  const labelFont = isHumanMade
    ? "text-[11px] uppercase tracking-[0.1em] text-[#121212]"
    : "text-sm text-gray-700";
  const priceFont = isHumanMade
    ? "text-[13px] text-[#121212]"
    : "text-sm font-medium text-gray-900";
  const secondaryFont = isHumanMade
    ? "text-[11px] text-[#121212]/60 tracking-[0.03em]"
    : "text-xs text-gray-500";
  const outlinedBtn = isHumanMade
    ? "w-full border border-[#121212] bg-white px-4 py-3 text-[11px] font-normal uppercase tracking-[0.1em] text-[#121212] hover:bg-[#f5f5f5] transition-colors"
    : "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors";
  const filledBtn = isHumanMade
    ? "block w-full border border-[#121212] bg-[#121212] px-4 py-3 text-center text-[11px] font-normal uppercase tracking-[0.1em] text-white hover:bg-[#333] transition-colors"
    : "block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-white hover:opacity-90 transition-opacity";
  const filledStyle = isHumanMade ? undefined : { backgroundColor: "var(--tenant-accent, #111)" };
  const stepperWrap = isHumanMade
    ? "inline-flex h-9 items-stretch border border-[#121212] select-none"
    : "inline-flex h-9 items-stretch rounded-md border border-gray-300 select-none overflow-hidden";
  const stepBtnCls = isHumanMade
    ? "flex w-9 items-center justify-center text-[#121212] hover:bg-[#f5f5f5] active:bg-[#ececec]"
    : "flex w-9 items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100";
  const qtyCell = isHumanMade
    ? "flex w-10 items-center justify-center border-x border-[#121212] text-[13px] tabular-nums text-[#121212]"
    : "flex w-10 items-center justify-center border-x border-gray-300 text-sm tabular-nums text-gray-900";
  const trashBtn = "ml-3 flex h-9 items-center text-[#121212]/50 hover:text-[#121212]";

  return (
    <div className="relative">
      {/* Cart button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className={isHumanMade ? "relative p-1 text-[#121212]" : "group -m-2 flex items-center p-2"}
        aria-label={t(locale, "購物車", "Cart", "Carrinho", "カート")}
      >
        <ShoppingBagIcon
          className={isHumanMade ? "size-5" : `size-6 shrink-0 ${isDark ? "text-white" : "text-gray-700"}`}
          aria-hidden="true"
        />
        {isHumanMade ? (
          localItemCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#121212] text-[8px] text-white">
              {localItemCount}
            </span>
          )
        ) : (
          <span className={`ml-2 text-sm font-medium ${isDark ? "text-white" : "text-gray-700"}`}>{localItemCount}</span>
        )}
      </button>

      {/* Popover panel */}
      {open && (
        <div
          ref={popoverRef}
          className={`absolute right-0 top-full z-40 mt-3 w-[360px] max-w-[92vw] ${panelBg} ${panelRadius} ${panelShadow} ${panelRing}`}
          role="dialog"
          aria-label={t(locale, "購物車", "Shopping cart", "Carrinho de compras", "ショッピングカート")}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className={headingFont}>{t(locale, "購物車", "CART", "CARRINHO", "カート")}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 text-[#121212]/60 hover:text-[#121212]"
              aria-label={t(locale, "關閉", "Close", "Fechar", "閉じる")}
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>

          {localItems.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <ShoppingBagIcon className="mx-auto size-10 text-[#121212]/20" />
              <p className={`mt-3 ${secondaryFont}`}>
                {t(locale, "購物車是空的", "Your cart is empty", "Carrinho vazio", "カートは空です")}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={`mt-5 ${outlinedBtn}`}
              >
                {t(locale, "繼續購物", "Continue shopping", "Continuar", "買い物を続ける")}
              </button>
            </div>
          ) : (
            <>
              {/* Items */}
              <ul role="list" className={`max-h-[50vh] overflow-y-auto divide-y ${isHumanMade ? "divide-[#121212]/10" : "divide-gray-100"}`}>
                {localItems.map((item) => (
                  <li key={item.id} className="px-6 py-5">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className={`relative size-20 shrink-0 overflow-hidden ${isHumanMade ? "" : "rounded-md"} bg-[#f5f5f5]`}>
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-contain object-center"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-[#121212]/30 text-xs font-bold">
                            {item.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start gap-3">
                          <h3 className={`${labelFont} line-clamp-2 flex-1`}>
                            {item.slug ? (
                              <a href={`/${locale}/products/${item.slug}`} onClick={() => setOpen(false)}>
                                {item.name}
                              </a>
                            ) : (
                              item.name
                            )}
                          </h3>
                          <p className={`${priceFont} shrink-0 tabular-nums text-right min-w-[88px]`}>
                            {formatPrice(currency, item.price * item.quantity)}
                          </p>
                        </div>
                        <p className={`mt-1 ${secondaryFont} tabular-nums`}>{formatPrice(currency, item.price)}</p>
                        {item.variant && <p className={secondaryFont}>{item.variant}</p>}
                      </div>
                    </div>

                    {/* Quantity + trash */}
                    <div className="mt-4 flex items-center">
                      <div className={stepperWrap}>
                        <button
                          type="button"
                          onClick={() => handleQty(item.id, item.quantity - 1)}
                          className={stepBtnCls}
                          aria-label={t(locale, "減少", "Decrease", "Diminuir", "減らす")}
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <span className={qtyCell}>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQty(item.id, item.quantity + 1)}
                          className={stepBtnCls}
                          aria-label={t(locale, "增加", "Increase", "Aumentar", "増やす")}
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className={trashBtn}
                        aria-label={t(locale, "移除", "Remove", "Remover", "削除")}
                      >
                        <TrashIcon className="size-[18px]" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className={`border-t ${isHumanMade ? "border-[#121212]/15" : "border-gray-200"} px-6 py-5`}>
                <dl className="space-y-2">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className={labelFont}>
                      {t(locale, "小計", "Subtotal", "Subtotal", "小計")} ({localItemCount})
                    </dt>
                    <dd className={`${priceFont} tabular-nums text-right min-w-[88px]`}>
                      {formatPrice(currency, subtotal)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className={labelFont}>
                      {t(locale, "運費", "Shipping Fee", "Envio", "送料")}
                    </dt>
                    <dd className={`${secondaryFont} text-right`}>
                      {t(locale, "結帳時計算", "Calculated at checkout", "Calc. no checkout", "チェックアウト時")}
                    </dd>
                  </div>
                  <div className={`flex items-baseline justify-between gap-4 pt-2 border-t ${isHumanMade ? "border-[#121212]/10" : "border-gray-100"}`}>
                    <dt className={isHumanMade ? "text-[13px] font-normal uppercase tracking-[0.12em] text-[#121212]" : "text-base font-semibold text-gray-900"}>
                      {t(locale, "總計", "Total", "Total", "合計")}
                    </dt>
                    <dd className={`tabular-nums text-right min-w-[88px] ${isHumanMade ? "text-[15px] text-[#121212]" : "text-base font-semibold text-gray-900"}`}>
                      {formatPrice(currency, subtotal)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Actions */}
              <div className="space-y-3 px-6 pb-6">
                <a
                  href={`/${locale}/cart`}
                  onClick={() => setOpen(false)}
                  className={`${outlinedBtn} block text-center`}
                >
                  {t(locale, "查看購物車", "VIEW CART", "VER CARRINHO", "カートを見る")} ({localItemCount})
                </a>
                <a
                  href={`/${locale}/checkout`}
                  onClick={() => setOpen(false)}
                  className={filledBtn}
                  style={filledStyle}
                >
                  {t(locale, "安全結帳", "SECURE CHECKOUT", "FINALIZAR COMPRA", "レジに進む")}
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
