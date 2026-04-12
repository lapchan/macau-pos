import { resolveTenant } from "@/lib/tenant-resolver";
import { getDeliveryZonesForCheckout, getStorefrontConfig } from "@/lib/storefront-queries";
import { getCart } from "@/lib/actions/cart";
import { getCurrentCustomer } from "@/lib/actions/auth";
import { getAddresses } from "@/lib/actions/account";
import { notFound, redirect } from "next/navigation";
import { db, locations, eq, getDisplayName } from "@macau-pos/database";
import CheckoutClient from "./client";
import CheckoutGate from "./gate";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ guest?: string }>;
}) {
  const { locale } = await params;
  const { guest } = await searchParams;
  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const cart = await getCart();
  if (!cart || cart.items.length === 0) {
    redirect(`/${locale}/cart`);
  }

  // Gate: require login choice unless already logged in or explicitly continuing as guest
  const customer = await getCurrentCustomer();
  if (!customer && guest !== "1") {
    const config = await getStorefrontConfig(tenant.id);
    const branding = config.branding as Record<string, unknown>;
    const themeId = (branding?.themeId as string) || "modern";
    return <CheckoutGate locale={locale} themeId={themeId} />;
  }

  // Load delivery zones
  const locs = await db
    .select()
    .from(locations)
    .where(eq(locations.tenantId, tenant.id))
    .limit(1);

  const deliveryZones = locs.length > 0
    ? await getDeliveryZonesForCheckout(tenant.id, locs[0].id)
    : [];

  const zones = deliveryZones.map((z) => ({
    id: z.id,
    name: ((z.nameTranslations as Record<string, string>)?.[locale]) || z.name,
    fee: parseFloat(String(z.fee)),
    freeAbove: z.freeAbove ? parseFloat(String(z.freeAbove)) : null,
  }));

  const items = cart.items.map((item) => ({
    id: item.id,
    name: getDisplayName(item.name, item.translations, locale),
    price: item.price,
    quantity: item.quantity,
    image: item.image,
  }));

  // Load saved addresses (if logged in)
  const savedAddresses = customer ? await getAddresses() : [];

  return (
    <CheckoutClient
      items={items}
      deliveryZones={zones}
      locale={locale}
      customerEmail={customer?.email || undefined}
      customerPhone={customer?.phone || undefined}
      customerName={customer?.name || undefined}
      savedAddresses={savedAddresses.map((a) => ({
        id: a.id,
        label: a.label,
        recipientName: a.recipientName,
        phone: a.phone,
        addressLine1: a.addressLine1,
        addressLine2: a.addressLine2,
        district: a.district,
        city: a.city,
        isDefault: a.isDefault,
      }))}
    />
  );
}
