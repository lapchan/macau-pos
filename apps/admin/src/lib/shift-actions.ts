"use server";

import {
  db,
  shifts,
  eq,
  and,
} from "@macau-pos/database";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "./auth-actions";

type ActionResult = { success: boolean; error?: string };

async function requireTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("Unauthorized");
  return session.tenantId;
}

export async function approveShift(shiftId: string): Promise<ActionResult> {
  try {
    const session = await getAuthSession();
    if (!session?.tenantId || !session.userId) return { success: false, error: "Unauthorized" };

    await db
      .update(shifts)
      .set({
        status: "closed",
        approvedBy: session.userId,
        approvedAt: new Date(),
      })
      .where(and(eq(shifts.id, shiftId), eq(shifts.tenantId, session.tenantId)));

    revalidatePath("/shifts");
    return { success: true };
  } catch (err) {
    console.error("approveShift error:", err);
    return { success: false, error: "Failed to approve shift" };
  }
}

export async function flagShift(shiftId: string, notes?: string): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    await db
      .update(shifts)
      .set({
        status: "flagged",
        notes: notes || null,
      })
      .where(and(eq(shifts.id, shiftId), eq(shifts.tenantId, tenantId)));

    revalidatePath("/shifts");
    return { success: true };
  } catch (err) {
    console.error("flagShift error:", err);
    return { success: false, error: "Failed to flag shift" };
  }
}

export async function fetchFilteredShifts(filters: { status?: string; cashierId?: string; dateFrom?: string; dateTo?: string }) {
  const { getShifts } = await import("./shift-queries");
  return getShifts(filters);
}

export async function fetchCashLog(shiftId: string) {
  const { getCashLogForShift } = await import("./shift-queries");
  return getCashLogForShift(shiftId);
}
