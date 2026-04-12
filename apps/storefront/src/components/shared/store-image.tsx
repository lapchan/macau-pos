import Image, { type ImageProps } from "next/image";
import { resolveStorefrontImage } from "@/lib/resolve-image";

export default function StoreImage(props: ImageProps) {
  const src = typeof props.src === "string" ? resolveStorefrontImage(props.src) : props.src;
  return <Image {...props} src={src} />;
}
