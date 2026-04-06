import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontConfig } from "@/lib/storefront-queries";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import RegisterPageClient from "./client";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const config = await getStorefrontConfig(tenant.id);
  const branding = config.branding as Record<string, unknown>;
  const themeId = (branding?.themeId as string) || "modern";

  // Default theme: passwordless system — registration is automatic on first login
  if (themeId !== "humanmade") {
    redirect(`/${locale}/login`);
  }

  return (
    <RegisterPageClient
      locale={locale}
      themeId={themeId}
    />
  );
}
