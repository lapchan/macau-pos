import { resolveTenant } from "@/lib/tenant-resolver";
import { getStorefrontConfig } from "@/lib/storefront-queries";
import { notFound } from "next/navigation";
import LoginPageClient from "./client";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const config = await getStorefrontConfig(tenant.id);
  const branding = config.branding as Record<string, unknown>;
  const accentColor = (branding?.accentColor as string) || "#4f46e5";
  const themeId = (branding?.themeId as string) || "modern";

  // Only allow internal paths for `next` to prevent open redirect
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : undefined;

  return (
    <LoginPageClient
      locale={locale}
      tenantName={tenant.name}
      accentColor={accentColor}
      themeId={themeId}
      nextUrl={safeNext}
    />
  );
}
