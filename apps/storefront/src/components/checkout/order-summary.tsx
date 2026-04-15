/**
 * OrderSummary — confirmation page receipt block.
 *
 * Server component. Renders order items, cost summary, shipping/payment
 * details, and a status header that reflects the actual order state
 * (no fake fulfillment tracking).
 */
import Image from "next/image";

type OrderItem = {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  image?: string | null;
  href?: string;
};

type OrderStatus = "pending" | "completed" | "refunded" | "voided";

type Props = {
  orderNumber: string;
  orderDate: string;
  status: OrderStatus;
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
    city?: string;
  };
  locale: string;
  currency?: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

function statusHeader(locale: string, status: OrderStatus) {
  switch (status) {
    case "completed":
      return {
        kicker: t(locale, "訂單已確認", "Order confirmed", "Pedido confirmado", "注文確認"),
        title: t(locale, "感謝您的訂購！", "Thanks for ordering!", "Obrigado pela sua encomenda!", "ご注文ありがとうございます！"),
      };
    case "pending":
      return {
        kicker: t(locale, "等待付款", "Awaiting payment", "Aguardando pagamento", "支払い待ち"),
        title: t(locale, "我們正在等待您的付款確認", "We're waiting for your payment to confirm", "Aguardamos a confirmação do seu pagamento", "お支払いの確認をお待ちしています"),
      };
    case "voided":
      return {
        kicker: t(locale, "訂單已取消", "Order cancelled", "Pedido cancelado", "注文キャンセル"),
        title: t(locale, "此訂單已取消", "This order has been cancelled", "Este pedido foi cancelado", "この注文はキャンセルされました"),
      };
    case "refunded":
      return {
        kicker: t(locale, "訂單已退款", "Order refunded", "Pedido reembolsado", "返金済み"),
        title: t(locale, "此訂單已退款", "This order has been refunded", "Este pedido foi reembolsado", "この注文は返金されました"),
      };
  }
}

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
            : `${currency} ${deliveryFee.toFixed(2)}`}
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

export default function OrderSummary({
  orderNumber,
  orderDate,
  status,
  items,
  subtotal,
  deliveryFee,
  tax,
  discount,
  total,
  paymentMethod,
  shippingAddress,
  locale,
  currency = "MOP",
}: Props) {
  const header = statusHeader(locale, status);
  const kickerColor = status === "completed"
    ? "text-sf-accent"
    : status === "pending"
      ? "text-amber-600"
      : "text-slate-500";

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-xl">
          <p className={`text-sm font-medium ${kickerColor}`}>{header.kicker}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {header.title}
          </h1>
          <p className="mt-2 text-base text-gray-500">
            {t(locale, `訂單 #${orderNumber} · ${orderDate}`, `Order #${orderNumber} · ${orderDate}`, `Pedido #${orderNumber} · ${orderDate}`, `注文 #${orderNumber} · ${orderDate}`)}
          </p>
        </div>

        <h2 className="sr-only">{t(locale, "訂單商品", "Items ordered", "Itens pedidos", "注文商品")}</h2>
        <ul role="list" className="mt-10 divide-y divide-gray-200 border-t border-gray-200">
          {items.map((item, i) => (
            <ItemRowCompact key={i} item={item} locale={locale} currency={currency} />
          ))}
        </ul>

        <CostSummary
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          tax={tax}
          discount={discount}
          total={total}
          locale={locale}
          currency={currency}
        />

        {(shippingAddress || paymentMethod) && (
          <div className="mt-12 grid grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-6">
            {shippingAddress && (
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {t(locale, "送貨地址", "Shipping address", "Endereço de entrega", "配送先")}
                </h3>
                <div className="mt-3 text-sm text-gray-500">
                  <p>{shippingAddress.name}</p>
                  <p className="mt-1">{shippingAddress.address}</p>
                  {shippingAddress.city && <p>{shippingAddress.city}</p>}
                </div>
              </div>
            )}
            {paymentMethod && (
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {t(locale, "付款方式", "Payment method", "Método de pagamento", "支払い方法")}
                </h3>
                <div className="mt-3 text-sm text-gray-500">
                  <p>{paymentMethod}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 border-t border-gray-200 pt-6 text-right">
          <a href={`/${locale}/products`} className="text-sm font-medium text-sf-accent hover:text-sf-accent-hover">
            {t(locale, "繼續購物", "Continue Shopping", "Continuar a comprar", "買い物を続ける")}
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
