"use client";

import ProductOverviewExpandable from "@/components/product/product-overview-expandable";
import { addToCart } from "@/lib/actions/cart";

type ColorVariant = {
  id: string;
  name: string;
  colorName: string | null;
  image: string | null;
  images: { url: string; alt?: string }[];
  stock: number | null;
  price: number;
  isCurrent: boolean;
};

type Props = {
  product: any;
  locale: string;
  relatedProducts?: any[];
  colorVariants?: ColorVariant[];
  themeId?: string;
};

export default function ProductDetailClient({ product, locale, relatedProducts = [], colorVariants = [], themeId }: Props) {
  return (
    <ProductOverviewExpandable
      product={product}
      locale={locale}
      relatedProducts={relatedProducts}
      colorVariants={colorVariants}
      themeId={themeId}
      onAddToCart={async (productId, quantity) => {
        const result = await addToCart(productId, quantity);
        return result;
      }}
    />
  );
}
