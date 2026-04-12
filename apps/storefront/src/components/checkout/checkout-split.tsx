"use client";

import { useState } from "react";
import StoreThumb from "@/components/shared/store-thumb";

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

type SavedAddress = {
  id: string;
  label: string | null;
  recipientName: string;
  phone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  district: string | null;
  city: string | null;
  isDefault: boolean;
};

type Props = {
  items: CartItem[];
  deliveryZones?: DeliveryZone[];
  locale: string;
  currency?: string;
  themeId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  savedAddresses?: SavedAddress[];
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
  themeId,
  customerEmail,
  customerPhone,
  customerName,
  savedAddresses = [],
  onSubmit,
}: Props) {
  const isHumanMade = themeId === "humanmade";
  const [paymentMethod, setPaymentMethod] = useState("mpay");
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");
  const [selectedZone, setSelectedZone] = useState(deliveryZones[0]?.id || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">(
    defaultAddr ? defaultAddr.id : "new"
  );
  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const zone = deliveryZones.find((z) => z.id === selectedZone);
  const shippingFee = deliveryMethod === "pickup" ? 0 : (zone?.fee || 0);
  const isFreeShipping = zone?.freeAbove && subtotal >= zone.freeAbove;
  const total = subtotal + (isFreeShipping ? 0 : shippingFee);

  // Theme tokens
  const summaryPanelBg = isHumanMade ? "bg-[#fafafa]" : "bg-gray-50";
  const summaryPanelBorder = isHumanMade ? "border-l border-[#121212]/10" : "border-l border-gray-200";

  const sectionHeading = isHumanMade
    ? "text-[13px] font-normal uppercase tracking-[0.12em] text-[#121212]"
    : "text-lg font-medium text-gray-900";
  const labelClass = isHumanMade
    ? "block text-[11px] uppercase tracking-[0.1em] text-[#121212]/70"
    : "block text-sm/6 font-medium text-gray-700";
  const inputClass = isHumanMade
    ? "block w-full border-b border-[#121212]/20 bg-transparent px-0 py-2 text-[14px] text-[#121212] outline-none transition-colors focus:border-[#121212] placeholder:text-[#121212]/30"
    : "block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6";
  const selectClass = isHumanMade
    ? "appearance-none block w-full border-b border-[#121212]/20 bg-transparent px-0 py-2 pr-8 text-[14px] text-[#121212] outline-none focus:border-[#121212] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%23121212%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.22%208.22a.75.75%200%200%201%201.06%200L10%2011.94l3.72-3.72a.75.75%200%201%201%201.06%201.06l-4.25%204.25a.75.75%200%200%201-1.06%200L5.22%209.28a.75.75%200%200%201%200-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[position:right_0.25rem_center] bg-no-repeat"
    : "appearance-none block w-full rounded-md bg-white px-3 py-2 pr-8 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.22%208.22a.75.75%200%200%201%201.06%200L10%2011.94l3.72-3.72a.75.75%200%201%201%201.06%201.06l-4.25%204.25a.75.75%200%200%201-1.06%200L5.22%209.28a.75.75%200%200%201%200-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_0.5rem_center] bg-no-repeat focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6";

  const pillBase = isHumanMade
    ? "px-3 py-3 text-[11px] uppercase tracking-[0.1em] border transition-colors"
    : "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors";
  const pillOn = isHumanMade
    ? "border-[#121212] bg-[#121212] text-white"
    : "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500";
  const pillOff = isHumanMade
    ? "border-[#121212]/30 bg-white text-[#121212] hover:border-[#121212]"
    : "border-gray-300 text-gray-700 hover:bg-gray-50";

  const radioCardOn = isHumanMade
    ? "border-[#121212] bg-[#f5f5f5]"
    : "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500";
  const radioCardOff = isHumanMade
    ? "border-[#121212]/15 hover:border-[#121212]/40"
    : "border-gray-200 hover:bg-gray-50";

  const submitBtn = isHumanMade
    ? "w-full bg-[#121212] px-6 py-4 text-[13px] uppercase tracking-[0.15em] text-white hover:bg-[#333] transition-colors disabled:bg-[#121212]/40 disabled:cursor-not-allowed"
    : "rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 disabled:bg-gray-300";

  const summaryText = isHumanMade ? "text-[#121212]" : "text-gray-500";
  const summaryAmountLabel = isHumanMade
    ? "text-[11px] uppercase tracking-[0.1em] text-[#121212]/60"
    : "text-sm font-medium";
  const summaryAmountValue = isHumanMade
    ? "mt-1 text-[28px] tracking-tight text-[#121212]"
    : "mt-1 text-3xl font-bold tracking-tight text-gray-900";
  const itemNameCls = isHumanMade ? "text-[13px] text-[#121212] line-clamp-2" : "text-gray-900";
  const itemMetaCls = isHumanMade ? "text-[11px] text-[#121212]/60 tracking-[0.03em]" : "";
  const itemPriceCls = isHumanMade
    ? "shrink-0 text-[13px] tabular-nums text-[#121212]"
    : "shrink-0 text-base font-medium text-gray-900";
  const breakdownRow = isHumanMade ? "flex items-center justify-between" : "flex items-center justify-between";
  const breakdownLabel = isHumanMade ? "text-[11px] uppercase tracking-[0.1em] text-[#121212]/70" : "";
  const breakdownValue = isHumanMade ? "text-[13px] tabular-nums text-[#121212]" : "";
  const totalRow = isHumanMade
    ? "flex items-center justify-between border-t border-[#121212]/15 pt-6"
    : "flex items-center justify-between border-t border-gray-200 pt-6 text-gray-900";
  const totalLabel = isHumanMade
    ? "text-[13px] uppercase tracking-[0.12em] text-[#121212]"
    : "text-base";
  const totalValue = isHumanMade
    ? "text-[15px] tabular-nums text-[#121212]"
    : "text-base";

  return (
    <div className="bg-white">
      {/* Full-width split: right half gets off-white panel bg on lg+ */}
      <div className="relative lg:min-h-[calc(100vh-140px)]">
        <div aria-hidden="true" className="absolute inset-0 hidden lg:block pointer-events-none">
          <div className={`ml-auto h-full w-1/2 ${summaryPanelBg} ${summaryPanelBorder}`} />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2 lg:px-8 lg:pt-12">
        <h1 className="sr-only">Checkout</h1>

        {/* Right: Order summary */}
        <section
          aria-labelledby="summary-heading"
          className={`${summaryPanelBg} py-12 md:px-10 lg:col-start-2 lg:row-start-1 lg:mx-auto lg:w-full lg:max-w-lg lg:bg-transparent lg:px-0 lg:pt-0 lg:pb-24 ${summaryText}`}
        >
          <div className="mx-auto max-w-2xl px-4 lg:max-w-none lg:px-0">
            <h2 id="summary-heading" className={isHumanMade ? sectionHeading + " mb-6" : "sr-only"}>
              {isHumanMade ? t(locale, "訂單摘要", "Order summary", "Resumo", "ご注文内容") : "Order summary"}
            </h2>

            <dl>
              <dt className={summaryAmountLabel}>{t(locale, "應付金額", "Amount due", "Valor devido", "お支払い金額")}</dt>
              <dd className={summaryAmountValue}>{currency} {total.toFixed(2)}</dd>
            </dl>

            <ul role="list" className={`divide-y ${isHumanMade ? "divide-[#121212]/10" : "divide-gray-200"} text-sm font-medium`}>
              {items.map((item) => (
                <li key={item.id} className="flex items-start space-x-4 py-6">
                  <div className="relative shrink-0">
                    <div className={`relative size-20 overflow-hidden ${isHumanMade ? "" : "rounded-md"} bg-[#f5f5f5]`}>
                      {item.image ? (
                        <StoreThumb src={item.image} alt={item.name} fill sizes="80px" className="object-contain object-center" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-[#121212]/30 text-xs font-bold">
                          {item.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    {item.quantity > 1 && (
                      <span
                        aria-label={`Quantity ${item.quantity}`}
                        className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-[#121212] text-[12px] font-medium tabular-nums text-white shadow-sm"
                      >
                        {item.quantity}
                      </span>
                    )}
                  </div>
                  <div className="flex-auto space-y-1">
                    <h3 className={itemNameCls}>{item.name}</h3>
                    {item.variant && <p className={itemMetaCls}>{item.variant}</p>}
                  </div>
                  <p className={itemPriceCls}>{currency} {(item.price * item.quantity).toFixed(2)}</p>
                </li>
              ))}
            </ul>

            <dl className={`space-y-6 border-t ${isHumanMade ? "border-[#121212]/15" : "border-gray-200"} pt-6 text-sm font-medium`}>
              <div className={breakdownRow}>
                <dt className={breakdownLabel}>{t(locale, "小計", "Subtotal", "Subtotal", "小計")}</dt>
                <dd className={breakdownValue}>{currency} {subtotal.toFixed(2)}</dd>
              </div>
              <div className={breakdownRow}>
                <dt className={breakdownLabel}>{t(locale, "運費", "Shipping", "Frete", "送料")}</dt>
                <dd className={breakdownValue}>
                  {deliveryMethod === "pickup"
                    ? t(locale, "免費", "Free", "Grátis", "無料")
                    : isFreeShipping
                    ? t(locale, "免費", "Free", "Grátis", "無料")
                    : `${currency} ${shippingFee.toFixed(2)}`}
                </dd>
              </div>
              <div className={totalRow}>
                <dt className={totalLabel}>{t(locale, "總計", "Total", "Total", "合計")}</dt>
                <dd className={totalValue}>{currency} {total.toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Left: Form */}
        <section
          aria-labelledby="payment-and-shipping-heading"
          className="py-12 lg:col-start-1 lg:row-start-1 lg:mx-auto lg:w-full lg:max-w-lg lg:pt-0 lg:pb-24"
        >
          <h2 id="payment-and-shipping-heading" className="sr-only">Payment and shipping details</h2>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!onSubmit) return;
              setError(null);
              setSubmitting(true);

              const fd = new FormData(e.currentTarget);

              const addr = selectedAddress && deliveryMethod === "delivery"
                ? {
                    recipientName: selectedAddress.recipientName,
                    phone: selectedAddress.phone || "",
                    address: selectedAddress.addressLine1 + (selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ""),
                    district: selectedAddress.district || "",
                    postalCode: "",
                  }
                : {
                    recipientName: fd.get("name") as string,
                    phone: fd.get("phone") as string,
                    address: fd.get("address") as string,
                    district: fd.get("district") as string,
                    postalCode: fd.get("postal-code") as string,
                  };

              const result = await onSubmit({
                deliveryMethod,
                deliveryZoneId: selectedZone || undefined,
                paymentMethod,
                contact: fd.get("email") as string,
                ...addr,
                notes: fd.get("notes") as string,
              });

              if (result.error) {
                setError(result.error);
              }
              setSubmitting(false);
            }}
          >
            <div className="mx-auto max-w-2xl px-4 lg:max-w-none lg:px-0">
              {error && (
                <div className={isHumanMade
                  ? "mb-6 border border-[#dc3545]/30 bg-[#dc3545]/5 px-4 py-3 text-[12px] tracking-[0.03em] text-[#dc3545]"
                  : "mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700"
                }>
                  {error}
                </div>
              )}

              {/* Contact */}
              <div>
                <h3 className={sectionHeading}>
                  {t(locale, "聯絡資料", "Contact information", "Informações de contato", "連絡先情報")}
                </h3>
                <div className="mt-6">
                  <label htmlFor="email" className={labelClass}>
                    {t(locale, "電郵地址", "Email address", "Email", "メールアドレス")}
                  </label>
                  <div className="mt-1">
                    <input id="email" name="email" type="email" autoComplete="email" required defaultValue={customerEmail || ""} className={inputClass} />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="mt-10">
                <h3 className={sectionHeading}>
                  {t(locale, "付款方式", "Payment details", "Detalhes de pagamento", "お支払い方法")}
                </h3>
                <div className="mt-6">
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
                        className={`${pillBase} ${paymentMethod === pm.id ? pillOn : pillOff}`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="mt-10">
                <h3 className={sectionHeading}>
                  {t(locale, "收件資訊", "Shipping address", "Endereço de entrega", "配送先住所")}
                </h3>

                <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
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
                          className={`${pillBase} ${deliveryMethod === method ? pillOn : pillOff}`}
                        >
                          {method === "delivery"
                            ? t(locale, "送貨", "Delivery", "Entrega", "配送")
                            : t(locale, "自取", "Pickup", "Retirada", "店舗受取")}
                        </button>
                      ))}
                    </div>
                  </div>

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

                  {deliveryMethod === "delivery" && savedAddresses.length > 0 && (
                    <div className="sm:col-span-3">
                      <label className={labelClass}>
                        {t(locale, "已儲存地址", "Saved addresses", "Endereços salvos", "保存済み住所")}
                      </label>
                      <div className="mt-2 space-y-2">
                        {savedAddresses.map((addr) => (
                          <label
                            key={addr.id}
                            className={`flex cursor-pointer items-start gap-3 ${isHumanMade ? "" : "rounded-lg"} border p-3 transition-colors ${
                              selectedAddressId === addr.id ? radioCardOn : radioCardOff
                            }`}
                          >
                            <input
                              type="radio"
                              name="saved-address"
                              value={addr.id}
                              checked={selectedAddressId === addr.id}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className={`mt-1 size-4 ${isHumanMade ? "accent-[#121212]" : "text-indigo-600 focus:ring-indigo-500"}`}
                            />
                            <div className="min-w-0 text-sm">
                              <div className="flex items-center gap-2">
                                <span className={isHumanMade ? "text-[13px] text-[#121212]" : "font-medium text-gray-900"}>
                                  {addr.recipientName}
                                </span>
                                {addr.label && (
                                  <span className={isHumanMade
                                    ? "inline-flex border border-[#121212]/15 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-[#121212]/60"
                                    : "inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                                  }>{addr.label}</span>
                                )}
                                {addr.isDefault && (
                                  <span className={isHumanMade
                                    ? "inline-flex bg-[#121212] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-white"
                                    : "inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700"
                                  }>{t(locale, "預設", "Default", "Padrão", "デフォルト")}</span>
                                )}
                              </div>
                              <p className={isHumanMade ? "mt-0.5 text-[12px] text-[#121212]/70" : "mt-0.5 text-gray-500"}>
                                {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                              </p>
                              {addr.phone && <p className={isHumanMade ? "text-[11px] text-[#121212]/50" : "text-gray-400"}>{addr.phone}</p>}
                            </div>
                          </label>
                        ))}
                        <label
                          className={`flex cursor-pointer items-center gap-3 ${isHumanMade ? "" : "rounded-lg"} border p-3 transition-colors ${
                            selectedAddressId === "new" ? radioCardOn : radioCardOff
                          }`}
                        >
                          <input
                            type="radio"
                            name="saved-address"
                            value="new"
                            checked={selectedAddressId === "new"}
                            onChange={() => setSelectedAddressId("new")}
                            className={`size-4 ${isHumanMade ? "accent-[#121212]" : "text-indigo-600 focus:ring-indigo-500"}`}
                          />
                          <span className={isHumanMade ? "text-[12px] uppercase tracking-[0.08em] text-[#121212]" : "text-sm font-medium text-gray-700"}>
                            {t(locale, "使用新地址", "Use a new address", "Usar novo endereço", "新しい住所を使用")}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {(selectedAddressId === "new" || savedAddresses.length === 0) && (
                    <>
                      <div className="sm:col-span-3">
                        <label htmlFor="name" className={labelClass}>
                          {t(locale, "收件人姓名", "Full name", "Nome completo", "お名前")}
                        </label>
                        <div className="mt-1">
                          <input id="name" name="name" type="text" required autoComplete="name" defaultValue={customerName || ""} className={inputClass} />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="phone" className={labelClass}>
                          {t(locale, "聯絡電話", "Phone", "Telefone", "電話番号")}
                        </label>
                        <div className="mt-1">
                          <input id="phone" name="phone" type="tel" required autoComplete="tel" placeholder="+853 6XXX XXXX" defaultValue={customerPhone || ""} className={inputClass} />
                        </div>
                      </div>

                      {deliveryMethod === "delivery" && (
                        <>
                          <div className="sm:col-span-3">
                            <label htmlFor="address" className={labelClass}>
                              {t(locale, "地址", "Address", "Endereço", "住所")}
                            </label>
                            <div className="mt-1">
                              <input id="address" name="address" type="text" required autoComplete="street-address" className={inputClass} />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="city" className={labelClass}>
                              {t(locale, "城市", "City", "Cidade", "都市")}
                            </label>
                            <div className="mt-1">
                              <input id="city" name="city" type="text" defaultValue="Macau" autoComplete="address-level2" className={inputClass} />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="district" className={labelClass}>
                              {t(locale, "區域", "District", "Distrito", "地区")}
                            </label>
                            <div className="mt-1">
                              <input id="district" name="district" type="text" autoComplete="address-level1" className={inputClass} />
                            </div>
                          </div>

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
                    </>
                  )}

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
              <div className={`mt-10 ${isHumanMade ? "border-t border-[#121212]/15 pt-8" : "flex justify-end border-t border-gray-200 pt-6"}`}>
                <button
                  type="submit"
                  disabled={submitting}
                  className={submitBtn}
                >
                  {submitting
                    ? "..."
                    : t(locale, "確認付款", "PAY NOW", "PAGAR AGORA", "今すぐ支払う")}
                </button>
              </div>
            </div>
          </form>
        </section>
        </div>
      </div>
    </div>
  );
}
