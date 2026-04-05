/**
 * CartVariants — Tailwind Plus Shopping Cart components
 *
 * 2 new variants (in addition to existing cart-drawer, cart-page-view, cart-popover):
 *  - "single-column"     : Simple single-column cart with inline totals
 *  - "with-summary"      : Extended summary with discount code, shipping estimate, tax
 */

"use client";

type CartItem = {
  id: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  image?: string | null;
};

type Props = {
  items: CartItem[];
  variant?: "single-column" | "with-summary";
  locale: string;
  currency?: string;
  onUpdateQuantity?: (id: string, qty: number) => void;
  onRemove?: (id: string) => void;
};

const t = (locale: string, tc: string, en: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt: en, ja: en };
  return m[locale] || en;
};

export default function CartVariants({ items, variant = "single-column", locale, currency = "MOP", onUpdateQuantity, onRemove }: Props) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ── Single column ──────────────────────────────────────
  if (variant === "single-column") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {t(locale, "購物車", "Shopping Cart")}
        </h1>

        <ul role="list" className="mt-8 divide-y divide-gray-200 border-t border-b border-gray-200">
          {items.map((item) => (
            <li key={item.id} className="flex py-6">
              <div className="size-24 shrink-0 overflow-hidden rounded-md bg-gray-100">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-gray-400 text-xs">{item.name.charAt(0)}</div>
                )}
              </div>
              <div className="ml-4 flex flex-1 flex-col">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <h3>{item.name}</h3>
                  <p className="ml-4">{currency} {(item.price * item.quantity).toFixed(2)}</p>
                </div>
                {item.variant && <p className="mt-1 text-sm text-gray-500">{item.variant}</p>}
                <div className="flex flex-1 items-end justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <label className="text-gray-500">{t(locale, "數量", "Qty")}</label>
                    <select
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity?.(item.id, parseInt(e.target.value))}
                      className="rounded border-gray-300 text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => onRemove?.(item.id)} className="font-medium text-indigo-600 hover:text-indigo-500">
                    {t(locale, "移除", "Remove")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          <div className="flex justify-between text-base font-medium text-gray-900">
            <p>{t(locale, "小計", "Subtotal")}</p>
            <p>{currency} {subtotal.toFixed(2)}</p>
          </div>
          <p className="mt-1 text-sm text-gray-500">{t(locale, "運費及稅項將於結帳時計算", "Shipping and taxes calculated at checkout")}</p>
          <div className="mt-6">
            <a href={`/${locale}/checkout`} className="flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700">
              {t(locale, "結帳", "Checkout")}
            </a>
          </div>
          <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
            <a href={`/${locale}/products`} className="font-medium text-indigo-600 hover:text-indigo-500">
              {t(locale, "繼續購物", "Continue Shopping")} <span aria-hidden="true"> →</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── With extended summary ──────────────────────────────
  const shipping = 15;
  const tax = 0;
  const total = subtotal + shipping + tax;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:max-w-7xl lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {t(locale, "購物車", "Shopping Cart")}
      </h1>

      <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
        {/* Items */}
        <section className="lg:col-span-7">
          <ul role="list" className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {items.map((item) => (
              <li key={item.id} className="flex py-6 sm:py-10">
                <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:size-48">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-gray-400 text-sm">{item.name.charAt(0)}</div>
                  )}
                </div>
                <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                      {item.variant && <p className="mt-1 text-sm text-gray-500">{item.variant}</p>}
                    </div>
                    <p className="ml-4 text-base font-medium text-gray-900">{currency} {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <select
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity?.(item.id, parseInt(e.target.value))}
                      className="rounded border-gray-300 text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <button onClick={() => onRemove?.(item.id)} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      {t(locale, "移除", "Remove")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Summary */}
        <section className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
          <h2 className="text-lg font-medium text-gray-900">{t(locale, "訂單摘要", "Order summary")}</h2>
          <dl className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">{t(locale, "小計", "Subtotal")}</dt>
              <dd className="text-sm font-medium text-gray-900">{currency} {subtotal.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="text-sm text-gray-600">{t(locale, "運費估算", "Shipping estimate")}</dt>
              <dd className="text-sm font-medium text-gray-900">{currency} {shipping.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="text-sm text-gray-600">{t(locale, "稅金", "Tax estimate")}</dt>
              <dd className="text-sm font-medium text-gray-900">{currency} {tax.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="text-base font-medium text-gray-900">{t(locale, "總計", "Order total")}</dt>
              <dd className="text-base font-medium text-gray-900">{currency} {total.toFixed(2)}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <a href={`/${locale}/checkout`} className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700">
              {t(locale, "結帳", "Checkout")}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
