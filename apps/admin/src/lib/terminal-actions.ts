"use server";

import {
  db,
  terminals,
  eq,
  and,
  sql,
} from "@macau-pos/database";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "./auth-actions";
import { getSelectedLocationId } from "./location-actions";

type ActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string; code?: string; activationCode?: string };
};

async function requireTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("No active session");
  return session.tenantId;
}

const ACTIVATION_CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateActivationCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ACTIVATION_CHARSET[Math.floor(Math.random() * ACTIVATION_CHARSET.length)];
  }
  return code;
}

// ─── Create Terminal ──────────────────────────────────────
export async function createTerminal(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const locationId = await getSelectedLocationId();

    const name = (formData.get("name") as string)?.trim();
    const location = (formData.get("location") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    // Allow explicit locationId from form, or fall back to selected location
    const formLocationId = (formData.get("locationId") as string) || locationId;

    if (!name) return { success: false, error: "Terminal name is required" };
    if (!formLocationId) return { success: false, error: "Please select a location first" };

    // Auto-increment code: find max existing code for this tenant
    const [maxResult] = await db
      .select({
        maxCode: sql<string>`MAX(${terminals.code})`,
      })
      .from(terminals)
      .where(eq(terminals.tenantId, tenantId));

    let nextNum = 1;
    if (maxResult?.maxCode) {
      const match = maxResult.maxCode.match(/T-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const code = `T-${String(nextNum).padStart(3, "0")}`;

    const activationCode = generateActivationCode();

    const [result] = await db
      .insert(terminals)
      .values({
        tenantId,
        locationId: formLocationId,
        name,
        code,
        activationCode,
        location,
        notes,
      })
      .returning({ id: terminals.id });

    revalidatePath("/terminals");
    return { success: true, data: { id: result.id, code, activationCode } };
  } catch (err) {
    console.error("createTerminal error:", err);
    return { success: false, error: "Failed to create terminal" };
  }
}

// ─── Update Terminal ──────────────────────────────────────
export async function updateTerminal(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "Terminal ID missing" };

    const name = (formData.get("name") as string)?.trim();
    if (!name) return { success: false, error: "Terminal name is required" };

    const location = (formData.get("location") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;

    await db
      .update(terminals)
      .set({
        name,
        location,
        notes,
        updatedAt: new Date(),
      })
      .where(and(eq(terminals.id, id), eq(terminals.tenantId, tenantId)));

    revalidatePath("/terminals");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateTerminal error:", err);
    return { success: false, error: "Failed to update terminal" };
  }
}

// ─── Delete Terminal ──────────────────────────────────────
export async function deleteTerminal(terminalId: string): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    await db
      .delete(terminals)
      .where(and(eq(terminals.id, terminalId), eq(terminals.tenantId, tenantId)));

    revalidatePath("/terminals");
    return { success: true };
  } catch (err) {
    console.error("deleteTerminal error:", err);
    return { success: false, error: "Failed to delete terminal" };
  }
}

// ─── Set Terminal Status ──────────────────────────────────
export async function setTerminalStatus(
  terminalId: string,
  status: "active" | "disabled" | "maintenance"
): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    // Clear current user when disabling
    if (status === "disabled") {
      updateData.currentUserId = null;
    }

    await db
      .update(terminals)
      .set(updateData)
      .where(and(eq(terminals.id, terminalId), eq(terminals.tenantId, tenantId)));

    revalidatePath("/terminals");
    return { success: true };
  } catch (err) {
    console.error("setTerminalStatus error:", err);
    return { success: false, error: "Failed to update terminal status" };
  }
}

// ─── Unlink Device ──────────────────────────────────────
export async function unlinkTerminal(
  terminalId: string
): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    const activationCode = generateActivationCode();

    await db
      .update(terminals)
      .set({
        activatedAt: null,
        deviceInfo: null,
        lastHeartbeatAt: null,
        activationCode,
        updatedAt: new Date(),
      })
      .where(and(eq(terminals.id, terminalId), eq(terminals.tenantId, tenantId)));

    revalidatePath("/terminals");
    return { success: true, data: { id: terminalId, activationCode } };
  } catch (err) {
    console.error("unlinkTerminal error:", err);
    return { success: false, error: "Failed to unlink terminal" };
  }
}

// ─── Regenerate Activation Code ───────────────────────────
export async function regenerateActivationCode(
  terminalId: string
): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    const activationCode = generateActivationCode();

    await db
      .update(terminals)
      .set({
        activationCode,
        updatedAt: new Date(),
      })
      .where(and(eq(terminals.id, terminalId), eq(terminals.tenantId, tenantId)));

    revalidatePath("/terminals");
    return { success: true, data: { id: terminalId, activationCode } };
  } catch (err) {
    console.error("regenerateActivationCode error:", err);
    return { success: false, error: "Failed to regenerate activation code" };
  }
}
