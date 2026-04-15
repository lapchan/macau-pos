"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CheckoutSplit from "@/components/checkout/checkout-split";
import { createOrder } from "@/lib/actions/order";

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
  items: { id: string; name: string; price: number; quantity: number; image?: string | null }[];
  deliveryZones: { id: string; name: string; fee: number; freeAbove?: number | null }[];
  locale: string;
  themeId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  savedAddresses?: SavedAddress[];
};

const redirectingCopy: Record<string, { title: string; subtitle: string }> = {
  en: { title: "Redirecting to payment…", subtitle: "Please don't close or refresh this window." },
  tc: { title: "正在前往付款頁面…", subtitle: "請勿關閉或重新整理此頁面。" },
  sc: { title: "正在前往付款页面…", subtitle: "请勿关闭或刷新此页面。" },
  pt: { title: "A redirecionar para o pagamento…", subtitle: "Não feche nem atualize esta janela." },
  ja: { title: "決済ページへ移動中…", subtitle: "このページを閉じたり更新したりしないでください。" },
};

export default function CheckoutClient({ items, deliveryZones, locale, themeId, customerEmail, customerPhone, customerName, savedAddresses = [] }: Props) {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const copy = redirectingCopy[locale] ?? redirectingCopy.en;

  return (
    <>
      <CheckoutSplit
        items={items}
        deliveryZones={deliveryZones}
        locale={locale}
        themeId={themeId}
        customerEmail={customerEmail}
        customerPhone={customerPhone}
        customerName={customerName}
        savedAddresses={savedAddresses}
        onSubmit={async (data) => {
          const result = await createOrder({
            deliveryMethod: data.deliveryMethod as "delivery" | "pickup",
            deliveryZoneId: data.deliveryZoneId,
            paymentService: data.paymentService,
            locale,
            shippingAddress: data.deliveryMethod === "delivery" ? {
              recipientName: data.recipientName,
              phone: data.phone,
              addressLine1: data.address,
              district: data.district,
              city: "Macau",
            } : undefined,
            contactEmail: data.contact,
            notes: data.notes,
          });

          if (result.success && "paymentUrl" in result && result.paymentUrl) {
            setRedirecting(true);
            window.location.href = result.paymentUrl;
            // Block the form's promise until the navigation actually happens so
            // the CheckoutSplit submitting state never clears and the overlay
            // stays up.
            await new Promise(() => {});
            return result;
          }
          if (result.success && result.orderNumber) {
            router.push(`/${locale}/checkout/confirmation?order=${result.orderNumber}`);
          }
          return result;
        }}
      />

      {redirecting && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[var(--tenant-accent,#4f46e5)]" />
            <div className="text-lg font-medium text-slate-900">{copy.title}</div>
            <div className="text-sm text-slate-500">{copy.subtitle}</div>
          </div>
        </div>
      )}
    </>
  );
}
