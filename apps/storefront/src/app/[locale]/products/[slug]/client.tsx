"use client";

import ProductOverviewExpandable from "@/components/product/product-overview-expandable";
import { addToCart } from "@/lib/actions/cart";

type Props = {
  product: any;
  locale: string;
  relatedProducts?: any[];
};

export default function ProductDetailClient({ product, locale, relatedProducts = [] }: Props) {
  return (
    <ProductOverviewExpandable
      product={product}
      locale={locale}
      relatedProducts={relatedProducts}
      onAddToCart={async (productId, quantity) => {
        const result = await addToCart(productId, quantity);
        return result;
      }}
    />
  );
}
