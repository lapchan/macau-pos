import { Banknote, CreditCard, QrCode } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Maps payment method DB values to i18n translation keys */
export const PAYMENT_METHOD_KEYS: Record<string, string> = {
  cash: "paymentCash",
  tap: "paymentCardTap",
  insert: "paymentCardInsert",
  qr: "paymentQr",
};

/** Maps payment method DB values to lucide icon components */
export const PAYMENT_METHOD_ICONS: Record<string, LucideIcon> = {
  cash: Banknote,
  tap: CreditCard,
  insert: CreditCard,
  qr: QrCode,
};

/** Order status → Tailwind color classes */
export const STATUS_COLORS: Record<string, string> = {
  new: "bg-pos-accent-light text-pos-accent border-pos-accent/30",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  refunded: "bg-red-50 text-red-700 border-red-200",
  voided: "bg-gray-100 text-gray-500 border-gray-200",
};
