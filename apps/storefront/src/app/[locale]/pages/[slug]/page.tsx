import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontPage } from "@/lib/storefront-queries";
import { notFound } from "next/navigation";
import RichText from "@/components/sections/rich-text";

export default async function CustomPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const page = await getStorefrontPage(tenant.id, slug);
  if (!page) notFound();

  const title = (page.titleTranslations as Record<string, string>)?.[locale] || page.title;
  const content = (page.contentTranslations as Record<string, unknown[]>)?.[locale] || page.content;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
      <div className="mt-8">
        <RichText
          data={{ content }}
          locale={locale}
          tenantId={tenant.id}
        />
      </div>
    </div>
  );
}
