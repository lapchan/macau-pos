"use server";

import {
  db,
  pricingStrategies,
  pricingStrategyItems,
  locations,
  eq,
  and,
} from "@macau-pos/database";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "./auth-actions";

type ActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string };
};

async function requireTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("Unauthorized");
  return session.tenantId;
}

// ─── Strategy CRUD ───────────────────────────────────────

export async function createStrategy(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const name = (formData.get("name") as string)?.trim();
    if (!name) return { success: false, error: "Strategy name is required" };

    const description = (formData.get("description") as string)?.trim() || null;

    const [result] = await db
      .insert(pricingStrategies)
      .values({ tenantId, name, description })
      .returning({ id: pricingStrategies.id });

    revalidatePath("/pricing-strategies");
    return { success: true, data: { id: result.id } };
  } catch (err: any) {
    if (err?.constraint?.includes("tenant_name")) {
      return { success: false, error: "A strategy with this name already exists" };
    }
    console.error("createStrategy error:", err);
    return { success: false, error: "Failed to create strategy" };
  }
}

export async function updateStrategy(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "Strategy ID missing" };

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { success: false, error: "Strategy name is required" };

    const description = (formData.get("description") as string)?.trim() || null;

    await db
      .update(pricingStrategies)
      .set({ name, description, updatedAt: new Date() })
      .where(and(eq(pricingStrategies.id, id), eq(pricingStrategies.tenantId, tenantId)));

    revalidatePath("/pricing-strategies");
    revalidatePath(`/pricing-strategies/${id}`);
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateStrategy error:", err);
    return { success: false, error: "Failed to update strategy" };
  }
}

export async function deleteStrategy(strategyId: string): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    // Clear strategy assignment from locations first
    await db
      .update(locations)
      .set({ pricingStrategyId: null })
      .where(and(eq(locations.pricingStrategyId, strategyId), eq(locations.tenantId, tenantId)));

    await db
      .delete(pricingStrategies)
      .where(and(eq(pricingStrategies.id, strategyId), eq(pricingStrategies.tenantId, tenantId)));

    revalidatePath("/pricing-strategies");
    revalidatePath("/locations");
    return { success: true };
  } catch (err) {
    console.error("deleteStrategy error:", err);
    return { success: false, error: "Failed to delete strategy" };
  }
}

// ─── Strategy Item CRUD ──────────────────────────────────

export async function upsertStrategyItem(formData: FormData): Promise<ActionResult> {
  try {
    const strategyId = formData.get("strategyId") as string;
    const productId = formData.get("productId") as string;
    if (!strategyId || !productId) return { success: false, error: "Missing IDs" };

    const sellingPrice = (formData.get("sellingPrice") as string)?.trim() || null;
    const originalPrice = (formData.get("originalPrice") as string)?.trim() || null;
    const stockStr = (formData.get("stock") as string)?.trim();
    const stock = stockStr ? parseInt(stockStr, 10) : null;
    const isAvailable = formData.get("isAvailable") !== "false";

    // Check if item already exists
    const [existing] = await db
      .select({ id: pricingStrategyItems.id })
      .from(pricingStrategyItems)
      .where(
        and(
          eq(pricingStrategyItems.strategyId, strategyId),
          eq(pricingStrategyItems.productId, productId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(pricingStrategyItems)
        .set({
          sellingPrice,
          originalPrice,
          stock,
          isAvailable,
          updatedAt: new Date(),
        })
        .where(eq(pricingStrategyItems.id, existing.id));
    } else {
      await db.insert(pricingStrategyItems).values({
        strategyId,
        productId,
        sellingPrice,
        originalPrice,
        stock,
        isAvailable,
      });
    }

    revalidatePath(`/pricing-strategies/${strategyId}`);
    return { success: true };
  } catch (err) {
    console.error("upsertStrategyItem error:", err);
    return { success: false, error: "Failed to save item override" };
  }
}

export async function removeStrategyItem(itemId: string, strategyId: string): Promise<ActionResult> {
  try {
    await db.delete(pricingStrategyItems).where(eq(pricingStrategyItems.id, itemId));
    revalidatePath(`/pricing-strategies/${strategyId}`);
    return { success: true };
  } catch (err) {
    console.error("removeStrategyItem error:", err);
    return { success: false, error: "Failed to remove item override" };
  }
}

// ─── Location Strategy Assignment ────────────────────────

export async function updateLocationStrategy(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const locationId = formData.get("locationId") as string;
    if (!locationId) return { success: false, error: "Location ID missing" };

    const strategyId = (formData.get("strategyId") as string) || null;

    await db
      .update(locations)
      .set({ pricingStrategyId: strategyId, updatedAt: new Date() })
      .where(and(eq(locations.id, locationId), eq(locations.tenantId, tenantId)));

    revalidatePath(`/locations/${locationId}`);
    revalidatePath("/locations");
    return { success: true };
  } catch (err) {
    console.error("updateLocationStrategy error:", err);
    return { success: false, error: "Failed to update pricing strategy" };
  }
}
