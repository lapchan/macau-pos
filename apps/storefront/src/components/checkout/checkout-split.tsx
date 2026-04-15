"use client";

import { useState, type FormEvent } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
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
  isLoggedIn?: boolean;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  savedAddresses?: SavedAddress[];
  onSubmit?: (data: {
    deliveryMethod: string;
    deliveryZoneId?: string;
    paymentService: string;
    contact: string;
    recipientName: string;
    phone: string;
    address: string;
    district: string;
    postalCode: string;
    notes?: string;
  }) => Promise<{ error?: string; success?: boolean; orderNumber?: string; paymentUrl?: string }>;
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
  isLoggedIn = false,
  customerEmail,
  customerPhone,
  customerName,
  savedAddresses = [],
  onSubmit,
}: Props) {
  const isHumanMade = themeId === "humanmade";

  // Contact
  const [email, setEmail] = useState(customerEmail || "");
  const [newsletter, setNewsletter] = useState(false);

  // Delivery method
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery");

  // Address fields
  const nameParts = (customerName || "").trim().split(/\s+/);
  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" "));
  const [company, setCompany] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [apartment, setApartment] = useState("");
  const [city, setCity] = useState("Macau");
  const [district, setDistrict] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState(customerPhone || "");
  const [saveInfo, setSaveInfo] = useState(false);

  // Saved address selector
  const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">(
    defaultAddr ? defaultAddr.id : "new"
  );
  const selectedSavedAddress =
    selectedAddressId !== "new" ? savedAddresses.find((a) => a.id === selectedAddressId) : undefined;

  // Shipping method
  const [selectedZone, setSelectedZone] = useState(deliveryZones[0]?.id || "");

  // Payment
  const [paymentService, setPaymentService] = useState("simplepay");
  const [notes, setNotes] = useState("");

  // Discount code (UI only)
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Mobile order summary drawer
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Field-level errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Derived ──────────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const zone = deliveryZones.find((z) => z.id === selectedZone);
  const shippingFee = deliveryMethod === "pickup" ? 0 : (zone?.fee || 0);
  const isFreeShipping = !!(zone?.freeAbove && subtotal >= zone.freeAbove);
  const total = subtotal + (isFreeShipping ? 0 : shippingFee);

  const usingSavedAddress = deliveryMethod === "delivery" && !!selectedSavedAddress;
  const resolvedName = usingSavedAddress
    ? selectedSavedAddress!.recipientName
    : `${firstName} ${lastName}`.trim();
  const resolvedPhone = usingSavedAddress ? (selectedSavedAddress!.phone || phone) : phone;
  const resolvedAddressLine = usingSavedAddress
    ? selectedSavedAddress!.addressLine1 +
      (selectedSavedAddress!.addressLine2 ? `, ${selectedSavedAddress!.addressLine2}` : "")
    : addressLine1 + (apartment ? `, ${apartment}` : "");
  const resolvedDistrict = usingSavedAddress ? (selectedSavedAddress!.district || "") : district;

  // ─── Validation ───────────────────────────────────────────────────────
  function validateAll(): boolean {
    const errs: Record<string, string> = {};
    const req = t(locale, "必填", "Required", "Obrigatório", "必須");
    if (!email.trim()) errs.email = t(locale, "請輸入電郵", "Enter your email", "Insira email", "メールを入力");
    else if (!email.includes("@")) errs.email = t(locale, "無效電郵", "Invalid email", "Inválido", "無効なメール");

    if (!usingSavedAddress) {
      if (!firstName.trim()) errs.firstName = req;
      if (!lastName.trim()) errs.lastName = req;
      if (!phone.trim()) errs.phone = req;
      if (deliveryMethod === "delivery") {
        if (!addressLine1.trim()) errs.addressLine1 = req;
        if (!city.trim()) errs.city = req;
      }
    }

    if (deliveryMethod === "delivery" && !selectedZone) {
      errs.zone = t(locale, "請選擇送貨方式", "Select a shipping method", "Selecione método", "配送方法を選択");
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstKey = Object.keys(errs)[0];
      if (typeof document !== "undefined") {
        const el = document.querySelector(`[data-field="${firstKey}"]`);
        if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }
    return true;
  }

  function handleApplyDiscount() {
    if (!discountCode.trim()) return;
    setDiscountError(
      t(locale, "無效或已過期的優惠碼", "Invalid or expired discount code", "Código inválido", "無効なコード")
    );
  }

  async function handleFinalSubmit(e: FormEvent) {
    e.preventDefault();
    if (!onSubmit) return;
    if (!validateAll()) return;
    setSubmitError(null);
    setSubmitting(true);

    const result = await onSubmit({
      deliveryMethod,
      deliveryZoneId: selectedZone || undefined,
      paymentService,
      contact: email,
      recipientName: resolvedName,
      phone: resolvedPhone,
      address: resolvedAddressLine,
      district: resolvedDistrict,
      postalCode,
      notes,
    });

    if (result.error) {
      setSubmitError(result.error);
    }
    setSubmitting(false);
  }

  // ─── Theme tokens ─────────────────────────────────────────────────────
  const summaryPanelBg = isHumanMade ? "bg-[#fafafa]" : "bg-gray-50";
  const summaryPanelBorder = isHumanMade ? "border-l border-[#121212]/10" : "border-l border-gray-200";

  const sectionHeading = isHumanMade
    ? "text-[13px] font-normal uppercase tracking-[0.12em] text-[#121212]"
    : "text-lg font-medium text-gray-900";
  const labelClass = isHumanMade
    ? "block text-[11px] uppercase tracking-[0.1em] text-[#121212]/70"
    : "block text-sm font-medium text-gray-700";
  const inputBase = isHumanMade
    ? "block w-full border-b border-[#121212]/20 bg-transparent px-0 py-2 text-[14px] text-[#121212] outline-none transition-colors focus:border-[#121212] placeholder:text-[#121212]/30"
    : "block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-sf-accent sm:text-sm/6";
  const inputErr = isHumanMade ? "!border-[#dc3545]" : "!outline-red-500 !outline-2";

  const pillBase = isHumanMade
    ? "px-3 py-3 text-[11px] uppercase tracking-[0.1em] border transition-colors"
    : "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors";
  const pillOn = isHumanMade
    ? "border-[#121212] bg-[#121212] text-white"
    : "border-sf-accent bg-sf-accent-light text-sf-accent ring-1 ring-sf-accent";
  const pillOff = isHumanMade
    ? "border-[#121212]/30 bg-white text-[#121212] hover:border-[#121212]"
    : "border-gray-300 text-gray-700 hover:bg-gray-50";

  const radioCardOn = isHumanMade
    ? "border-[#121212] bg-[#f5f5f5]"
    : "border-sf-accent bg-sf-accent-light ring-1 ring-sf-accent";
  const radioCardOff = isHumanMade
    ? "border-[#121212]/15 hover:border-[#121212]/40"
    : "border-gray-200 hover:bg-gray-50";

  const primaryBtn = isHumanMade
    ? "bg-[#121212] px-8 py-4 text-[13px] uppercase tracking-[0.15em] text-white hover:bg-[#333] transition-colors disabled:bg-[#121212]/40 disabled:cursor-not-allowed"
    : "rounded-md border border-transparent bg-sf-accent px-6 py-3 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed";

  const backLink = isHumanMade
    ? "inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-[#121212]/70 hover:text-[#121212]"
    : "inline-flex items-center gap-1.5 text-sm font-medium text-sf-accent hover:opacity-80";

  const summaryAmountLabel = isHumanMade
    ? "text-[11px] uppercase tracking-[0.1em] text-[#121212]/60"
    : "text-sm font-medium text-gray-500";
  const summaryAmountValue = isHumanMade
    ? "mt-1 text-[28px] tracking-tight text-[#121212]"
    : "mt-1 text-3xl font-bold tracking-tight text-gray-900";
  const itemNameCls = isHumanMade ? "text-[13px] text-[#121212] line-clamp-2" : "text-gray-900";
  const itemMetaCls = isHumanMade ? "text-[11px] text-[#121212]/60 tracking-[0.03em]" : "text-sm text-gray-500";
  const itemPriceCls = isHumanMade
    ? "shrink-0 text-[13px] tabular-nums text-[#121212]"
    : "shrink-0 text-base font-medium text-gray-900";
  const breakdownLabel = isHumanMade
    ? "text-[11px] uppercase tracking-[0.1em] text-[#121212]/70"
    : "text-sm text-gray-600";
  const breakdownValue = isHumanMade ? "text-[13px] tabular-nums text-[#121212]" : "text-sm font-medium text-gray-900";
  const totalRow = isHumanMade
    ? "flex items-center justify-between border-t border-[#121212]/15 pt-6"
    : "flex items-center justify-between border-t border-gray-200 pt-6";
  const totalLabel = isHumanMade
    ? "text-[13px] uppercase tracking-[0.12em] text-[#121212]"
    : "text-base font-semibold text-gray-900";
  const totalValue = isHumanMade
    ? "text-[15px] tabular-nums text-[#121212]"
    : "text-base font-semibold text-gray-900";

  // ─── Summary content (reused desktop + mobile) ────────────────────────
  const summaryContent = (
    <>
      <ul
        role="list"
        className={`divide-y ${isHumanMade ? "divide-[#121212]/10" : "divide-gray-200"} text-sm font-medium`}
      >
        {items.map((item) => (
          <li key={item.id} className="flex items-start space-x-4 py-6">
            <div className="relative shrink-0">
              <div
                className={`relative size-20 overflow-hidden ${isHumanMade ? "" : "rounded-md"} bg-[#f5f5f5]`}
              >
                {item.image ? (
                  <StoreThumb
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-contain object-center"
                  />
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
            <p className={itemPriceCls}>
              {currency} {(item.price * item.quantity).toFixed(2)}
            </p>
          </li>
        ))}
      </ul>

      {/* Discount code */}
      <div
        className={`border-t ${isHumanMade ? "border-[#121212]/10" : "border-gray-200"} pt-6`}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => {
                setDiscountCode(e.target.value);
                if (discountError) setDiscountError(null);
              }}
              placeholder={t(
                locale,
                "優惠碼或禮品卡",
                "Discount code or gift card",
                "Código ou cartão",
                "割引コードまたはギフトカード"
              )}
              className={inputBase}
            />
          </div>
          <button
            type="button"
            onClick={handleApplyDiscount}
            disabled={!discountCode.trim()}
            className={
              isHumanMade
                ? "border border-[#121212] bg-white px-6 py-2 text-[12px] uppercase tracking-[0.1em] text-[#121212] hover:bg-[#f5f5f5] disabled:opacity-30 disabled:cursor-not-allowed"
                : "rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            }
          >
            {t(locale, "套用", "Apply", "Aplicar", "適用")}
          </button>
        </div>
        {discountError && (
          <p className="mt-2 text-xs text-red-600">{discountError}</p>
        )}
      </div>

      {/* Totals */}
      <dl
        className={`mt-6 space-y-4 border-t ${isHumanMade ? "border-[#121212]/10" : "border-gray-200"} pt-6 text-sm font-medium`}
      >
        <div className="flex items-center justify-between">
          <dt className={breakdownLabel}>
            {t(locale, "小計", "Subtotal", "Subtotal", "小計")}
            <span className={isHumanMade ? " text-[#121212]/50" : " text-gray-400"}>
              {" "}· {items.reduce((s, i) => s + i.quantity, 0)}
              {" "}
              {t(locale, "件", "items", "itens", "点")}
            </span>
          </dt>
          <dd className={breakdownValue}>
            {currency} {subtotal.toFixed(2)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className={breakdownLabel}>{t(locale, "運費", "Shipping", "Frete", "送料")}</dt>
          <dd className={breakdownValue}>
            {deliveryMethod === "pickup"
              ? t(locale, "免費", "Free", "Grátis", "無料")
              : !zone
                ? t(locale, "請選擇", "Select method", "Selecione", "選択")
                : isFreeShipping
                  ? t(locale, "免費", "Free", "Grátis", "無料")
                  : `${currency} ${shippingFee.toFixed(2)}`}
          </dd>
        </div>
        <div className={totalRow}>
          <dt className={totalLabel}>{t(locale, "總計", "Total", "Total", "合計")}</dt>
          <dd className={totalValue}>
            {currency} {total.toFixed(2)}
          </dd>
        </div>
      </dl>
    </>
  );

  // ─── Field error helper ───────────────────────────────────────────────
  function FieldError({ name }: { name: string }) {
    const err = fieldErrors[name];
    if (!err) return null;
    return <p className="mt-1 text-xs text-red-600">{err}</p>;
  }

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="bg-white">
      <div className="relative lg:min-h-[calc(100vh-140px)]">
        {/* Desktop split background */}
        <div aria-hidden="true" className="absolute inset-0 hidden lg:block pointer-events-none">
          <div className={`ml-auto h-full w-1/2 ${summaryPanelBg} ${summaryPanelBorder}`} />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2 lg:px-8 lg:pt-10">
          <h1 className="sr-only">Checkout</h1>

          {/* ═══════════════════════════════════════════════════════════
              ORDER SUMMARY
              ═══════════════════════════════════════════════════════════ */}
          <section
            aria-labelledby="summary-heading"
            className="lg:col-start-2 lg:row-start-1 lg:mx-auto lg:w-full lg:max-w-lg"
          >
            {/* Mobile collapsible */}
            <div
              className={`lg:hidden ${summaryPanelBg} border-y ${isHumanMade ? "border-[#121212]/10" : "border-gray-200"}`}
            >
              <button
                type="button"
                onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
                className="flex w-full items-center justify-between px-4 py-4"
                aria-expanded={mobileSummaryOpen}
              >
                <span
                  className={`inline-flex items-center gap-1 ${
                    isHumanMade
                      ? "text-[12px] uppercase tracking-[0.1em] text-[#121212]"
                      : "text-sm font-medium text-sf-accent"
                  }`}
                >
                  {mobileSummaryOpen
                    ? t(locale, "隱藏訂單摘要", "Hide order summary", "Ocultar resumo", "注文を隠す")
                    : t(locale, "顯示訂單摘要", "Show order summary", "Ver resumo", "注文を表示")}
                  {mobileSummaryOpen ? (
                    <ChevronUpIcon className="size-4" />
                  ) : (
                    <ChevronDownIcon className="size-4" />
                  )}
                </span>
                <span
                  className={
                    isHumanMade
                      ? "text-[15px] tabular-nums text-[#121212]"
                      : "text-lg font-semibold text-gray-900"
                  }
                >
                  {currency} {total.toFixed(2)}
                </span>
              </button>
              {mobileSummaryOpen && (
                <div className="mx-auto max-w-2xl px-4 pb-8">{summaryContent}</div>
              )}
            </div>

            {/* Desktop */}
            <div className="hidden lg:block lg:pb-24">
              <div className="mx-auto max-w-2xl px-4 lg:max-w-none lg:px-0">
                <h2 id="summary-heading" className={isHumanMade ? sectionHeading + " mb-2" : "sr-only"}>
                  {isHumanMade
                    ? t(locale, "訂單摘要", "Order summary", "Resumo", "ご注文内容")
                    : "Order summary"}
                </h2>
                <dl>
                  <dt className={summaryAmountLabel}>
                    {t(locale, "應付金額", "Amount due", "Valor devido", "お支払い金額")}
                  </dt>
                  <dd className={summaryAmountValue}>
                    {currency} {total.toFixed(2)}
                  </dd>
                </dl>
                <div className="mt-6">{summaryContent}</div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              FORM SIDE
              ═══════════════════════════════════════════════════════════ */}
          <section className="py-12 lg:col-start-1 lg:row-start-1 lg:mx-auto lg:w-full lg:max-w-lg lg:pt-0 lg:pb-24">
            <div className="mx-auto max-w-2xl px-4 lg:max-w-none lg:px-0">
              {submitError && (
                <div
                  className={
                    isHumanMade
                      ? "mb-6 border border-[#dc3545]/30 bg-[#dc3545]/5 px-4 py-3 text-[12px] tracking-[0.03em] text-[#dc3545]"
                      : "mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700"
                  }
                >
                  {submitError}
                </div>
              )}

              <form onSubmit={handleFinalSubmit} noValidate className="space-y-10">
                {/* ═══════ CONTACT ═══════ */}
                <section>
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className={sectionHeading}>
                      {t(locale, "聯絡資料", "Contact", "Contato", "連絡先")}
                    </h3>
                    {!isLoggedIn && (
                      <p
                        className={
                          isHumanMade
                            ? "text-[11px] tracking-[0.04em] text-[#121212]/60"
                            : "text-xs text-gray-500"
                        }
                      >
                        {t(locale, "已有帳號？", "Have an account?", "Já tem conta?", "アカウントをお持ちですか？")}{" "}
                        <a
                          href={`/${locale}/login?next=${encodeURIComponent(`/${locale}/checkout`)}`}
                          className={
                            isHumanMade
                              ? "underline underline-offset-2 text-[#121212] hover:text-[#121212]/80"
                              : "font-medium text-sf-accent hover:opacity-80"
                          }
                        >
                          {t(locale, "登入", "Log in", "Entrar", "ログイン")}
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="mt-6" data-field="email">
                    <label htmlFor="email" className={labelClass}>
                      {t(locale, "電郵地址", "Email", "Email", "メールアドレス")}
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`${inputBase} mt-1 ${fieldErrors.email ? inputErr : ""}`}
                    />
                    <FieldError name="email" />
                    <p
                      className={
                        isHumanMade
                          ? "mt-2 text-[11px] text-[#121212]/50 tracking-[0.03em]"
                          : "mt-2 text-xs text-gray-500"
                      }
                    >
                      {t(
                        locale,
                        "我們將使用此電郵向您發送訂單詳情及更新。",
                        "We'll use this email to send you order details and updates.",
                        "Usaremos este email para enviar detalhes do pedido.",
                        "このメールアドレスで注文の詳細と更新をお知らせします。"
                      )}
                    </p>
                  </div>

                  <label className="mt-4 flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                      className={`mt-0.5 size-4 ${isHumanMade ? "accent-[#121212]" : "text-sf-accent"}`}
                    />
                    <span
                      className={
                        isHumanMade
                          ? "text-[11px] text-[#121212]/70 tracking-[0.03em]"
                          : "text-sm text-gray-600"
                      }
                    >
                      {t(
                        locale,
                        "訂閱電郵獲取最新消息及優惠",
                        "Email me with news and offers",
                        "Receber novidades e ofertas",
                        "ニュースとお得情報を受け取る"
                      )}
                    </span>
                  </label>
                </section>

                {/* ═══════ DELIVERY METHOD ═══════ */}
                <section>
                  <h3 className={sectionHeading}>
                    {t(locale, "配送方式", "Delivery method", "Entrega", "配送方法")}
                  </h3>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {(["delivery", "pickup"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDeliveryMethod(m)}
                        className={`${pillBase} ${deliveryMethod === m ? pillOn : pillOff}`}
                      >
                        {m === "delivery"
                          ? t(locale, "送貨", "Ship", "Enviar", "配送")
                          : t(locale, "門市自取", "Pick up in store", "Retirada", "店舗受取")}
                      </button>
                    ))}
                  </div>
                </section>

                {/* ═══════ SAVED ADDRESSES ═══════ */}
                {isLoggedIn && deliveryMethod === "delivery" && savedAddresses.length > 0 && (
                  <section>
                    <h3 className={sectionHeading}>
                      {t(locale, "已儲存地址", "Saved addresses", "Endereços salvos", "保存済み住所")}
                    </h3>
                    <div className="mt-6 space-y-2">
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
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className={`mt-1 size-4 ${isHumanMade ? "accent-[#121212]" : "text-sf-accent"}`}
                          />
                          <div className="min-w-0 text-sm">
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  isHumanMade
                                    ? "text-[13px] text-[#121212]"
                                    : "font-medium text-gray-900"
                                }
                              >
                                {addr.recipientName}
                              </span>
                              {addr.isDefault && (
                                <span
                                  className={
                                    isHumanMade
                                      ? "inline-flex bg-[#121212] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-white"
                                      : "inline-flex rounded-full bg-sf-accent-light px-2 py-0.5 text-xs text-sf-accent"
                                  }
                                >
                                  {t(locale, "預設", "Default", "Padrão", "デフォルト")}
                                </span>
                              )}
                            </div>
                            <p
                              className={
                                isHumanMade
                                  ? "mt-0.5 text-[12px] text-[#121212]/70"
                                  : "mt-0.5 text-gray-500"
                              }
                            >
                              {addr.addressLine1}
                              {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                            </p>
                            {addr.phone && (
                              <p
                                className={
                                  isHumanMade ? "text-[11px] text-[#121212]/50" : "text-gray-400"
                                }
                              >
                                {addr.phone}
                              </p>
                            )}
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
                          checked={selectedAddressId === "new"}
                          onChange={() => setSelectedAddressId("new")}
                          className={`size-4 ${isHumanMade ? "accent-[#121212]" : "text-sf-accent"}`}
                        />
                        <span
                          className={
                            isHumanMade
                              ? "text-[12px] uppercase tracking-[0.08em] text-[#121212]"
                              : "text-sm font-medium text-gray-700"
                          }
                        >
                          {t(locale, "使用新地址", "Use a new address", "Usar novo", "新しい住所")}
                        </span>
                      </label>
                    </div>
                  </section>
                )}

                {/* ═══════ ADDRESS FORM ═══════ */}
                {!usingSavedAddress && (
                  <section>
                    <h3 className={sectionHeading}>
                      {deliveryMethod === "delivery"
                        ? t(locale, "收件地址", "Shipping address", "Endereço de entrega", "配送先")
                        : t(locale, "取件人資料", "Pickup details", "Detalhes de retirada", "受取人情報")}
                    </h3>

                    <div className="mt-6 space-y-4">
                      {deliveryMethod === "delivery" && (
                        <div>
                          <label htmlFor="country" className={labelClass}>
                            {t(locale, "國家/地區", "Country/Region", "País/Região", "国/地域")}
                          </label>
                          <input
                            id="country"
                            type="text"
                            value="Macau SAR"
                            disabled
                            className={`${inputBase} mt-1 opacity-60 cursor-not-allowed`}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div data-field="firstName">
                          <label htmlFor="first-name" className={labelClass}>
                            {t(locale, "名", "First name", "Nome", "名")}
                          </label>
                          <input
                            id="first-name"
                            type="text"
                            autoComplete="given-name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className={`${inputBase} mt-1 ${fieldErrors.firstName ? inputErr : ""}`}
                          />
                          <FieldError name="firstName" />
                        </div>
                        <div data-field="lastName">
                          <label htmlFor="last-name" className={labelClass}>
                            {t(locale, "姓", "Last name", "Sobrenome", "姓")}
                          </label>
                          <input
                            id="last-name"
                            type="text"
                            autoComplete="family-name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className={`${inputBase} mt-1 ${fieldErrors.lastName ? inputErr : ""}`}
                          />
                          <FieldError name="lastName" />
                        </div>
                      </div>

                      {deliveryMethod === "delivery" && (
                        <>
                          <div>
                            <label htmlFor="company" className={labelClass}>
                              {t(locale, "公司（可選）", "Company (optional)", "Empresa (opcional)", "会社名（任意）")}
                            </label>
                            <input
                              id="company"
                              type="text"
                              autoComplete="organization"
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              className={`${inputBase} mt-1`}
                            />
                          </div>

                          <div data-field="addressLine1">
                            <label htmlFor="address" className={labelClass}>
                              {t(locale, "地址", "Address", "Endereço", "住所")}
                            </label>
                            <input
                              id="address"
                              type="text"
                              autoComplete="address-line1"
                              value={addressLine1}
                              onChange={(e) => setAddressLine1(e.target.value)}
                              className={`${inputBase} mt-1 ${fieldErrors.addressLine1 ? inputErr : ""}`}
                            />
                            <FieldError name="addressLine1" />
                          </div>

                          <div>
                            <label htmlFor="apartment" className={labelClass}>
                              {t(
                                locale,
                                "單位、樓層、大廈等（可選）",
                                "Apartment, suite, etc. (optional)",
                                "Apto, andar (opcional)",
                                "部屋番号、階数など（任意）"
                              )}
                            </label>
                            <input
                              id="apartment"
                              type="text"
                              autoComplete="address-line2"
                              value={apartment}
                              onChange={(e) => setApartment(e.target.value)}
                              className={`${inputBase} mt-1`}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div data-field="city">
                              <label htmlFor="city" className={labelClass}>
                                {t(locale, "城市", "City", "Cidade", "都市")}
                              </label>
                              <input
                                id="city"
                                type="text"
                                autoComplete="address-level2"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                className={`${inputBase} mt-1 ${fieldErrors.city ? inputErr : ""}`}
                              />
                              <FieldError name="city" />
                            </div>
                            <div>
                              <label htmlFor="postal" className={labelClass}>
                                {t(
                                  locale,
                                  "郵政編碼（可選）",
                                  "Postal code (optional)",
                                  "CEP (opcional)",
                                  "郵便番号（任意）"
                                )}
                              </label>
                              <input
                                id="postal"
                                type="text"
                                autoComplete="postal-code"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value)}
                                className={`${inputBase} mt-1`}
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="district" className={labelClass}>
                              {t(locale, "區域（可選）", "District (optional)", "Distrito (opcional)", "地区（任意）")}
                            </label>
                            <input
                              id="district"
                              type="text"
                              autoComplete="address-level1"
                              value={district}
                              onChange={(e) => setDistrict(e.target.value)}
                              className={`${inputBase} mt-1`}
                            />
                          </div>
                        </>
                      )}

                      <div data-field="phone">
                        <label htmlFor="phone" className={labelClass}>
                          {t(locale, "電話", "Phone", "Telefone", "電話番号")}
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="+853 6XXX XXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`${inputBase} mt-1 ${fieldErrors.phone ? inputErr : ""}`}
                        />
                        <FieldError name="phone" />
                      </div>

                      {!isLoggedIn && (
                        <label className="mt-2 flex items-start gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={saveInfo}
                            onChange={(e) => setSaveInfo(e.target.checked)}
                            className={`mt-0.5 size-4 ${isHumanMade ? "accent-[#121212]" : "text-sf-accent"}`}
                          />
                          <span
                            className={
                              isHumanMade
                                ? "text-[11px] text-[#121212]/70 tracking-[0.03em]"
                                : "text-sm text-gray-600"
                            }
                          >
                            {t(
                              locale,
                              "儲存此資料以供下次使用",
                              "Save this information for next time",
                              "Salvar para próxima compra",
                              "次回のために保存する"
                            )}
                          </span>
                        </label>
                      )}
                    </div>
                  </section>
                )}

                {/* ═══════ SHIPPING METHOD ═══════ */}
                <section data-field="zone">
                  <h3 className={sectionHeading}>
                    {t(locale, "送貨方式", "Shipping method", "Método de envio", "配送方法")}
                  </h3>

                  {deliveryMethod === "delivery" ? (
                    <div className="mt-6 space-y-2">
                      {deliveryZones.length === 0 ? (
                        <p
                          className={
                            isHumanMade
                              ? "text-[12px] text-[#121212]/60"
                              : "text-sm text-gray-500"
                          }
                        >
                          {t(locale, "暫無送貨服務", "No shipping available", "Sem envio", "配送不可")}
                        </p>
                      ) : (
                        deliveryZones.map((z) => {
                          const free = !!(z.freeAbove && subtotal >= z.freeAbove);
                          return (
                            <label
                              key={z.id}
                              className={`flex cursor-pointer items-center justify-between gap-3 ${isHumanMade ? "" : "rounded-lg"} border p-4 transition-colors ${
                                selectedZone === z.id ? radioCardOn : radioCardOff
                              }`}
                            >
                              <span className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  checked={selectedZone === z.id}
                                  onChange={() => setSelectedZone(z.id)}
                                  className={`size-4 ${isHumanMade ? "accent-[#121212]" : "text-sf-accent"}`}
                                />
                                <span>
                                  <span
                                    className={
                                      isHumanMade
                                        ? "block text-[13px] text-[#121212]"
                                        : "block text-sm font-medium text-gray-900"
                                    }
                                  >
                                    {z.name}
                                  </span>
                                  {z.freeAbove && !free && (
                                    <span
                                      className={
                                        isHumanMade
                                          ? "block text-[11px] text-[#121212]/60 mt-0.5"
                                          : "block text-xs text-gray-500 mt-0.5"
                                      }
                                    >
                                      {t(
                                        locale,
                                        `滿${currency}${z.freeAbove}免運費`,
                                        `Free over ${currency}${z.freeAbove}`,
                                        `Grátis acima ${currency}${z.freeAbove}`,
                                        `${currency}${z.freeAbove}以上無料`
                                      )}
                                    </span>
                                  )}
                                </span>
                              </span>
                              <span
                                className={
                                  isHumanMade
                                    ? "text-[13px] tabular-nums text-[#121212]"
                                    : "text-sm font-medium text-gray-900"
                                }
                              >
                                {free
                                  ? t(locale, "免費", "Free", "Grátis", "無料")
                                  : `${currency} ${z.fee.toFixed(2)}`}
                              </span>
                            </label>
                          );
                        })
                      )}
                      <FieldError name="zone" />
                    </div>
                  ) : (
                    <div
                      className={`mt-6 ${isHumanMade ? "" : "rounded-lg"} border ${isHumanMade ? "border-[#121212]/15" : "border-gray-200"} p-4 flex items-center justify-between`}
                    >
                      <span
                        className={
                          isHumanMade
                            ? "text-[13px] text-[#121212]"
                            : "text-sm font-medium text-gray-900"
                        }
                      >
                        {t(locale, "門市自取", "Store pickup", "Retirada na loja", "店舗受取")}
                      </span>
                      <span
                        className={
                          isHumanMade
                            ? "text-[13px] tabular-nums text-[#121212]"
                            : "text-sm font-medium text-gray-900"
                        }
                      >
                        {t(locale, "免費", "Free", "Grátis", "無料")}
                      </span>
                    </div>
                  )}
                </section>

                {/* ═══════ PAYMENT ═══════ */}
                <section>
                  <div className="flex items-center gap-2">
                    <h3 className={sectionHeading}>
                      {t(locale, "付款", "Payment", "Pagamento", "支払い")}
                    </h3>
                    <LockClosedIcon
                      className={`size-4 ${isHumanMade ? "text-[#121212]/60" : "text-gray-400"}`}
                    />
                  </div>
                  <p
                    className={
                      isHumanMade
                        ? "mt-2 text-[11px] text-[#121212]/60 tracking-[0.03em]"
                        : "mt-2 text-sm text-gray-500"
                    }
                  >
                    {t(
                      locale,
                      "所有交易均已加密並安全處理。",
                      "All transactions are secure and encrypted.",
                      "Todas as transações são seguras e criptografadas.",
                      "すべての取引は暗号化されています。"
                    )}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { id: "simplepay", label: t(locale, "所有方式", "All methods", "Todos", "すべて") },
                      { id: "mpay", label: "MPay" },
                      { id: "alipay", label: t(locale, "支付寶", "Alipay", "Alipay", "Alipay") },
                      { id: "wechat_pay", label: t(locale, "微信支付", "WeChat Pay", "WeChat Pay", "WeChat Pay") },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentService(pm.id)}
                        className={`${pillBase} ${paymentService === pm.id ? pillOn : pillOff}`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* ═══════ NOTES ═══════ */}
                <section>
                  <label htmlFor="notes" className={labelClass}>
                    {t(locale, "訂單備註（可選）", "Order notes (optional)", "Notas do pedido", "注文備考（任意）")}
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`${inputBase} mt-1`}
                  />
                </section>

                {/* ═══════ SUBMIT ═══════ */}
                <div
                  className={`flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between ${
                    isHumanMade ? "border-t border-[#121212]/15 pt-8" : "pt-6"
                  }`}
                >
                  <a href={`/${locale}/cart`} className={backLink}>
                    <ChevronLeftIcon className="size-4" />
                    {t(locale, "返回購物車", "Return to cart", "Voltar ao carrinho", "カートに戻る")}
                  </a>
                  <button type="submit" disabled={submitting} className={primaryBtn}>
                    {submitting
                      ? "..."
                      : t(locale, "立即付款", "Pay now", "Pagar agora", "今すぐ支払う")}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
