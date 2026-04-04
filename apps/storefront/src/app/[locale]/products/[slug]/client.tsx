"use client";

import ProductOverview from "@/components/product/product-overview";
import { addToCart } from "@/lib/actions/cart";

type Props = {
  product: any;
  locale: string;
};

export default function ProductDetailClient({ product, locale }: Props) {
  return (
    <ProductOverview
      product={product}
      locale={locale}
      onAddToCart={async (productId, quantity) => {
        const result = await addToCart(productId, quantity);
        return result;
      }}
    />
  );
}
