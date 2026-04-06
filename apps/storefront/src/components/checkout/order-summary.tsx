/**
 * OrderSummary — Tailwind Plus "Order Summaries" adapted for macau-pos
 *
 * Variants:
 *  - "with-progress"         : Order items + progress bar tracking
 *  - "with-large-images"     : Large product images + progress bars
 *  - "with-split-image"      : Split layout with hero image + order details
 *  - "simple-full-details"   : Full order details in a clean single-column layout
 */
"use client";

import Image from "next/image";
import { CheckIcon } from "@heroicons/react/24/solid";

type OrderItem = {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  image?: string | null;
  href?: string;
};

type FulfillmentStep = {
  label: string;
  date?: string;
  status: "completed" | "current" | "upcoming";
};

type Props = {
  variant?: "with-progress" | "with-large-images" | "with-split-image" | "simple-full-details";
  orderNumber: string;
  orderDate: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax?: number;
  discount?: number;
  total: number;
  paymentMethod?: string;
  shippingAddress?: {
    name: string;
    address: string;
    city: string;
  };
  fulfillmentSteps?: FulfillmentStep[];
  heroImage?: string;
  locale: string;
  currency?: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

// ============================================================
// Progress tracker component
// ============================================================
function ProgressTracker({ steps }: { steps: FulfillmentStep[] }) {
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const currentIndex = steps.findIndex((s) => s.status === "current");
  const progressPercent = currentIndex >= 0
    ? ((currentIndex + 0.5) / steps.length) * 100
    : (completedCount / steps.length) * 100;

  return (
    <div className="mt-6">
      {/* Progress bar */}
      <div className="overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>

      {/* Step labels */}
      <div className="mt-6 hidden sm:grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, i) => (
          <div key={i} className={`text-sm font-medium ${step.status === "completed" ? "text-indigo-600" : step.status === "current" ? "text-indigo-600" : "text-gray-500"}`}>
            <div className="flex items-center gap-1.5">
              {step.status === "completed" && <CheckIcon className="size-4 text-indigo-600" />}
              {step.label}
            </div>
            {step.date && <p className="mt-0.5 text-xs font-normal text-gray-500">{step.date}</p>}
          </div>
        ))}
      </div>

      {/* Mobile: current step only */}
      <div className="mt-4 sm:hidden">
        {steps.map((step, i) =>
          step.status === "current" ? (
            <p key={i} className="text-sm font-medium text-indigo-600">{step.label}</p>
          ) : null
        )}
      </div>
    </div>
  );
}

// ============================================================
// Item row — compact
// ============================================================
function ItemRowCompact({ item, locale, currency }: { item: OrderItem; locale: string; currency: string }) {
  return (
    <li className="flex space-x-6 py-6">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-gray-100">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover object-center" />
        ) : (
          <div className="size-full flex items-center justify-center text-gray-400 text-xs font-bold">
            {item.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between">
          <div>
            <h4 className="font-medium text-gray-900">
              {item.href ? <a href={item.href}>{item.name}</a> : item.name}
            </h4>
            {item.description && <p className="mt-1 text-sm text-gray-500">{item.description}</p>}
          </div>
          <p className="ml-4 text-sm font-medium text-gray-900">{currency} {(item.unitPrice * item.quantity).toFixed(2)}</p>
        </div>
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <p>{t(locale, `數量: ${item.quantity}`, `Qty: ${item.quantity}`, `Qtd: ${item.quantity}`, `数量: ${item.quantity}`)}</p>
          <span className="mx-2">·</span>
          <p>{currency} {item.unitPrice.toFixed(2)} {t(locale, "每件", "each", "cada", "各")}</p>
        </div>
      </div>
    </li>
  );
}

// ============================================================
// Item row — large image
// ============================================================
function ItemRowLarge({ item, locale, currency, steps }: { item: OrderItem; locale: string; currency: string; steps?: FulfillmentStep[] }) {
  return (
    <div className="border-b border-gray-200 py-10 last:border-b-0">
      <div className="flex flex-col sm:flex-row">
        {/* Large image */}
        <div className="sm:w-40 sm:shrink-0">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 sm:aspect-[2/3] sm:h-60">
            {item.image ? (
              <Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 100vw, 160px" className="object-cover object-center" />
            ) : (
              <div className="size-full flex items-center justify-center text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="mt-6 flex flex-1 flex-col sm:ml-6 sm:mt-0">
          <div className="flex justify-between">
            <div>
              <h4 className="text-base font-medium text-gray-900">{item.name}</h4>
              {item.description && <p className="mt-1 text-sm text-gray-500">{item.description}</p>}
            </div>
            <p className="ml-4 text-base font-medium text-gray-900">{currency} {(item.unitPrice * item.quantity).toFixed(2)}</p>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {t(locale, `數量: ${item.quantity}`, `Qty: ${item.quantity}`, `Qtd: ${item.quantity}`, `数量: ${item.quantity}`)}
          </p>

          {/* Per-item progress tracker */}
          {steps && <ProgressTracker steps={steps} />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Cost summary block
// ============================================================
function CostSummary({ subtotal, deliveryFee, tax, discount, total, locale, currency }: {
  subtotal: number; deliveryFee: number; tax?: number; discount?: number; total: number; locale: string; currency: string;
}) {
  return (
    <dl className="space-y-6 border-t border-gray-200 pt-6 text-sm font-medium text-gray-500">
      <div className="flex justify-between">
        <dt>{t(locale, "小計", "Subtotal", "Subtotal", "小計")}</dt>
        <dd className="text-gray-900">{currency} {subtotal.toFixed(2)}</dd>
      </div>
      {discount && discount > 0 && (
        <div className="flex justify-between">
          <dt>{t(locale, "折扣", "Discount", "Desconto", "割引")}</dt>
          <dd className="text-green-600">-{currency} {discount.toFixed(2)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt>{t(locale, "運費", "Shipping", "Frete", "送料")}</dt>
        <dd className="text-gray-900">
          {deliveryFee === 0
            ? t(locale, "免費", "Free", "Grátis", "無料")
            : `${currency} ${deliveryFee.toFixed(2)}`
          }
        </dd>
      </div>
      {tax !== undefined && tax > 0 && (
        <div className="flex justify-between">
          <dt>{t(locale, "稅金", "Tax", "Imposto", "税金")}</dt>
          <dd className="text-gray-900">{currency} {tax.toFixed(2)}</dd>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6 text-gray-900">
        <dt className="text-base">{t(locale, "總計", "Total", "Total", "合計")}</dt>
        <dd className="text-base">{currency} {total.toFixed(2)}</dd>
      </div>
    </dl>
  );
}

// ============================================================
// Main component
// ============================================================
export default function OrderSummary({
  variant = "with-progress",
  orderNumber,
  orderDate,
  items,
  subtotal,
  deliveryFee,
  tax,
  discount,
  total,
  paymentMethod,
  shippingAddress,
  fulfillmentSteps,
  heroImage,
  locale,
  currency = "MOP",
}: Props) {
  const defaultSteps: FulfillmentStep[] = fulfillmentSteps || [
    { label: t(locale, "訂單已確認", "Order placed", "Pedido feito", "注文確認"), date: orderDate, status: "completed" },
    { label: t(locale, "處理中", "Processing", "Processando", "処理中"), status: "current" },
    { label: t(locale, "已出貨", "Shipped", "Enviado", "発送済み"), status: "upcoming" },
    { label: t(locale, "已送達", "Delivered", "Entregue", "配達済み"), status: "upcoming" },
  ];

  // ============================================================
  // Variant: with-split-image
  // ============================================================
  if (variant === "with-split-image") {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-32 xl:gap-x-24">
          {/* Left — Hero image */}
          <div className="lg:col-start-2">
            <p className="text-sm font-medium text-indigo-600">
              {t(locale, "付款成功", "Payment successful", "Pagamento bem-sucedido", "支払い成功")}
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              {t(locale, "感謝您的訂購", "Thanks for ordering", "Obrigado pelo pedido", "ご注文ありがとうございます")}
            </h1>
            <p className="mt-2 text-base text-gray-500">
              {t(locale, `訂單編號 #${orderNumber}`, `Order #${orderNumber}`, `Pedido #${orderNumber}`, `注文番号 #${orderNumber}`)}
            </p>

            {/* Progress */}
            <ProgressTracker steps={defaultSteps} />

            {/* Items */}
            <ul role="list" className="mt-10 divide-y divide-gray-200 border-t border-gray-200 text-sm font-medium text-gray-500">
              {items.map((item, i) => (
                <ItemRowCompact key={i} item={item} locale={locale} currency={currency} />
              ))}
            </ul>

            {/* Totals */}
            <CostSummary subtotal={subtotal} deliveryFee={deliveryFee} tax={tax} discount={discount} total={total} locale={locale} currency={currency} />

            {/* Shipping + Payment info */}
            <dl className="mt-16 grid grid-cols-2 gap-x-4 text-sm text-gray-600">
              {shippingAddress && (
                <div>
                  <dt className="font-medium text-gray-900">{t(locale, "送貨地址", "Shipping address", "Endereço de entrega", "配送先")}</dt>
                  <dd className="mt-2">
                    <p>{shippingAddress.name}</p>
                    <p className="mt-1">{shippingAddress.address}</p>
                    <p>{shippingAddress.city}</p>
                  </dd>
                </div>
              )}
              {paymentMethod && (
                <div>
                  <dt className="font-medium text-gray-900">{t(locale, "付款方式", "Payment method", "Método de pagamento", "支払い方法")}</dt>
                  <dd className="mt-2">
                    <p>{paymentMethod}</p>
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-16 border-t border-gray-200 py-6 text-right">
              <a href={`/${locale}/products`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                {t(locale, "繼續購物", "Continue Shopping", "Continuar", "買い物を続ける")}
                <span aria-hidden="true"> &rarr;</span>
              </a>
            </div>
          </div>

          {/* Right — Large image */}
          <div className="mt-12 lg:col-start-1 lg:row-start-1 lg:mt-0">
            {heroImage ? (
              <div className="relative aspect-square w-full rounded-lg bg-gray-100 lg:aspect-auto lg:h-full">
                <Image src={heroImage} alt="" fill sizes="(max-width: 1024px) 100vw, 50vw" className="rounded-lg object-cover" />
              </div>
            ) : (
              <div className="aspect-square w-full rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center lg:aspect-auto lg:h-full">
                <CheckIcon className="size-24 text-indigo-200" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Variant: with-large-images
  // ============================================================
  if (variant === "with-large-images") {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          {/* Header */}
          <div className="max-w-xl">
            <p className="text-sm font-medium text-indigo-600">{t(locale, "訂單已確認", "Order confirmed", "Pedido confirmado", "注文確認")}</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              {t(locale, "即將送達", "It's on the way!", "Está a caminho!", "配送中です！")}
            </h1>
            <p className="mt-2 text-base text-gray-500">
              {t(locale, `訂單 #${orderNumber} 已於 ${orderDate} 確認`, `Order #${orderNumber} confirmed on ${orderDate}`, `Pedido #${orderNumber} confirmado em ${orderDate}`, `注文 #${orderNumber} は ${orderDate} に確認されました`)}
            </p>
          </div>

          {/* Items with large images + per-item progress */}
          <div className="mt-12">
            {items.map((item, i) => (
              <ItemRowLarge key={i} item={item} locale={locale} currency={currency} steps={defaultSteps} />
            ))}
          </div>

          {/* Cost + Shipping/Payment */}
          <div className="mt-10 sm:grid sm:grid-cols-2 sm:gap-x-6">
            {/* Shipping + Payment */}
            <dl className="text-sm text-gray-600">
              {shippingAddress && (
                <div>
                  <dt className="font-medium text-gray-900">{t(locale, "送貨地址", "Shipping address", "Endereço", "配送先")}</dt>
                  <dd className="mt-2">
                    <p>{shippingAddress.name}</p>
                    <p className="mt-1">{shippingAddress.address}</p>
                    <p>{shippingAddress.city}</p>
                  </dd>
                </div>
              )}
              {paymentMethod && (
                <div className="mt-6">
                  <dt className="font-medium text-gray-900">{t(locale, "付款方式", "Payment", "Pagamento", "支払い")}</dt>
                  <dd className="mt-2"><p>{paymentMethod}</p></dd>
                </div>
              )}
            </dl>

            {/* Cost summary */}
            <CostSummary subtotal={subtotal} deliveryFee={deliveryFee} tax={tax} discount={discount} total={total} locale={locale} currency={currency} />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Variant: simple-full-details
  // ============================================================
  if (variant === "simple-full-details") {
    return (
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-xl">
            <h1 className="text-base font-medium text-indigo-600">
              {t(locale, "感謝您！", "Thank you!", "Obrigado!", "ありがとうございます！")}
            </h1>
            <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              {t(locale, "即將送達", "It's on the way!", "Está a caminho!", "配送中です！")}
            </p>
            <p className="mt-2 text-base text-gray-500">
              {t(locale, `訂單 #${orderNumber}`, `Order #${orderNumber}`, `Pedido #${orderNumber}`, `注文 #${orderNumber}`)}
            </p>
          </div>

          {/* Items */}
          <div className="mt-10 border-t border-gray-200">
            <h2 className="sr-only">Your order</h2>

            {items.map((item, i) => (
              <div key={i} className="flex space-x-6 border-b border-gray-200 py-10">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:size-40">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="(max-width: 640px) 80px, 160px" className="object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-gray-400 text-xs font-bold">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">{item.name}</h3>
                    {item.description && <p className="mt-1 text-sm text-gray-500">{item.description}</p>}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <p className="text-sm text-gray-500">
                      {t(locale, `數量: ${item.quantity}`, `Qty: ${item.quantity}`, `Qtd: ${item.quantity}`, `数量: ${item.quantity}`)}
                    </p>
                    <p className="text-sm font-medium text-gray-900">{currency} {(item.unitPrice * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <CostSummary subtotal={subtotal} deliveryFee={deliveryFee} tax={tax} discount={discount} total={total} locale={locale} currency={currency} />

          {/* Shipping + Payment details */}
          <div className="mt-16 grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-6">
            {shippingAddress && (
              <div>
                <h3 className="text-sm font-medium text-gray-900">{t(locale, "送貨地址", "Shipping address", "Endereço", "配送先")}</h3>
                <div className="mt-3 text-sm text-gray-500">
                  <p>{shippingAddress.name}</p>
                  <p className="mt-1">{shippingAddress.address}</p>
                  <p>{shippingAddress.city}</p>
                </div>
              </div>
            )}
            {paymentMethod && (
              <div>
                <h3 className="text-sm font-medium text-gray-900">{t(locale, "付款方式", "Payment", "Pagamento", "支払い")}</h3>
                <div className="mt-3 text-sm text-gray-500">
                  <p>{paymentMethod}</p>
                </div>
              </div>
            )}
          </div>

          {/* Continue shopping */}
          <div className="mt-16 border-t border-gray-200 pt-6 text-right">
            <a href={`/${locale}/products`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              {t(locale, "繼續購物", "Continue Shopping", "Continuar", "買い物を続ける")}
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Default variant: with-progress
  // ============================================================
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Header */}
        <div className="max-w-xl">
          <p className="text-sm font-medium text-indigo-600">{t(locale, "訂單已確認", "Order confirmed", "Pedido confirmado", "注文確認")}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            {t(locale, "感謝您的訂購！", "Thanks for ordering!", "Obrigado!", "ご注文ありがとうございます！")}
          </h1>
          <p className="mt-2 text-base text-gray-500">
            {t(locale, `訂單 #${orderNumber} · ${orderDate}`, `Order #${orderNumber} · ${orderDate}`, `Pedido #${orderNumber} · ${orderDate}`, `注文 #${orderNumber} · ${orderDate}`)}
          </p>
        </div>

        {/* Progress tracker */}
        <ProgressTracker steps={defaultSteps} />

        {/* Items */}
        <h2 className="sr-only">{t(locale, "訂單商品", "Items ordered", "Itens pedidos", "注文商品")}</h2>
        <ul role="list" className="mt-12 divide-y divide-gray-200 border-t border-gray-200">
          {items.map((item, i) => (
            <ItemRowCompact key={i} item={item} locale={locale} currency={currency} />
          ))}
        </ul>

        {/* Cost summary */}
        <CostSummary subtotal={subtotal} deliveryFee={deliveryFee} tax={tax} discount={discount} total={total} locale={locale} currency={currency} />

        {/* Shipping + Payment */}
        <div className="mt-16 grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-6">
          {shippingAddress && (
            <div>
              <h3 className="text-sm font-medium text-gray-900">{t(locale, "送貨地址", "Shipping address", "Endereço", "配送先")}</h3>
              <div className="mt-3 text-sm text-gray-500">
                <p>{shippingAddress.name}</p>
                <p className="mt-1">{shippingAddress.address}</p>
                <p>{shippingAddress.city}</p>
              </div>
            </div>
          )}
          {paymentMethod && (
            <div>
              <h3 className="text-sm font-medium text-gray-900">{t(locale, "付款方式", "Payment method", "Pagamento", "支払い方法")}</h3>
              <div className="mt-3 text-sm text-gray-500">
                <p>{paymentMethod}</p>
              </div>
            </div>
          )}
        </div>

        {/* Continue shopping */}
        <div className="mt-16 border-t border-gray-200 pt-6 text-right">
          <a href={`/${locale}/products`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            {t(locale, "繼續購物", "Continue Shopping", "Continuar", "買い物を続ける")}
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
