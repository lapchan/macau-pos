"use server";

import { db, orders, eq, and, sql } from "@macau-pos/database";
import { resolveTenant } from "@/lib/tenant-resolver";

export type OrderLookupResult =
  | { success: true; orderNumber: string }
  | { success: false; error: string };

/**
 * Look up an order for a guest by order number + last digits of phone.
 * Returns the order number on success so the caller can navigate to the
 * confirmation page; never returns the full order body to avoid leaking
 * details if the lookup is wrong.
 *
 * Pickup orders without a shipping address can't be looked up this way —
 * the customer needs to sign in instead. We surface that as a specific
 * error so the UI can show the right hint.
 */
export async function lookupOrder(
  formData: FormData,
): Promise<OrderLookupResult> {
  const orderNumber = String(formData.get("orderNumber") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!orderNumber || !phone) {
    return { success: false, error: "Please enter both order number and phone." };
  }

  const tenant = await resolveTenant();
  if (!tenant) {
    return { success: false, error: "Store not found." };
  }

  // Match the last 6 digits of the phone to dodge formatting differences
  // (+853 spaces, dashes, etc.). 6 digits is enough entropy with a real
  // order number to prevent enumeration but tolerant of the user typing
  // their phone slightly differently than at checkout.
  const last6 = phone.replace(/\D/g, "").slice(-6);
  if (last6.length < 4) {
    return { success: false, error: "Phone number is too short." };
  }

  const [row] = await db
    .select({
      orderNumber: orders.orderNumber,
      shippingAddress: orders.shippingAddress,
    })
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, tenant.id),
        eq(orders.orderNumber, orderNumber),
        eq(orders.channel, "online"),
        sql`${orders.shippingAddress} IS NOT NULL`,
        sql`regexp_replace(${orders.shippingAddress}->>'phone', '\\D', '', 'g') LIKE ${"%" + last6}`,
      ),
    )
    .limit(1);

  if (!row) {
    return {
      success: false,
      error: "We couldn't find that order. Check the number and phone, or sign in if you placed it as a pickup order.",
    };
  }

  return { success: true, orderNumber: row.orderNumber };
}
