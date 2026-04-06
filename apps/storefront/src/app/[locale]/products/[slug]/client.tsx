"use client";

import ProductOverviewExpandable from "@/components/product/product-overview-expandable";
import { addToCart } from "@/lib/actions/cart";

type Props = {
  product: any;
  locale: string;
  relatedProducts?: any[];
  themeId?: string;
};

export default function ProductDetailClient({ product, locale, relatedProducts = [], themeId }: Props) {
  return (
    <ProductOverviewExpandable
      product={product}
      locale={locale}
      relatedProducts={relatedProducts}
      themeId={themeId}
      onAddToCart={async (productId, quantity) => {
        const result = await addToCart(productId, quantity);
        return result;
      }}
    />
  );
}
