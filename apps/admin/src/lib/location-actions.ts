"use server";

import { cookies } from "next/headers";
import {
  db,
  locations,
  shopSettings,
  eq,
  and,
} from "@macau-pos/database";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "./auth-actions";

const LOCATION_COOKIE = "admin_location_id";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

type ActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string };
};

async function requireTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("No active session");
  return session.tenantId;
}

// ─── Cookie-based Location Selection ──────────────────────

/** Set the selected location ID in a cookie */
export async function setSelectedLocation(locationId: string | null) {
  const cookieStore = await cookies();
  if (locationId) {
    cookieStore.set(LOCATION_COOKIE, locationId, {
      httpOnly: false, // Readable by client for optimistic UI
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
  } else {
    cookieStore.delete(LOCATION_COOKIE);
  }
}

/** Get the selected location ID from cookie (server-side).
 *  Validates the cookie value exists in the DB — ignores stale values. */
export async function getSelectedLocationId(): Promise<string | null> {
  const cookieStore = await cookies();
  const locationId = cookieStore.get(LOCATION_COOKIE)?.value ?? null;
  if (!locationId) return null;

  // Validate location exists
  const [exists] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1);

  if (!exists) return null;

  return locationId;
}

// ─── Location CRUD ────────────────────────────────────────

/** Create a new location */
export async function createLocation(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    const name = (formData.get("name") as string)?.trim();
    const slug = (formData.get("slug") as string)?.trim().toLowerCase();
    const address = (formData.get("address") as string)?.trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const email = (formData.get("email") as string)?.trim() || null;

    if (!name) return { success: false, error: "Location name is required" };
    if (!slug) return { success: false, error: "Location slug is required" };

    // Auto-increment code: L-001, L-002, ...
    const existing = await db
      .select({ code: locations.code })
      .from(locations)
      .where(eq(locations.tenantId, tenantId));

    let maxNum = 0;
    for (const loc of existing) {
      const match = loc.code.match(/L-(\d+)/);
      if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
    }
    const code = `L-${String(maxNum + 1).padStart(3, "0")}`;

    const [result] = await db
      .insert(locations)
      .values({
        tenantId,
        name,
        slug,
        code,
        address,
        phone,
        email,
        isDefault: false,
      })
      .returning({ id: locations.id });

    revalidatePath("/locations");
    revalidatePath("/");
    return { success: true, data: { id: result.id } };
  } catch (err) {
    console.error("createLocation error:", err);
    return { success: false, error: "Failed to create location" };
  }
}

/** Update an existing location */
export async function updateLocation(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "Location ID missing" };

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { success: false, error: "Location name is required" };

    const address = (formData.get("address") as string)?.trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const email = (formData.get("email") as string)?.trim() || null;

    await db
      .update(locations)
      .set({ name, address, phone, email, updatedAt: new Date() })
      .where(and(eq(locations.id, id), eq(locations.tenantId, tenantId)));

    revalidatePath("/locations");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateLocation error:", err);
    return { success: false, error: "Failed to update location" };
  }
}

/** Toggle location active/inactive */
export async function toggleLocationActive(
  locationId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    await db
      .update(locations)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(locations.id, locationId), eq(locations.tenantId, tenantId)));

    revalidatePath("/locations");
    return { success: true };
  } catch (err) {
    console.error("toggleLocationActive error:", err);
    return { success: false, error: "Failed to update location status" };
  }
}

// ─── Location Detail Actions ─────────────────────────────

/** Update location basic info (name, nickname/slug, address, phone, email) */
export async function updateLocationInfo(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "Location ID missing" };

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { success: false, error: "Location name is required" };

    const address = (formData.get("address") as string)?.trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const email = (formData.get("email") as string)?.trim() || null;

    // Update location table
    await db
      .update(locations)
      .set({ name, address, phone, email, updatedAt: new Date() })
      .where(and(eq(locations.id, id), eq(locations.tenantId, tenantId)));

    // Also update shop_settings display name
    await db
      .update(shopSettings)
      .set({
        shopName: name,
        address: address,
        phone: phone,
        email: email,
        updatedAt: new Date(),
      })
      .where(eq(shopSettings.locationId, id));

    revalidatePath(`/locations/${id}`);
    revalidatePath("/locations");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateLocationInfo error:", err);
    return { success: false, error: "Failed to update location info" };
  }
}

/** Update location business hours */
export async function updateLocationHours(formData: FormData): Promise<ActionResult> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "Location ID missing" };

    const hoursJson = formData.get("businessHours") as string;
    let hours;
    try {
      hours = JSON.parse(hoursJson);
    } catch {
      return { success: false, error: "Invalid business hours format" };
    }

    await db
      .update(shopSettings)
      .set({ businessHours: hours, updatedAt: new Date() })
      .where(eq(shopSettings.locationId, id));

    revalidatePath(`/locations/${id}`);
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateLocationHours error:", err);
    return { success: false, error: "Failed to update business hours" };
  }
}

/** Update location payment methods */
export async function updateLocationPayments(formData: FormData): Promise<ActionResult> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "Location ID missing" };

    await db
      .update(shopSettings)
      .set({
        paymentCash: formData.get("paymentCash") === "true",
        paymentCard: formData.get("paymentCard") === "true",
        paymentMpay: formData.get("paymentMpay") === "true",
        paymentAlipay: formData.get("paymentAlipay") === "true",
        paymentWechat: formData.get("paymentWechat") === "true",
        updatedAt: new Date(),
      })
      .where(eq(shopSettings.locationId, id));

    revalidatePath(`/locations/${id}`);
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateLocationPayments error:", err);
    return { success: false, error: "Failed to update payment methods" };
  }
}

/** Update location receipt settings */
export async function updateLocationReceipt(formData: FormData): Promise<ActionResult> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "Location ID missing" };

    await db
      .update(shopSettings)
      .set({
        receiptHeader: (formData.get("receiptHeader") as string)?.trim() || null,
        receiptFooter: (formData.get("receiptFooter") as string)?.trim() || null,
        receiptShowAddress: formData.get("receiptShowAddress") === "true",
        receiptShowPhone: formData.get("receiptShowPhone") === "true",
        receiptShowTax: formData.get("receiptShowTax") === "true",
        updatedAt: new Date(),
      })
      .where(eq(shopSettings.locationId, id));

    revalidatePath(`/locations/${id}`);
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateLocationReceipt error:", err);
    return { success: false, error: "Failed to update receipt settings" };
  }
}

/** Ensure a shop_settings row exists for a location (create if missing) */
export async function ensureLocationSettings(locationId: string): Promise<void> {
  const tenantId = await requireTenantId();

  const [existing] = await db
    .select({ id: shopSettings.id })
    .from(shopSettings)
    .where(eq(shopSettings.locationId, locationId))
    .limit(1);

  if (!existing) {
    const [loc] = await db
      .select({ name: locations.name, address: locations.address, phone: locations.phone, email: locations.email })
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1);

    await db.insert(shopSettings).values({
      tenantId,
      locationId,
      shopName: loc?.name ?? null,
      address: loc?.address ?? null,
      phone: loc?.phone ?? null,
      email: loc?.email ?? null,
    });
  }
}
