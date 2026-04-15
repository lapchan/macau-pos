import "server-only";
import { db, tenants, eq } from "@macau-pos/database";
import { DEMO_TENANT_SLUG } from "@macau-pos/database";
import { headers } from "next/headers";

const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN || "hkretailai.com";
const SHOP_SUBDOMAIN_SUFFIX = `.store.${PLATFORM_DOMAIN}`;

/**
 * Resolve the current tenant from the request hostname.
 *
 * Resolution order:
 *   1. Explicit slug parameter (for direct calls)
 *   2. Tenant subdomain: {slug}.store.hkretailai.com → lookup by slug
 *   3. Custom domain: www.mybrand.com → lookup by custom_domain
 *   4. Fallback: DEMO_TENANT_SLUG (dev / bare domain)
 */
export async function resolveTenant(slug?: string) {
  // 1. Explicit slug
  if (slug) {
    return findBySlug(slug);
  }

  // 2–3. Resolve from hostname.
  // Prefer x-forwarded-host: during server-action internal re-renders
  // Next.js uses the container's loopback hostname in `host`, but passes
  // the real external host via x-forwarded-host. Nginx also sets it.
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") || headersList.get("host") || "";
  const hostname = host.split(":")[0]; // strip port

  // Tenant subdomain: mybrand.store.hkretailai.com
  if (hostname.endsWith(SHOP_SUBDOMAIN_SUFFIX)) {
    const tenantSlug = hostname.replace(SHOP_SUBDOMAIN_SUFFIX, "");
    if (tenantSlug && !tenantSlug.includes(".")) {
      const tenant = await findBySlug(tenantSlug);
      if (tenant) return tenant;
    }
  }

  // Custom domain: any hostname not matching our platform domain
  if (!hostname.endsWith(PLATFORM_DOMAIN) && hostname !== "localhost") {
    const tenant = await findByCustomDomain(hostname);
    if (tenant) return tenant;
  }

  // 4. Fallback for dev / bare domain
  return findBySlug(DEMO_TENANT_SLUG);
}

async function findBySlug(slug: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  return tenant ?? null;
}

async function findByCustomDomain(domain: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.customDomain, domain))
    .limit(1);
  return tenant ?? null;
}
