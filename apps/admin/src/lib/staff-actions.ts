"use server";

import {
  db,
  users,
  userLocations,
  eq,
  and,
  isNull,
  hashPassword,
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

// ─── Create Staff ──────────────────────────────────────────
export async function createStaff(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const role = (formData.get("role") as string) || "merchant_owner";
    const posRole = (formData.get("posRole") as string) || null;
    const pin = (formData.get("pin") as string)?.trim() || null;
    const password = (formData.get("password") as string) || null;

    if (!name) return { success: false, error: "Name is required" };
    if (!email && !phone) return { success: false, error: "Email or phone is required" };

    // Hash password if provided
    const passwordHash = password ? await hashPassword(password) : await hashPassword("demo1234");

    // Hash PIN if provided
    const pinHash = pin && pin.length >= 4 ? await hashPassword(pin) : null;

    const [result] = await db
      .insert(users)
      .values({
        tenantId,
        name,
        email,
        phone,
        role: role as "merchant_owner" | "cashier" | "accountant" | "promoter",
        posRole: posRole as "store_manager" | null,
        passwordHash,
        pin: pinHash,
        isActive: true,
      })
      .returning({ id: users.id });

    // Assign locations (merchant_owner gets implicit all-access, no rows needed)
    const locationIds = (formData.get("locationIds") as string)?.split(",").filter(Boolean) || [];
    if (locationIds.length > 0 && role !== "merchant_owner") {
      await db.insert(userLocations).values(
        locationIds.map((locId) => ({ userId: result.id, locationId: locId }))
      );
    }

    revalidatePath("/staff");
    return { success: true, data: { id: result.id } };
  } catch (err: any) {
    console.error("createStaff error:", err);
    if (err?.code === "23505") return { success: false, error: "Email or phone already exists" };
    return { success: false, error: "Failed to create staff member" };
  }
}

// ─── Update Staff ──────────────────────────────────────────
export async function updateStaff(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "Staff ID missing" };

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { success: false, error: "Name is required" };

    const posRoleVal = (formData.get("posRole") as string) || null;

    const updateData: Record<string, any> = {
      name,
      email: (formData.get("email") as string)?.trim() || null,
      phone: (formData.get("phone") as string)?.trim() || null,
      role: (formData.get("role") as string) || "merchant_owner",
      posRole: posRoleVal || null,
      isActive: formData.get("isActive") === "true",
      updatedAt: new Date(),
    };

    // Update PIN if provided (hash it)
    const pin = (formData.get("pin") as string)?.trim();
    if (pin && pin.length >= 4) {
      updateData.pin = await hashPassword(pin);
    }

    // Update password if provided
    const password = (formData.get("password") as string);
    if (password && password.length >= 6) {
      updateData.passwordHash = await hashPassword(password);
    }

    await db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), eq(users.tenantId, tenantId)));

    // Update location assignments
    const locationIds = (formData.get("locationIds") as string)?.split(",").filter(Boolean) || [];
    const currentRole = updateData.role as string;

    // Delete old assignments
    await db.delete(userLocations).where(eq(userLocations.userId, id));

    // Insert new (skip for merchant_owner — implicit all-access)
    if (locationIds.length > 0 && currentRole !== "merchant_owner") {
      await db.insert(userLocations).values(
        locationIds.map((locId) => ({ userId: id, locationId: locId }))
      );
    }

    revalidatePath("/staff");
    return { success: true, data: { id } };
  } catch (err: any) {
    console.error("updateStaff error:", err);
    if (err?.code === "23505") return { success: false, error: "Email or phone already exists" };
    return { success: false, error: "Failed to update staff member" };
  }
}

// ─── Delete Staff (soft) ───────────────────────────────────
export async function deleteStaff(id: string): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    await db
      .update(users)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.tenantId, tenantId), isNull(users.deletedAt)));

    revalidatePath("/staff");
    return { success: true };
  } catch (err) {
    console.error("deleteStaff error:", err);
    return { success: false, error: "Failed to delete staff member" };
  }
}

// ─── Toggle Staff Active ───────────────────────────────────
export async function toggleStaffActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.tenantId, tenantId)));

    revalidatePath("/staff");
    return { success: true };
  } catch (err) {
    console.error("toggleStaffActive error:", err);
    return { success: false, error: "Failed to update status" };
  }
}
