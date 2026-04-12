import Image, { type ImageProps } from "next/image";
import { resolveStorefrontThumb } from "@/lib/resolve-image";

export default function StoreThumb(props: ImageProps) {
  const src = typeof props.src === "string" ? resolveStorefrontThumb(props.src) : props.src;
  return <Image {...props} src={src} />;
}
