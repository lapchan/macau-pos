import { resolveTenant } from "@/lib/tenant-resolver";
import { getDeliveryZonesForCheckout } from "@/lib/storefront-queries";
import { notFound } from "next/navigation";
import CheckoutForm from "@/components/checkout/checkout-form";
import { db, locations, eq } from "@macau-pos/database";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  // Get first location for delivery zones
  const locs = await db
    .select()
    .from(locations)
    .where(eq(locations.tenantId, tenant.id))
    .limit(1);

  const deliveryZones = locs.length > 0
    ? await getDeliveryZonesForCheckout(tenant.id, locs[0].id)
    : [];

  // Map delivery zones to the format CheckoutForm expects
  const zones = deliveryZones.map((z) => ({
    id: z.id,
    name: ((z.nameTranslations as Record<string, string>)?.[locale]) || z.name,
    fee: parseFloat(String(z.fee)),
    minOrder: parseFloat(String(z.minOrder)),
    freeAbove: z.freeAbove ? parseFloat(String(z.freeAbove)) : null,
    estimatedMinutes: z.estimatedMinutes,
  }));

  // TODO: Load cart subtotal from DB
  const subtotal = 0;

  return (
    <CheckoutForm
      locale={locale}
      deliveryZones={zones}
      subtotal={subtotal}
    />
  );
}
