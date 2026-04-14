"use client";

import { XMarkIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import CartItemRow from "./cart-item-row";

type CartItemData = {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  image?: string | null;
  inStock: boolean;
  maxQuantity?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  items: CartItemData[];
  locale: string;
  currency?: string;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function CartDrawer({ open, onClose, items, locale, currency = "MOP", onUpdateQuantity, onRemove }: Props) {
  if (!open) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-500/75 transition-opacity" onClick={onClose} />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md">
          <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
            {/* Header */}
            <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
              <div className="flex items-start justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  {t(locale, "購物車", "Shopping cart", "Carrinho de compras", "ショッピングカート")}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="-mr-2 flex items-center justify-center rounded-md p-2 text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close panel</span>
                  <XMarkIcon className="size-6" aria-hidden="true" />
                </button>
              </div>

              {/* Items */}
              <div className="mt-8">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ShoppingBagIcon className="size-12 text-gray-300" />
                    <h3 className="mt-4 text-sm font-medium text-gray-900">
                      {t(locale, "購物車是空的", "Your cart is empty", "Seu carrinho está vazio", "カートは空です")}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {t(locale, "開始添加一些商品吧！", "Start adding some items!", "Comece adicionando itens!", "商品を追加してください！")}
                    </p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="mt-6 rounded-md bg-sf-accent px-6 py-2 text-sm font-medium text-white hover:bg-sf-accent-hover"
                    >
                      {t(locale, "繼續購物", "Continue Shopping", "Continuar Comprando", "買い物を続ける")}
                    </button>
                  </div>
                ) : (
                  <ul role="list" className="-my-6 divide-y divide-gray-200">
                    {items.map((item) => (
                      <CartItemRow
                        key={item.id}
                        item={item}
                        locale={locale}
                        currency={currency}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemove={onRemove}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>{t(locale, "小計", "Subtotal", "Subtotal", "小計")}</p>
                  <p>{currency} {subtotal.toFixed(2)}</p>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">
                  {t(locale, "運費及稅項將於結帳時計算。", "Shipping and taxes calculated at checkout.", "Frete e impostos calculados no checkout.", "送料と税金はチェックアウト時に計算されます。")}
                </p>
                <div className="mt-6">
                  <a
                    href={`/${locale}/checkout`}
                    className="flex items-center justify-center rounded-md border border-transparent bg-sf-accent px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-sf-accent"
                  >
                    {t(locale, "結帳", "Checkout", "Finalizar compra", "チェックアウト")}
                  </a>
                </div>
                <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                  <p>
                    {t(locale, "或", "or", "ou", "または")}{" "}
                    <button type="button" onClick={onClose} className="font-medium text-sf-accent hover:text-sf-accent-hover">
                      {t(locale, "繼續購物", "Continue Shopping", "Continuar Comprando", "買い物を続ける")}
                      <span aria-hidden="true"> &rarr;</span>
                    </button>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
