"use server";

import {
  db,
  shopSettings,
  tenants,
  eq,
  and,
} from "@macau-pos/database";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "./auth-actions";
import { getSelectedLocationId } from "./location-actions";

type ActionResult = {
  success: boolean;
  error?: string;
};

async function requireTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("Unauthorized");
  return session.tenantId;
}

/** Get locationId filter — returns selected location or null (first location's settings) */
async function requireLocationId(): Promise<string | null> {
  return getSelectedLocationId();
}

/** Build where clause for shop_settings scoped to tenant + selected location */
function settingsWhere(tenantId: string, locationId: string | null) {
  const conditions = [eq(shopSettings.tenantId, tenantId)];
  if (locationId) conditions.push(eq(shopSettings.locationId, locationId));
  return and(...conditions);
}

// ─── Update Business Info (per-location) ──────────────────
export async function updateBusinessInfo(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const locationId = await requireLocationId();

    await db
      .update(shopSettings)
      .set({
        shopName: (formData.get("shopName") as string)?.trim() || null,
        address: (formData.get("address") as string)?.trim() || null,
        phone: (formData.get("phone") as string)?.trim() || null,
        email: (formData.get("email") as string)?.trim() || null,
        logo: (formData.get("logo") as string)?.trim() || null,
        updatedAt: new Date(),
      })
      .where(settingsWhere(tenantId, locationId));

    // Also update tenant name if changed
    const shopName = (formData.get("shopName") as string)?.trim();
    if (shopName) {
      await db.update(tenants).set({ name: shopName }).where(eq(tenants.id, tenantId));
    }

    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("updateBusinessInfo error:", err);
    return { success: false, error: "Failed to update business info" };
  }
}

// ─── Update Business Hours (per-location) ─────────────────
export async function updateBusinessHours(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const locationId = await requireLocationId();
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
      .where(settingsWhere(tenantId, locationId));

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("updateBusinessHours error:", err);
    return { success: false, error: "Failed to update business hours" };
  }
}

// ─── Update Payment Methods (per-location) ────────────────
export async function updatePaymentMethods(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const locationId = await requireLocationId();

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
      .where(settingsWhere(tenantId, locationId));

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("updatePaymentMethods error:", err);
    return { success: false, error: "Failed to update payment methods" };
  }
}

// ─── Update Regional Settings (org-wide on tenants table) ──
export async function updateRegionalSettings(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const locationId = await requireLocationId();

    // Currency + locale are now org-wide (on tenants table)
    await db
      .update(tenants)
      .set({
        currency: (formData.get("currency") as string) || "MOP",
        defaultLocale: (formData.get("defaultLocale") as string) || "tc",
      })
      .where(eq(tenants.id, tenantId));

    // Tax rate stays per-location (on shop_settings)
    await db
      .update(shopSettings)
      .set({
        taxRate: (formData.get("taxRate") as string) || "0.00",
        updatedAt: new Date(),
      })
      .where(settingsWhere(tenantId, locationId));

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("updateRegionalSettings error:", err);
    return { success: false, error: "Failed to update regional settings" };
  }
}

// ─── Update Branding (org-wide on tenants table) ──────────
export async function updateBranding(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    await db
      .update(tenants)
      .set({
        accentColor: (formData.get("accentColor") as string) || "#4f6ef7",
        theme: (formData.get("theme") as string) || "light",
      })
      .where(eq(tenants.id, tenantId));

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("updateBranding error:", err);
    return { success: false, error: "Failed to update branding" };
  }
}

// ─── Update Receipt Settings (per-location) ───────────────
export async function updateReceiptSettings(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const locationId = await requireLocationId();

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
      .where(settingsWhere(tenantId, locationId));

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("updateReceiptSettings error:", err);
    return { success: false, error: "Failed to update receipt settings" };
  }
}
