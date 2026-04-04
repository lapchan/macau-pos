import { redirect } from "next/navigation";

// Category pages redirect to /products?category=slug
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  redirect(`/${locale}/products?category=${slug}`);
}
