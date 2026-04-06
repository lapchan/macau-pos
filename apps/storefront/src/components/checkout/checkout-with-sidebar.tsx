/**
 * CheckoutWithSidebar — Tailwind Plus "With order summary sidebar"
 *
 * Split layout: checkout form (left) + sticky order summary (right)
 * Mobile: collapsible order summary at top
 * Adapted for Macau: MPay/Alipay/WeChat Pay, delivery zones, MOP currency
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import { LockClosedIcon } from "@heroicons/react/20/solid";

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
    notes?: string;
  }) => Promise<{ error?: string; success?: boolean; orderNumber?: string }>;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function CheckoutWithSidebar({
  items,
  deliveryZones = [],
  locale,
  currency = "MOP",
  onSubmit,
}: Props) {
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("mpay");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [selectedZone, setSelectedZone] = useState(deliveryZones[0]?.id || "");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const zone = deliveryZones.find((z) => z.id === selectedZone);
  const shippingFee = deliveryMethod === "pickup" ? 0 : (zone?.fee || 0);
  const isFreeShipping = zone?.freeAbove && subtotal >= zone.freeAbove;
  const discount = appliedDiscount?.amount || 0;
  const total = subtotal - discount + (isFreeShipping ? 0 : shippingFee);

  // Shared order item row
  const OrderItemRow = ({ item }: { item: CartItem }) => (
    <li className="flex space-x-6 py-6">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-md bg-gray-200">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
        ) : (
          <div className="size-full flex items-center justify-center text-gray-400 text-xs font-bold">
            {item.name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between space-y-1">
        <div className="space-y-1 text-sm font-medium">
          <h3 className="text-gray-900">{item.name}</h3>
          <p className="text-gray-900">{currency} {(item.price * item.quantity).toFixed(2)}</p>
          {item.variant && <p className="text-gray-500">{item.variant}</p>}
          {item.size && <p className="text-gray-500">{item.size}</p>}
          {item.quantity > 1 && <p className="text-gray-500">x{item.quantity}</p>}
        </div>
      </div>
    </li>
  );

  // Shared cost summary
  const CostSummary = ({ className = "" }: { className?: string }) => (
    <dl className={`mt-10 space-y-6 text-sm font-medium text-gray-500 ${className}`}>
      <div className="flex justify-between">
        <dt>{t(locale, "小計", "Subtotal", "Subtotal", "小計")}</dt>
        <dd className="text-gray-900">{currency} {subtotal.toFixed(2)}</dd>
      </div>
      {appliedDiscount && (
        <div className="flex justify-between">
          <dt className="flex">
            {t(locale, "折扣", "Discount", "Desconto", "割引")}
            <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium tracking-wide text-gray-600 uppercase">
              {appliedDiscount.code}
            </span>
          </dt>
          <dd className="text-gray-900">-{currency} {discount.toFixed(2)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt>{t(locale, "運費", "Shipping", "Frete", "送料")}</dt>
        <dd className="text-gray-900">
          {deliveryMethod === "pickup"
            ? t(locale, "免費（自取）", "Free (pickup)", "Grátis (retirada)", "無料（店舗受取）")
            : isFreeShipping
            ? t(locale, "免費", "Free", "Grátis", "無料")
            : `${currency} ${shippingFee.toFixed(2)}`
          }
        </dd>
      </div>
      <div className="flex items-center justify-between border-t border-gray-200 pt-6 text-gray-900">
        <dt className="text-base">{t(locale, "總計", "Total", "Total", "合計")}</dt>
        <dd className="text-base">{currency} {total.toFixed(2)}</dd>
      </div>
    </dl>
  );

  return (
    <div className="bg-white">
      <main className="lg:flex lg:min-h-full lg:flex-row-reverse lg:overflow-hidden">
        <h1 className="sr-only">Checkout</h1>

        {/* ============================================================ */}
        {/* Mobile order summary (collapsible)                           */}
        {/* ============================================================ */}
        <section aria-labelledby="order-heading" className="bg-gray-50 px-4 py-6 sm:px-6 lg:hidden">
          <div className="mx-auto max-w-lg">
            <div className="flex items-center justify-between">
              <h2 id="order-heading" className="text-lg font-medium text-gray-900">
                {t(locale, "您的訂單", "Your Order", "Seu Pedido", "ご注文")}
              </h2>
              <button
                type="button"
                onClick={() => setMobileOrderOpen(!mobileOrderOpen)}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                {mobileOrderOpen
                  ? t(locale, "隱藏詳情", "Hide full summary", "Ocultar resumo", "詳細を隠す")
                  : t(locale, "顯示詳情", "Show full summary", "Mostrar resumo", "詳細を表示")
                }
              </button>
            </div>

            {mobileOrderOpen && (
              <>
                <ul role="list" className="divide-y divide-gray-200 border-b border-gray-200">
                  {items.map((item) => (
                    <OrderItemRow key={item.id} item={item} />
                  ))}
                </ul>
                <CostSummary />
              </>
            )}

            {!mobileOrderOpen && (
              <p className="mt-4 flex items-center justify-between border-t border-gray-200 pt-6 text-sm font-medium text-gray-900">
                <span className="text-base">{t(locale, "總計", "Total", "Total", "合計")}</span>
                <span className="text-base">{currency} {total.toFixed(2)}</span>
              </p>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* Desktop order summary sidebar (sticky)                       */}
        {/* ============================================================ */}
        <section aria-labelledby="summary-heading" className="hidden w-full max-w-md flex-col bg-gray-50 lg:flex">
          <h2 id="summary-heading" className="sr-only">Order summary</h2>

          <ul role="list" className="flex-auto divide-y divide-gray-200 overflow-y-auto px-6">
            {items.map((item) => (
              <OrderItemRow key={item.id} item={item} />
            ))}
          </ul>

          <div className="sticky bottom-0 flex-none border-t border-gray-200 bg-gray-50 p-6">
            {/* Discount code */}
            <form onSubmit={(e) => {
              e.preventDefault();
              if (discountCode.trim()) {
                setAppliedDiscount({ code: discountCode.trim().toUpperCase(), amount: 10 });
              }
            }}>
              <label htmlFor="discount-code" className="block text-sm/6 font-medium text-gray-700">
                {t(locale, "優惠碼", "Discount code", "Código de desconto", "割引コード")}
              </label>
              <div className="mt-1 flex space-x-4">
                <input
                  id="discount-code"
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                />
                <button
                  type="submit"
                  className="rounded-md bg-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-300 focus:outline-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
                >
                  {t(locale, "套用", "Apply", "Aplicar", "適用")}
                </button>
              </div>
            </form>

            <CostSummary />
          </div>
        </section>

        {/* ============================================================ */}
        {/* Checkout form                                                */}
        {/* ============================================================ */}
        <section aria-labelledby="payment-heading" className="flex-auto overflow-y-auto px-6 pt-12 pb-16 sm:px-10 sm:pt-16 lg:px-16 lg:pt-0 lg:pb-24 xl:px-24">
          <h2 id="payment-heading" className="sr-only">Payment and shipping details</h2>

          <div className="max-w-2xl lg:pt-16">
            {/* Quick pay buttons */}
            <div className="flex flex-col gap-3">
              {[
                { id: "mpay", label: "MPay", color: "bg-blue-600 hover:bg-blue-700" },
                { id: "alipay", label: t(locale, "支付寶", "Alipay", "Alipay", "Alipay"), color: "bg-sky-500 hover:bg-sky-600" },
                { id: "wechat_pay", label: t(locale, "微信支付", "WeChat Pay", "WeChat Pay", "WeChat Pay"), color: "bg-green-600 hover:bg-green-700" },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`flex w-full items-center justify-center rounded-md border border-transparent py-2 text-white ${pm.color} ${paymentMethod === pm.id ? "ring-2 ring-offset-2 ring-indigo-500" : ""} focus:outline-2 focus:ring-indigo-500 focus:ring-offset-2`}
                >
                  <span className="sr-only">{t(locale, "使用", "Pay with", "Pagar com", "で支払う")} </span>
                  <span className="text-sm font-medium">{pm.label}</span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="relative mt-10">
              <div aria-hidden="true" className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm font-medium text-gray-500">
                  {t(locale, "或填寫以下資料", "or fill in details below", "ou preencha abaixo", "または以下を入力")}
                </span>
              </div>
            </div>

            {/* Form */}
            <form
              className="mt-8"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!onSubmit) return;
                setSubmitting(true);
                const form = e.currentTarget;
                const fd = new FormData(form);
                await onSubmit({
                  deliveryMethod,
                  deliveryZoneId: selectedZone || undefined,
                  paymentMethod,
                  contact: fd.get("email") as string,
                  recipientName: fd.get("name") as string,
                  phone: fd.get("phone") as string,
                  address: fd.get("address") as string,
                  district: fd.get("district") as string,
                  notes: fd.get("notes") as string,
                });
                setSubmitting(false);
              }}
            >
              {/* ---- Shipping information section ---- */}
              <h3 className="text-lg font-semibold text-gray-900">
                {t(locale, "收件資訊", "Shipping information", "Informações de envio", "配送情報")}
              </h3>

              <div className="mt-6 space-y-8">
                {/* First name / Last name — two columns */}
                <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-semibold text-gray-700">
                      {t(locale, "名字", "First name", "Nome", "名")}
                    </label>
                    <div className="mt-2">
                      <input id="first-name" name="first-name" type="text" autoComplete="given-name" className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-semibold text-gray-700">
                      {t(locale, "姓氏", "Last name", "Sobrenome", "姓")}
                    </label>
                    <div className="mt-2">
                      <input id="last-name" name="last-name" type="text" autoComplete="family-name" className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                    {t(locale, "電郵地址", "Email address", "Email", "メールアドレス")}
                  </label>
                  <div className="mt-2">
                    <input id="email" name="email" type="email" autoComplete="email" className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                    {t(locale, "聯絡電話", "Phone", "Telefone", "電話番号")}
                  </label>
                  <div className="mt-2">
                    <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+853 6XXX XXXX" className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors" />
                  </div>
                </div>

                {/* Delivery method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    {t(locale, "配送方式", "Delivery method", "Método de entrega", "配送方法")}
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    {(["delivery", "pickup"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setDeliveryMethod(method)}
                        className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${deliveryMethod === method ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"}`}
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
                  <div>
                    <label htmlFor="zone" className="block text-sm font-semibold text-gray-700">
                      {t(locale, "送貨區域", "Delivery zone", "Zona de entrega", "配送エリア")}
                    </label>
                    <div className="mt-2">
                      <select
                        id="zone"
                        value={selectedZone}
                        onChange={(e) => setSelectedZone(e.target.value)}
                        className="appearance-none block w-full rounded-lg border border-gray-300 bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.22%208.22a.75.75%200%200%201%201.06%200L10%2011.94l3.72-3.72a.75.75%200%201%201%201.06%201.06l-4.25%204.25a.75.75%200%200%201-1.06%200L5.22%209.28a.75.75%200%200%201%200-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.75rem_center] bg-no-repeat px-4 py-3 pr-10 text-base text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                      >
                        {deliveryZones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name} — {currency} {z.fee.toFixed(2)}
                            {z.freeAbove ? ` (${t(locale, `滿${currency}${z.freeAbove}免運`, `Free over ${currency}${z.freeAbove}`, `Grátis >${currency}${z.freeAbove}`, `${currency}${z.freeAbove}以上無料`)})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Address fields (delivery only) */}
                {deliveryMethod === "delivery" && (
                  <>
                    <div>
                      <label htmlFor="address" className="block text-sm font-semibold text-gray-700">
                        {t(locale, "地址", "Address", "Endereço", "住所")}
                      </label>
                      <div className="mt-2">
                        <input id="address" name="address" type="text" autoComplete="street-address" className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address2" className="block text-sm font-semibold text-gray-700">
                        {t(locale, "地址補充", "Apartment, suite, etc.", "Complemento", "建物名・部屋番号")}
                      </label>
                      <div className="mt-2">
                        <input id="address2" name="address2" type="text" className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors" />
                      </div>
                    </div>

                    {/* City / Country — two columns */}
                    <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">
                          {t(locale, "城市", "City", "Cidade", "都市")}
                        </label>
                        <div className="mt-2">
                          <input type="text" defaultValue="Macau" readOnly className="block w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-500 cursor-not-allowed" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700">
                          {t(locale, "國家/地區", "Country", "País", "国/地域")}
                        </label>
                        <div className="mt-2">
                          <select className="appearance-none block w-full rounded-lg border border-gray-300 bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.22%208.22a.75.75%200%200%201%201.06%200L10%2011.94l3.72-3.72a.75.75%200%201%201%201.06%201.06l-4.25%204.25a.75.75%200%200%201-1.06%200L5.22%209.28a.75.75%200%200%201%200-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.75rem_center] bg-no-repeat px-4 py-3 pr-10 text-base text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors">
                            <option>Macau (澳門)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* District / Postal — two columns */}
                    <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2">
                      <div>
                        <label htmlFor="district" className="block text-sm font-semibold text-gray-700">
                          {t(locale, "區域", "State / Province", "Estado", "地区")}
                        </label>
                        <div className="mt-2">
                          <input id="district" name="district" type="text" className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors" />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="postal" className="block text-sm font-semibold text-gray-700">
                          {t(locale, "郵政編碼", "Postal code", "CEP", "郵便番号")}
                        </label>
                        <div className="mt-2">
                          <input id="postal" name="postal" type="text" autoComplete="postal-code" className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-semibold text-gray-700">
                    {t(locale, "備註", "Order notes", "Notas", "備考")}
                  </label>
                  <div className="mt-2">
                    <input id="notes" name="notes" type="text" placeholder={t(locale, "可選", "Optional", "Opcional", "任意")} className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-colors" />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-10 w-full rounded-lg border border-transparent bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-300 transition-colors"
              >
                {submitting
                  ? "..."
                  : `${t(locale, "支付", "Pay", "Pagar", "支払い")} ${currency} ${total.toFixed(2)}`
                }
              </button>

              <p className="mt-6 flex justify-center text-sm font-medium text-gray-500">
                <LockClosedIcon className="mr-1.5 size-5 text-gray-400" aria-hidden="true" />
                {t(locale, "安全加密付款", "Secure encrypted payment", "Pagamento seguro", "安全な暗号化支払い")}
              </p>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
