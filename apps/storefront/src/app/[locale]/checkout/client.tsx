"use client";

import { useRouter } from "next/navigation";
import CheckoutWithSidebar from "@/components/checkout/checkout-with-sidebar";
import { createOrder } from "@/lib/actions/order";

type Props = {
  items: { id: string; name: string; price: number; quantity: number; image?: string | null }[];
  deliveryZones: { id: string; name: string; fee: number; freeAbove?: number | null }[];
  locale: string;
};

export default function CheckoutClient({ items, deliveryZones, locale }: Props) {
  const router = useRouter();

  return (
    <CheckoutWithSidebar
      items={items}
      deliveryZones={deliveryZones}
      locale={locale}
      onSubmit={async (data) => {
        const result = await createOrder({
          deliveryMethod: data.deliveryMethod as "delivery" | "pickup",
          deliveryZoneId: data.deliveryZoneId,
          paymentMethod: data.paymentMethod,
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

        if (result.success && result.orderNumber) {
          router.push(`/${locale}/checkout/confirmation`);
        }
        return result;
      }}
    />
  );
}
