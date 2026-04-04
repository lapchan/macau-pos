import "server-only";
import {
  db,
  locations,
  shopSettings,
  eq,
  and,
  asc,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";

async function getTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("No active session");
  return session.tenantId;
}

/** Get all active locations for the current tenant */
export async function getLocations() {
  const tenantId = await getTenantId();
  return db
    .select({
      id: locations.id,
      name: locations.name,
      slug: locations.slug,
      code: locations.code,
      address: locations.address,
      phone: locations.phone,
      email: locations.email,
      isDefault: locations.isDefault,
      isActive: locations.isActive,
    })
    .from(locations)
    .where(and(eq(locations.tenantId, tenantId), eq(locations.isActive, true)))
    .orderBy(asc(locations.name));
}

/** Get a single location by ID */
export async function getLocationById(locationId: string) {
  const tenantId = await getTenantId();
  const [location] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.tenantId, tenantId)))
    .limit(1);
  return location ?? null;
}

/** Get location + its shop_settings for the detail page */
export async function getLocationDetail(locationId: string) {
  const tenantId = await getTenantId();

  const [location] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.tenantId, tenantId)))
    .limit(1);

  if (!location) return null;

  const [settings] = await db
    .select({
      shopName: shopSettings.shopName,
      address: shopSettings.address,
      phone: shopSettings.phone,
      email: shopSettings.email,
      logo: shopSettings.logo,
      businessHours: shopSettings.businessHours,
      taxRate: shopSettings.taxRate,
      paymentCash: shopSettings.paymentCash,
      paymentCard: shopSettings.paymentCard,
      paymentMpay: shopSettings.paymentMpay,
      paymentAlipay: shopSettings.paymentAlipay,
      paymentWechat: shopSettings.paymentWechat,
      receiptHeader: shopSettings.receiptHeader,
      receiptFooter: shopSettings.receiptFooter,
      receiptShowAddress: shopSettings.receiptShowAddress,
      receiptShowPhone: shopSettings.receiptShowPhone,
      receiptShowTax: shopSettings.receiptShowTax,
    })
    .from(shopSettings)
    .where(eq(shopSettings.locationId, locationId))
    .limit(1);

  return { location, settings: settings ?? null };
}

export type LocationRow = Awaited<ReturnType<typeof getLocations>>[number];
export type LocationDetail = NonNullable<Awaited<ReturnType<typeof getLocationDetail>>>;
export type LocationSettings = LocationDetail["settings"];
