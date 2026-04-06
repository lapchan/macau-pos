"use server";

import {
  db,
  customers,
  customerAddresses,
  eq,
  and,
} from "@macau-pos/database";
import { getCurrentCustomer } from "./auth";
import { revalidatePath } from "next/cache";

// ── Profile ────────────────────────────────────────────────

export async function updateProfile(data: {
  name: string;
  email?: string;
  phone?: string;
  locale?: string;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Not authenticated" };

  const name = data.name.trim();
  if (!name) return { error: "Name is required" };

  await db
    .update(customers)
    .set({
      name,
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      locale: data.locale || undefined,
    })
    .where(eq(customers.id, customer.id));

  revalidatePath("/", "layout");
  return { success: true };
}

// ── Addresses ──────────────────────────────────────────────

export async function getAddresses() {
  const customer = await getCurrentCustomer();
  if (!customer) return [];

  return db
    .select()
    .from(customerAddresses)
    .where(eq(customerAddresses.customerId, customer.id))
    .orderBy(customerAddresses.createdAt);
}

export async function addAddress(data: {
  label?: string;
  recipientName: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  district?: string;
  city?: string;
  isDefault?: boolean;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Not authenticated" };

  if (!data.recipientName.trim()) return { error: "Recipient name is required" };
  if (!data.addressLine1.trim()) return { error: "Address is required" };

  // If setting as default, clear existing defaults first
  if (data.isDefault) {
    await db
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(eq(customerAddresses.customerId, customer.id));
  }

  const [address] = await db
    .insert(customerAddresses)
    .values({
      customerId: customer.id,
      label: data.label?.trim() || null,
      recipientName: data.recipientName.trim(),
      phone: data.phone?.trim() || null,
      addressLine1: data.addressLine1.trim(),
      addressLine2: data.addressLine2?.trim() || null,
      district: data.district?.trim() || null,
      city: data.city?.trim() || "Macau",
      isDefault: data.isDefault ?? false,
    })
    .returning();

  revalidatePath("/", "layout");
  return { success: true, addressId: address.id };
}

export async function updateAddress(
  addressId: string,
  data: {
    label?: string;
    recipientName: string;
    phone?: string;
    addressLine1: string;
    addressLine2?: string;
    district?: string;
    city?: string;
    isDefault?: boolean;
  },
) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Not authenticated" };

  // Verify ownership
  const [existing] = await db
    .select({ id: customerAddresses.id })
    .from(customerAddresses)
    .where(
      and(
        eq(customerAddresses.id, addressId),
        eq(customerAddresses.customerId, customer.id),
      )
    )
    .limit(1);

  if (!existing) return { error: "Address not found" };

  if (data.isDefault) {
    await db
      .update(customerAddresses)
      .set({ isDefault: false })
      .where(eq(customerAddresses.customerId, customer.id));
  }

  await db
    .update(customerAddresses)
    .set({
      label: data.label?.trim() || null,
      recipientName: data.recipientName.trim(),
      phone: data.phone?.trim() || null,
      addressLine1: data.addressLine1.trim(),
      addressLine2: data.addressLine2?.trim() || null,
      district: data.district?.trim() || null,
      city: data.city?.trim() || "Macau",
      isDefault: data.isDefault ?? false,
    })
    .where(eq(customerAddresses.id, addressId));

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteAddress(addressId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Not authenticated" };

  const [existing] = await db
    .select({ id: customerAddresses.id })
    .from(customerAddresses)
    .where(
      and(
        eq(customerAddresses.id, addressId),
        eq(customerAddresses.customerId, customer.id),
      )
    )
    .limit(1);

  if (!existing) return { error: "Address not found" };

  await db
    .delete(customerAddresses)
    .where(eq(customerAddresses.id, addressId));

  revalidatePath("/", "layout");
  return { success: true };
}

export async function setDefaultAddress(addressId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Not authenticated" };

  // Clear all defaults
  await db
    .update(customerAddresses)
    .set({ isDefault: false })
    .where(eq(customerAddresses.customerId, customer.id));

  // Set new default
  await db
    .update(customerAddresses)
    .set({ isDefault: true })
    .where(
      and(
        eq(customerAddresses.id, addressId),
        eq(customerAddresses.customerId, customer.id),
      )
    );

  revalidatePath("/", "layout");
  return { success: true };
}
