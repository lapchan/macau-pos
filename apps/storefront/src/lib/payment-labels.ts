type LocalizedLabel = {
  tc: string;
  sc: string;
  en: string;
  pt: string;
  ja: string;
};

const LABELS: Record<string, LocalizedLabel> = {
  simplepay: {
    tc: "信用卡 / 銀聯",
    sc: "信用卡 / 银联",
    en: "Credit Card",
    pt: "Cartão de Crédito",
    ja: "クレジットカード",
  },
  mpay: { tc: "MPay", sc: "MPay", en: "MPay", pt: "MPay", ja: "MPay" },
  alipay: {
    tc: "支付寶",
    sc: "支付宝",
    en: "Alipay",
    pt: "Alipay",
    ja: "Alipay",
  },
  wechat_pay: {
    tc: "微信支付",
    sc: "微信支付",
    en: "WeChat Pay",
    pt: "WeChat Pay",
    ja: "WeChat Pay",
  },
  visa: { tc: "Visa", sc: "Visa", en: "Visa", pt: "Visa", ja: "Visa" },
  mastercard: {
    tc: "Mastercard",
    sc: "Mastercard",
    en: "Mastercard",
    pt: "Mastercard",
    ja: "Mastercard",
  },
};

const ONLINE_FALLBACK: LocalizedLabel = {
  tc: "網上付款",
  sc: "网上付款",
  en: "Online payment",
  pt: "Pagamento online",
  ja: "オンライン支払い",
};

/**
 * Resolve a localized payment label from either an intellipay payment_service
 * (simplepay / mpay / alipay / wechat_pay / visa / mastercard) or a method
 * enum value (online / cash / tap / insert / qr). Falls back to the raw
 * service code so we never silently drop information.
 */
export function getPaymentLabel(
  locale: string,
  paymentService: string | null | undefined,
  fallbackMethod: string | null | undefined,
): string {
  const lookup = paymentService ?? fallbackMethod ?? "";
  const entry = LABELS[lookup];
  const lang = (locale in ONLINE_FALLBACK ? locale : "en") as keyof LocalizedLabel;
  if (entry) return entry[lang];
  if (fallbackMethod === "online" || paymentService === "online") {
    return ONLINE_FALLBACK[lang];
  }
  return lookup || ONLINE_FALLBACK[lang];
}
