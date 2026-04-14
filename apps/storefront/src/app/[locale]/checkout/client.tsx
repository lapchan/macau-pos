"use client";

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

export default function CheckoutClient({ items, deliveryZones, locale, themeId, customerEmail, customerPhone, customerName, savedAddresses = [] }: Props) {
  const router = useRouter();

  return (
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

        // On success, hand off to Intellipay's hosted page.
        // Fallback to confirmation page if no payment_url (shouldn't happen).
        if (result.success && "paymentUrl" in result && result.paymentUrl) {
          window.location.href = result.paymentUrl;
          return result;
        }
        if (result.success && result.orderNumber) {
          router.push(`/${locale}/checkout/confirmation?order=${result.orderNumber}`);
        }
        return result;
      }}
    />
  );
}
