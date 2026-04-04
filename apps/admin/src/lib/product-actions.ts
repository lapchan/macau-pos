"use server";

import {
  db,
  products,
  eq,
  and,
  isNull,
  inArray,
  sql,
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

// ─── Create Product ────────────────────────────────────────
export async function createProduct(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    const name = formData.get("name") as string;
    const sellingPrice = formData.get("sellingPrice") as string;

    if (!name?.trim()) return { success: false, error: "Product name is required" };
    if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0) {
      return { success: false, error: "Valid selling price is required" };
    }

    const stockVal = formData.get("stock") as string;
    const categoryId = formData.get("categoryId") as string;

    // Parse translations JSONB
    let translations: Record<string, string> = {};
    try {
      const raw = formData.get("translations") as string;
      if (raw) translations = JSON.parse(raw);
    } catch { /* ignore parse errors */ }

    const [result] = await db
      .insert(products)
      .values({
        tenantId,
        name: name.trim(),
        translations,
        sku: (formData.get("sku") as string)?.trim() || null,
        barcode: (formData.get("barcode") as string)?.trim() || null,
        image: (formData.get("image") as string)?.trim() || null,
        sellingPrice: sellingPrice,
        originalPrice: (formData.get("originalPrice") as string) || null,
        stock: stockVal === "" || stockVal === null ? null : parseInt(stockVal, 10),
        categoryId: categoryId || null,
        status: ((formData.get("status") as string) || "active") as "active" | "draft" | "inactive" | "sold_out",
        isPopular: formData.get("isPopular") === "true",
      })
      .returning({ id: products.id });

    revalidatePath("/items");
    return { success: true, data: { id: result.id } };
  } catch (err) {
    console.error("createProduct error:", err);
    return { success: false, error: "Failed to create product" };
  }
}

// ─── Update Product ────────────────────────────────────────
export async function updateProduct(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    const id = formData.get("id") as string;
    const version = parseInt(formData.get("version") as string, 10);
    const name = formData.get("name") as string;
    const sellingPrice = formData.get("sellingPrice") as string;

    if (!id) return { success: false, error: "Product ID missing" };
    if (!name?.trim()) return { success: false, error: "Product name is required" };
    if (!sellingPrice || isNaN(Number(sellingPrice)) || Number(sellingPrice) < 0) {
      return { success: false, error: "Valid selling price is required" };
    }

    const stockVal = formData.get("stock") as string;
    const categoryId = formData.get("categoryId") as string;

    // Parse translations JSONB
    let translations: Record<string, string> = {};
    try {
      const raw = formData.get("translations") as string;
      if (raw) translations = JSON.parse(raw);
    } catch { /* ignore parse errors */ }

    const result = await db
      .update(products)
      .set({
        name: name.trim(),
        translations,
        sku: (formData.get("sku") as string)?.trim() || null,
        barcode: (formData.get("barcode") as string)?.trim() || null,
        image: (formData.get("image") as string)?.trim() || null,
        sellingPrice: sellingPrice,
        originalPrice: (formData.get("originalPrice") as string) || null,
        stock: stockVal === "" || stockVal === null ? null : parseInt(stockVal, 10),
        categoryId: categoryId || null,
        status: ((formData.get("status") as string) || "active") as "active" | "draft" | "inactive" | "sold_out",
        isPopular: formData.get("isPopular") === "true",
        version: sql`${products.version} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(products.id, id),
          eq(products.tenantId, tenantId),
          eq(products.version, version),
          isNull(products.deletedAt)
        )
      );

    if (result.rowCount === 0) {
      return {
        success: false,
        error: "Product was modified by another user. Please refresh and try again.",
      };
    }

    revalidatePath("/items");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateProduct error:", err);
    return { success: false, error: "Failed to update product" };
  }
}

// ─── Delete Product (soft) ─────────────────────────────────
export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    await db
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(products.id, id),
          eq(products.tenantId, tenantId),
          isNull(products.deletedAt)
        )
      );

    revalidatePath("/items");
    return { success: true };
  } catch (err) {
    console.error("deleteProduct error:", err);
    return { success: false, error: "Failed to delete product" };
  }
}

// ─── Bulk Delete Products ──────────────────────────────────
export async function bulkDeleteProducts(ids: string[]): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    if (!ids.length) return { success: false, error: "No products selected" };

    await db
      .update(products)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          inArray(products.id, ids),
          eq(products.tenantId, tenantId),
          isNull(products.deletedAt)
        )
      );

    revalidatePath("/items");
    return { success: true };
  } catch (err) {
    console.error("bulkDeleteProducts error:", err);
    return { success: false, error: "Failed to delete products" };
  }
}

// ─── Bulk Update Status ────────────────────────────────────
export async function bulkUpdateStatus(
  ids: string[],
  status: string
): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    if (!ids.length) return { success: false, error: "No products selected" };
    if (!["active", "draft", "inactive", "sold_out"].includes(status)) {
      return { success: false, error: "Invalid status" };
    }

    await db
      .update(products)
      .set({
        status: status as "active" | "draft" | "inactive" | "sold_out",
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(products.id, ids),
          eq(products.tenantId, tenantId),
          isNull(products.deletedAt)
        )
      );

    revalidatePath("/items");
    return { success: true };
  } catch (err) {
    console.error("bulkUpdateStatus error:", err);
    return { success: false, error: "Failed to update status" };
  }
}
