import "server-only";
import { db, tenants, eq } from "@macau-pos/database";
import { DEMO_TENANT_SLUG } from "@macau-pos/database";

export async function resolveTenant(slug?: string) {
  const tenantSlug = slug || DEMO_TENANT_SLUG;

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  return tenant ?? null;
}
