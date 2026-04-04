import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontConfig } from "@/lib/storefront-queries";
import { notFound } from "next/navigation";
import LoginPageClient from "./client";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const config = await getStorefrontConfig(tenant.id);
  const branding = config.branding as Record<string, unknown>;
  const accentColor = (branding?.accentColor as string) || "#4f46e5";

  return (
    <LoginPageClient
      locale={locale}
      tenantName={tenant.name}
      accentColor={accentColor}
    />
  );
}
