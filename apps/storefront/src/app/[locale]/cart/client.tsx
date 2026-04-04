"use client";

import CartPageView from "@/components/cart/cart-page-view";
import { updateCartItemQuantity, removeCartItem } from "@/lib/actions/cart";
import { useRouter } from "next/navigation";

type CartItemData = {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  inStock: boolean;
  maxQuantity?: number;
};

export default function CartPageClient({
  items,
  locale,
}: {
  items: CartItemData[];
  locale: string;
}) {
  const router = useRouter();

  return (
    <CartPageView
      items={items}
      locale={locale}
      onUpdateQuantity={async (id, quantity) => {
        await updateCartItemQuantity(id, quantity);
        router.refresh();
      }}
      onRemove={async (id) => {
        await removeCartItem(id);
        router.refresh();
      }}
    />
  );
}
