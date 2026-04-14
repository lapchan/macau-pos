"use client";

import { useState } from "react";

type DeliveryZone = {
  id: string;
  name: string;
  fee: number;
  minOrder: number;
  freeAbove?: number | null;
  estimatedMinutes?: number | null;
};

type Props = {
  locale: string;
  currency?: string;
  deliveryZones?: DeliveryZone[];
  subtotal: number;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function CheckoutForm({ locale, currency = "MOP", deliveryZones = [], subtotal }: Props) {
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [selectedZone, setSelectedZone] = useState<string>(deliveryZones[0]?.id || "");
  const [paymentMethod, setPaymentMethod] = useState<string>("mpay");

  const zone = deliveryZones.find((z) => z.id === selectedZone);
  const deliveryFee = deliveryMethod === "pickup" ? 0 : (zone?.fee || 0);
  const isFreeShipping = zone?.freeAbove && subtotal >= zone.freeAbove;
  const total = subtotal + (isFreeShipping ? 0 : deliveryFee);

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="sr-only">Checkout</h2>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
          {/* Form */}
          <div>
            {/* Contact info */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {t(locale, "聯絡資料", "Contact information", "Informações de contato", "連絡先情報")}
              </h2>
              <div className="mt-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t(locale, "電郵/電話", "Email or phone", "Email ou telefone", "メール/電話")}
                </label>
                <input
                  type="text"
                  id="email"
                  autoComplete="email"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sf-accent focus:ring-sf-accent sm:text-sm"
                />
              </div>
            </div>

            {/* Delivery method */}
            <div className="mt-10 border-t border-gray-200 pt-10">
              <h2 className="text-lg font-medium text-gray-900">
                {t(locale, "配送方式", "Delivery method", "Método de entrega", "配送方法")}
              </h2>
              <fieldset className="mt-4">
                <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-4">
                  <label
                    className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${deliveryMethod === "delivery" ? "border-sf-accent ring-2 ring-sf-accent" : "border-gray-300"}`}
                  >
                    <input type="radio" name="delivery-method" value="delivery" className="sr-only" checked={deliveryMethod === "delivery"} onChange={() => setDeliveryMethod("delivery")} />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">
                          {t(locale, "送貨", "Delivery", "Entrega", "配送")}
                        </span>
                        <span className="mt-1 text-sm text-gray-500">
                          {t(locale, "送到您的地址", "Delivered to your address", "Entregue no seu endereço", "ご指定の住所に配送")}
                        </span>
                      </span>
                    </span>
                  </label>

                  <label
                    className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${deliveryMethod === "pickup" ? "border-sf-accent ring-2 ring-sf-accent" : "border-gray-300"}`}
                  >
                    <input type="radio" name="delivery-method" value="pickup" className="sr-only" checked={deliveryMethod === "pickup"} onChange={() => setDeliveryMethod("pickup")} />
                    <span className="flex flex-1">
                      <span className="flex flex-col">
                        <span className="block text-sm font-medium text-gray-900">
                          {t(locale, "自取", "Pickup", "Retirada", "店舗受取")}
                        </span>
                        <span className="mt-1 text-sm text-gray-500">
                          {t(locale, "到店自取", "Pick up at store", "Retire na loja", "店舗で受取")}
                        </span>
                      </span>
                    </span>
                  </label>
                </div>
              </fieldset>

              {/* Delivery zones */}
              {deliveryMethod === "delivery" && deliveryZones.length > 0 && (
                <div className="mt-4">
                  <label htmlFor="zone" className="block text-sm font-medium text-gray-700">
                    {t(locale, "送貨區域", "Delivery zone", "Zona de entrega", "配送エリア")}
                  </label>
                  <select
                    id="zone"
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sf-accent focus:ring-sf-accent sm:text-sm"
                  >
                    {deliveryZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} — {currency} {z.fee.toFixed(2)}
                        {z.freeAbove ? ` (${t(locale, `滿${currency} ${z.freeAbove}免運`, `Free over ${currency} ${z.freeAbove}`, `Grátis acima de ${currency} ${z.freeAbove}`, `${currency} ${z.freeAbove}以上で送料無料`)})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Shipping address */}
            {deliveryMethod === "delivery" && (
              <div className="mt-10 border-t border-gray-200 pt-10">
                <h2 className="text-lg font-medium text-gray-900">
                  {t(locale, "送貨地址", "Shipping address", "Endereço de entrega", "配送先住所")}
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">{t(locale, "收件人姓名", "Full name", "Nome completo", "氏名")}</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sf-accent focus:ring-sf-accent sm:text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">{t(locale, "電話", "Phone", "Telefone", "電話番号")}</label>
                    <input type="tel" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sf-accent focus:ring-sf-accent sm:text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">{t(locale, "地址", "Address", "Endereço", "住所")}</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sf-accent focus:ring-sf-accent sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t(locale, "區域", "District", "Distrito", "地区")}</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sf-accent focus:ring-sf-accent sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t(locale, "郵政編碼", "Postal code", "Código postal", "郵便番号")}</label>
                    <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sf-accent focus:ring-sf-accent sm:text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Payment method */}
            <div className="mt-10 border-t border-gray-200 pt-10">
              <h2 className="text-lg font-medium text-gray-900">
                {t(locale, "付款方式", "Payment", "Pagamento", "お支払い方法")}
              </h2>
              <fieldset className="mt-4">
                <div className="space-y-3">
                  {[
                    { id: "mpay", label: "MPay" },
                    { id: "alipay", label: t(locale, "支付寶", "Alipay", "Alipay", "Alipay") },
                    { id: "wechat_pay", label: t(locale, "微信支付", "WeChat Pay", "WeChat Pay", "WeChat Pay") },
                    { id: "cash", label: t(locale, "貨到付款", "Cash on delivery", "Pagamento na entrega", "代金引換") },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm ${paymentMethod === method.id ? "border-sf-accent ring-2 ring-sf-accent" : "border-gray-300"}`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={method.id}
                        className="sr-only"
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                      />
                      <span className="text-sm font-medium text-gray-900">{method.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="mt-10 lg:mt-0">
            <h2 className="text-lg font-medium text-gray-900">
              {t(locale, "訂單摘要", "Order summary", "Resumo do pedido", "注文概要")}
            </h2>

            <div className="mt-4 rounded-lg border border-gray-200 bg-white shadow-sm">
              <dl className="space-y-6 border-t border-gray-200 px-4 py-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <dt className="text-sm">{t(locale, "小計", "Subtotal", "Subtotal", "小計")}</dt>
                  <dd className="text-sm font-medium text-gray-900">{currency} {subtotal.toFixed(2)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm">{t(locale, "運費", "Shipping", "Frete", "送料")}</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {isFreeShipping
                      ? t(locale, "免運費", "Free", "Grátis", "無料")
                      : `${currency} ${deliveryFee.toFixed(2)}`
                    }
                  </dd>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                  <dt className="text-base font-medium">{t(locale, "總計", "Total", "Total", "合計")}</dt>
                  <dd className="text-base font-medium text-gray-900">{currency} {total.toFixed(2)}</dd>
                </div>
              </dl>

              <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                <button
                  type="submit"
                  className="w-full rounded-md border border-transparent bg-sf-accent px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-sf-accent focus:outline-2 focus:ring-sf-accent focus:ring-offset-2"
                >
                  {t(locale, "確認訂單", "Confirm order", "Confirmar pedido", "注文を確定")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
