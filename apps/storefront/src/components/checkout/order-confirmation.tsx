import Image from "next/image";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  image?: string | null;
};

type Props = {
  receiptNo: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryMethod: "delivery" | "pickup";
  estimatedDelivery?: string;
  locale: string;
  currency?: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function OrderConfirmation({
  receiptNo,
  items,
  subtotal,
  deliveryFee,
  total,
  deliveryMethod,
  estimatedDelivery,
  locale,
  currency = "MOP",
}: Props) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Success icon */}
        <div className="text-center">
          <CheckCircleIcon className="mx-auto size-16 text-green-500" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            {t(locale, "訂單已確認！", "Order confirmed!", "Pedido confirmado!", "注文が確認されました！")}
          </h1>
          <p className="mt-2 text-base text-gray-500">
            {t(locale, "感謝您的購買。", "Thank you for your purchase.", "Obrigado pela sua compra.", "ご購入ありがとうございます。")}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {t(locale, "訂單編號", "Order number", "Número do pedido", "注文番号")}: <span className="font-medium text-gray-900">{receiptNo}</span>
          </p>
        </div>

        {/* Order items */}
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-900">
            {t(locale, "訂單詳情", "Order details", "Detalhes do pedido", "注文詳細")}
          </h2>

          <ul role="list" className="mt-6 divide-y divide-gray-200 border-t border-gray-200">
            {items.map((item, i) => (
              <li key={i} className="flex py-6">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-gray-400 text-xs font-bold">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex flex-1 items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">x{item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{currency} {(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </li>
            ))}
          </ul>

          {/* Totals */}
          <dl className="mt-6 space-y-4 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">{t(locale, "小計", "Subtotal", "Subtotal", "小計")}</dt>
              <dd className="text-sm font-medium text-gray-900">{currency} {subtotal.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-gray-600">{t(locale, "運費", "Shipping", "Frete", "送料")}</dt>
              <dd className="text-sm font-medium text-gray-900">
                {deliveryFee === 0 ? t(locale, "免費", "Free", "Grátis", "無料") : `${currency} ${deliveryFee.toFixed(2)}`}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt className="text-base font-medium text-gray-900">{t(locale, "總計", "Total", "Total", "合計")}</dt>
              <dd className="text-base font-medium text-gray-900">{currency} {total.toFixed(2)}</dd>
            </div>
          </dl>

          {/* Delivery info */}
          {estimatedDelivery && (
            <div className="mt-6 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600">
                {deliveryMethod === "delivery"
                  ? t(locale, `預計送達時間: ${estimatedDelivery}`, `Estimated delivery: ${estimatedDelivery}`, `Entrega estimada: ${estimatedDelivery}`, `配達予定: ${estimatedDelivery}`)
                  : t(locale, `可自取時間: ${estimatedDelivery}`, `Ready for pickup: ${estimatedDelivery}`, `Pronto para retirada: ${estimatedDelivery}`, `受取可能時間: ${estimatedDelivery}`)
                }
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <a
            href={`/${locale}/account/orders`}
            className="flex-1 text-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            {t(locale, "查看我的訂單", "View my orders", "Ver meus pedidos", "注文を確認")}
          </a>
          <a
            href={`/${locale}/products`}
            className="flex-1 text-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            {t(locale, "繼續購物", "Continue shopping", "Continuar comprando", "買い物を続ける")}
          </a>
        </div>
      </div>
    </div>
  );
}
