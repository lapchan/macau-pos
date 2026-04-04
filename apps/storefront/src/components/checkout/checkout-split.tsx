/**
 * CheckoutSplit — Tailwind Plus "Split with order summary"
 *
 * True 50/50 split: form (left, white) + order summary (right, indigo bg)
 * Background color splits the full viewport on large screens.
 */
"use client";

import { useState } from "react";

type CartItem = {
  id: string;
  name: string;
  variant?: string;
  size?: string;
  price: number;
  quantity: number;
  image?: string | null;
};

type DeliveryZone = {
  id: string;
  name: string;
  fee: number;
  freeAbove?: number | null;
};

type Props = {
  items: CartItem[];
  deliveryZones?: DeliveryZone[];
  locale: string;
  currency?: string;
  onSubmit?: (data: {
    deliveryMethod: string;
    deliveryZoneId?: string;
    paymentMethod: string;
    contact: string;
    recipientName: string;
    phone: string;
    address: string;
    district: string;
    postalCode: string;
    notes?: string;
  }) => Promise<{ error?: string; success?: boolean; orderNumber?: string }>;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function CheckoutSplit({
  items,
  deliveryZones = [],
  locale,
  currency = "MOP",
  onSubmit,
}: Props) {
  const [paymentMethod, setPaymentMethod] = useState("mpay");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [selectedZone, setSelectedZone] = useState(deliveryZones[0]?.id || "");
  const [submitting, setSubmitting] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const zone = deliveryZones.find((z) => z.id === selectedZone);
  const shippingFee = deliveryMethod === "pickup" ? 0 : (zone?.fee || 0);
  const isFreeShipping = zone?.freeAbove && subtotal >= zone.freeAbove;
  const total = subtotal + (isFreeShipping ? 0 : shippingFee);

  const inputClass = "block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6";
  const selectClass = "appearance-none block w-full rounded-md bg-white px-3 py-2 pr-8 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.22%208.22a.75.75%200%200%201%201.06%200L10%2011.94l3.72-3.72a.75.75%200%201%201%201.06%201.06l-4.25%204.25a.75.75%200%200%201-1.06%200L5.22%209.28a.75.75%200%200%201%200-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.5rem_center] bg-no-repeat focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6";
  const labelClass = "block text-sm/6 font-medium text-gray-700";

  return (
    <div className="bg-white">
      {/* Background color split for large screens */}
      <div aria-hidden="true" className="fixed top-0 left-0 hidden h-full w-1/2 bg-white lg:block" />
      <div aria-hidden="true" className="fixed top-0 right-0 hidden h-full w-1/2 bg-indigo-900 lg:block" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-x-16 lg:grid-cols-2 lg:px-8 lg:pt-16">
        <h1 className="sr-only">Checkout</h1>

        {/* ============================================================ */}
        {/* Right: Order summary (indigo background)                     */}
        {/* ============================================================ */}
        <section
          aria-labelledby="summary-heading"
          className="bg-indigo-900 py-12 text-indigo-300 md:px-10 lg:col-start-2 lg:row-start-1 lg:mx-auto lg:w-full lg:max-w-lg lg:bg-transparent lg:px-0 lg:pt-0 lg:pb-24"
        >
          <div className="mx-auto max-w-2xl px-4 lg:max-w-none lg:px-0">
            <h2 id="summary-heading" className="sr-only">Order summary</h2>

            {/* Amount due */}
            <dl>
              <dt className="text-sm font-medium">{t(locale, "應付金額", "Amount due", "Valor devido", "お支払い金額")}</dt>
              <dd className="mt-1 text-3xl font-bold tracking-tight text-white">{currency} {total.toFixed(2)}</dd>
            </dl>

            {/* Items */}
            <ul role="list" className="divide-y divide-white/10 text-sm font-medium">
              {items.map((item) => (
                <li key={item.id} className="flex items-start space-x-4 py-6">
                  <div className="size-20 shrink-0 overflow-hidden rounded-md bg-indigo-800">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-indigo-400 text-xs font-bold">
                        {item.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-auto space-y-1">
                    <h3 className="text-white">{item.name}</h3>
                    {item.variant && <p>{item.variant}</p>}
                    {item.quantity > 1 && <p>x{item.quantity}</p>}
                  </div>
                  <p className="shrink-0 text-base font-medium text-white">{currency} {(item.price * item.quantity).toFixed(2)}</p>
                </li>
              ))}
            </ul>

            {/* Cost breakdown */}
            <dl className="space-y-6 border-t border-white/10 pt-6 text-sm font-medium">
              <div className="flex items-center justify-between">
                <dt>{t(locale, "小計", "Subtotal", "Subtotal", "小計")}</dt>
                <dd>{currency} {subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>{t(locale, "運費", "Shipping", "Frete", "送料")}</dt>
                <dd>
                  {deliveryMethod === "pickup"
                    ? t(locale, "免費", "Free", "Grátis", "無料")
                    : isFreeShipping
                    ? t(locale, "免費", "Free", "Grátis", "無料")
                    : `${currency} ${shippingFee.toFixed(2)}`
                  }
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-6 text-white">
                <dt className="text-base">{t(locale, "總計", "Total", "Total", "合計")}</dt>
                <dd className="text-base">{currency} {total.toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ============================================================ */}
        {/* Left: Payment + shipping form                                */}
        {/* ============================================================ */}
        <section
          aria-labelledby="payment-and-shipping-heading"
          className="py-16 lg:col-start-1 lg:row-start-1 lg:mx-auto lg:w-full lg:max-w-lg lg:pt-0 lg:pb-24"
        >
          <h2 id="payment-and-shipping-heading" className="sr-only">Payment and shipping details</h2>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!onSubmit) return;
              setSubmitting(true);
              const fd = new FormData(e.currentTarget);
              await onSubmit({
                deliveryMethod,
                deliveryZoneId: selectedZone || undefined,
                paymentMethod,
                contact: fd.get("email") as string,
                recipientName: fd.get("name") as string,
                phone: fd.get("phone") as string,
                address: fd.get("address") as string,
                district: fd.get("district") as string,
                postalCode: fd.get("postal-code") as string,
                notes: fd.get("notes") as string,
              });
              setSubmitting(false);
            }}
          >
            <div className="mx-auto max-w-2xl px-4 lg:max-w-none lg:px-0">
              {/* Contact information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {t(locale, "聯絡資料", "Contact information", "Informações de contato", "連絡先情報")}
                </h3>
                <div className="mt-6">
                  <label htmlFor="email" className={labelClass}>
                    {t(locale, "電郵地址", "Email address", "Email", "メールアドレス")}
                  </label>
                  <div className="mt-1">
                    <input id="email" name="email" type="email" autoComplete="email" className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Payment details */}
              <div className="mt-10">
                <h3 className="text-lg font-medium text-gray-900">
                  {t(locale, "付款方式", "Payment details", "Detalhes de pagamento", "お支払い方法")}
                </h3>
                <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4">
                  <div className="col-span-3 sm:col-span-4">
                    <label className={labelClass}>
                      {t(locale, "付款方式", "Payment method", "Método", "支払い方法")}
                    </label>
                    <div className="mt-2 grid grid-cols-3 gap-3">
                      {[
                        { id: "mpay", label: "MPay" },
                        { id: "alipay", label: t(locale, "支付寶", "Alipay", "Alipay", "Alipay") },
                        { id: "wechat_pay", label: t(locale, "微信支付", "WeChat Pay", "WeChat Pay", "WeChat Pay") },
                      ].map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${paymentMethod === pm.id ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                        >
                          {pm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping address */}
              <div className="mt-10">
                <h3 className="text-lg font-medium text-gray-900">
                  {t(locale, "收件資訊", "Shipping address", "Endereço de entrega", "配送先住所")}
                </h3>

                <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
                  {/* Delivery method */}
                  <div className="sm:col-span-3">
                    <label className={labelClass}>
                      {t(locale, "配送方式", "Delivery method", "Método", "配送方法")}
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {(["delivery", "pickup"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setDeliveryMethod(method)}
                          className={`rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${deliveryMethod === method ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                        >
                          {method === "delivery"
                            ? t(locale, "送貨", "Delivery", "Entrega", "配送")
                            : t(locale, "自取", "Pickup", "Retirada", "店舗受取")
                          }
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delivery zone */}
                  {deliveryMethod === "delivery" && deliveryZones.length > 0 && (
                    <div className="sm:col-span-3">
                      <label htmlFor="zone" className={labelClass}>
                        {t(locale, "送貨區域", "Delivery zone", "Zona", "配送エリア")}
                      </label>
                      <div className="mt-1">
                        <select
                          id="zone"
                          value={selectedZone}
                          onChange={(e) => setSelectedZone(e.target.value)}
                          className={selectClass}
                        >
                          {deliveryZones.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.name} — {currency} {z.fee.toFixed(2)}
                              {z.freeAbove ? ` (${t(locale, `滿${currency}${z.freeAbove}免運`, `Free >${currency}${z.freeAbove}`, `Grátis >${currency}${z.freeAbove}`, `${currency}${z.freeAbove}以上無料`)})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Name */}
                  <div className="sm:col-span-3">
                    <label htmlFor="name" className={labelClass}>
                      {t(locale, "收件人姓名", "Full name", "Nome completo", "お名前")}
                    </label>
                    <div className="mt-1">
                      <input id="name" name="name" type="text" autoComplete="name" className={inputClass} />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className={labelClass}>
                      {t(locale, "聯絡電話", "Phone", "Telefone", "電話番号")}
                    </label>
                    <div className="mt-1">
                      <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+853 6XXX XXXX" className={inputClass} />
                    </div>
                  </div>

                  {deliveryMethod === "delivery" && (
                    <>
                      {/* Address */}
                      <div className="sm:col-span-3">
                        <label htmlFor="address" className={labelClass}>
                          {t(locale, "地址", "Address", "Endereço", "住所")}
                        </label>
                        <div className="mt-1">
                          <input id="address" name="address" type="text" autoComplete="street-address" className={inputClass} />
                        </div>
                      </div>

                      {/* City */}
                      <div>
                        <label htmlFor="city" className={labelClass}>
                          {t(locale, "城市", "City", "Cidade", "都市")}
                        </label>
                        <div className="mt-1">
                          <input id="city" name="city" type="text" defaultValue="Macau" autoComplete="address-level2" className={inputClass} />
                        </div>
                      </div>

                      {/* District */}
                      <div>
                        <label htmlFor="district" className={labelClass}>
                          {t(locale, "區域", "State / Province", "Estado", "地区")}
                        </label>
                        <div className="mt-1">
                          <input id="district" name="district" type="text" autoComplete="address-level1" className={inputClass} />
                        </div>
                      </div>

                      {/* Postal code */}
                      <div>
                        <label htmlFor="postal-code" className={labelClass}>
                          {t(locale, "郵政編碼", "Postal code", "CEP", "郵便番号")}
                        </label>
                        <div className="mt-1">
                          <input id="postal-code" name="postal-code" type="text" autoComplete="postal-code" className={inputClass} />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  <div className="sm:col-span-3">
                    <label htmlFor="notes" className={labelClass}>
                      {t(locale, "備註", "Notes", "Notas", "備考")}
                    </label>
                    <div className="mt-1">
                      <input id="notes" name="notes" type="text" placeholder={t(locale, "可選", "Optional", "Opcional", "任意")} className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="mt-10 flex justify-end border-t border-gray-200 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 disabled:bg-gray-300"
                >
                  {submitting
                    ? "..."
                    : t(locale, "確認付款", "Pay now", "Pagar agora", "今すぐ支払う")
                  }
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
