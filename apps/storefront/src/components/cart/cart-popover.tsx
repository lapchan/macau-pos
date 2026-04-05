"use client";

import { useState, useRef, useEffect } from "react";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";

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
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function CartPopover({ items, itemCount, locale, currency = "MOP", isDark = true }: Props) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on click outside
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

  // Close on escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open]);

  return (
    <div className="relative">
      {/* Cart button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="group -m-2 flex items-center p-2"
      >
        <ShoppingBagIcon className={`size-6 shrink-0 ${isDark ? "text-white" : "text-gray-700"}`} aria-hidden="true" />
        <span className={`ml-2 text-sm font-medium ${isDark ? "text-white" : "text-gray-700"}`}>{itemCount}</span>
        <span className="sr-only">
          {t(locale, "購物車", "items in cart, view bag", "itens no carrinho", "カート内のアイテム")}
        </span>
      </button>

      {/* Popover panel */}
      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full z-30 mt-3 w-80 rounded-lg bg-white shadow-lg ring-1 ring-gray-900/5 animate-fade-in"
        >
          <h2 className="sr-only">Shopping Cart</h2>

          <div className="p-4">
            {items.length === 0 ? (
              <div className="py-6 text-center">
                <ShoppingBagIcon className="mx-auto size-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  {t(locale, "購物車是空的", "Your cart is empty", "Carrinho vazio", "カートは空です")}
                </p>
              </div>
            ) : (
              <>
                <ul role="list" className="divide-y divide-gray-200">
                  {items.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex gap-4 py-4">
                      {/* Image */}
                      <div className="size-16 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="size-full object-cover" />
                        ) : (
                          <div className="size-full flex items-center justify-center text-gray-400 text-[10px] font-bold">
                            {item.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.slug ? (
                            <a href={`/${locale}/products/${item.slug}`} onClick={() => setOpen(false)}>
                              {item.name}
                            </a>
                          ) : (
                            item.name
                          )}
                        </h3>
                        {item.variant && (
                          <p className="mt-0.5 text-sm text-gray-500">{item.variant}</p>
                        )}
                        {item.quantity > 1 && (
                          <p className="mt-0.5 text-sm text-gray-500">x{item.quantity}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {items.length > 5 && (
                  <p className="mt-1 text-center text-xs text-gray-400">
                    +{items.length - 5} {t(locale, "件更多商品", "more items", "mais itens", "件以上")}
                  </p>
                )}

                {/* Checkout button */}
                <a
                  href={`/${locale}/checkout`}
                  className="mt-4 flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  {t(locale, "結帳", "Checkout", "Finalizar", "チェックアウト")}
                </a>

                {/* View Shopping Bag link */}
                <p className="mt-3 text-center">
                  <a
                    href={`/${locale}/cart`}
                    onClick={() => setOpen(false)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    {t(locale, "查看購物車", "View Shopping Bag", "Ver Carrinho", "買い物袋を見る")}
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
