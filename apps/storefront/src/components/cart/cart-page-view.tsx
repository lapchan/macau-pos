"use client";

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

export default function CartPageView({ items, locale, currency = "MOP", onUpdateQuantity, onRemove }: Props) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping: number = 0; // Will be calculated at checkout
  const total = subtotal + shipping;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {t(locale, "購物車", "Shopping Cart", "Carrinho de Compras", "ショッピングカート")}
        </h1>

        <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          {/* Cart items */}
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">Items in your shopping cart</h2>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300">
                  <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                <p className="mt-4 text-lg font-medium text-gray-900">
                  {t(locale, "購物車是空的", "Your cart is empty", "Seu carrinho está vazio", "カートは空です")}
                </p>
                <a
                  href={`/${locale}/products`}
                  className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  {t(locale, "繼續購物", "Continue Shopping", "Continuar Comprando", "買い物を続ける")}
                  <span aria-hidden="true"> &rarr;</span>
                </a>
              </div>
            ) : (
              <ul role="list" className="divide-y divide-gray-200 border-b border-t border-gray-200">
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
          </section>

          {/* Order summary */}
          {items.length > 0 && (
            <section
              aria-labelledby="summary-heading"
              className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
            >
              <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
                {t(locale, "訂單摘要", "Order summary", "Resumo do pedido", "注文概要")}
              </h2>

              <dl className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-600">{t(locale, "小計", "Subtotal", "Subtotal", "小計")}</dt>
                  <dd className="text-sm font-medium text-gray-900">{currency} {subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-sm text-gray-600">{t(locale, "運費", "Shipping estimate", "Estimativa de frete", "送料")}</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {shipping === 0
                      ? t(locale, "結帳時計算", "Calculated at checkout", "Calculado no checkout", "チェックアウト時に計算")
                      : `${currency} ${shipping.toFixed(2)}`
                    }
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <dt className="text-base font-medium text-gray-900">{t(locale, "總計", "Order total", "Total do pedido", "合計")}</dt>
                  <dd className="text-base font-medium text-gray-900">{currency} {total.toFixed(2)}</dd>
                </div>
              </dl>

              <div className="mt-6">
                <a
                  href={`/${locale}/checkout`}
                  className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {t(locale, "結帳", "Checkout", "Finalizar compra", "チェックアウト")}
                </a>
              </div>

              <div className="mt-6 text-center">
                <a href={`/${locale}/products`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  {t(locale, "繼續購物", "Continue Shopping", "Continuar Comprando", "買い物を続ける")}
                  <span aria-hidden="true"> &rarr;</span>
                </a>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
