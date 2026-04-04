"use server";

import {
  db,
  categories,
  products,
  eq,
  and,
  isNull,
  count,
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

// ─── Create Category ───────────────────────────────────────
export async function createCategory(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    const name = formData.get("name") as string;
    if (!name?.trim()) return { success: false, error: "Category name is required" };

    const [result] = await db
      .insert(categories)
      .values({
        tenantId,
        name: name.trim(),
        nameEn: (formData.get("nameEn") as string)?.trim() || null,
        namePt: (formData.get("namePt") as string)?.trim() || null,
        nameJa: (formData.get("nameJa") as string)?.trim() || null,
        icon: (formData.get("icon") as string)?.trim() || null,
        sortOrder: parseInt((formData.get("sortOrder") as string) || "0", 10),
      })
      .returning({ id: categories.id });

    revalidatePath("/items");
    return { success: true, data: { id: result.id } };
  } catch (err) {
    console.error("createCategory error:", err);
    return { success: false, error: "Failed to create category" };
  }
}

// ─── Update Category ───────────────────────────────────────
export async function updateCategory(formData: FormData): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "Category ID missing" };

    const name = formData.get("name") as string;
    if (!name?.trim()) return { success: false, error: "Category name is required" };

    await db
      .update(categories)
      .set({
        name: name.trim(),
        nameEn: (formData.get("nameEn") as string)?.trim() || null,
        namePt: (formData.get("namePt") as string)?.trim() || null,
        nameJa: (formData.get("nameJa") as string)?.trim() || null,
        icon: (formData.get("icon") as string)?.trim() || null,
        sortOrder: parseInt((formData.get("sortOrder") as string) || "0", 10),
        isActive: formData.has("isActive") ? formData.get("isActive") === "true" : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(categories.id, id), eq(categories.tenantId, tenantId)));

    revalidatePath("/items");
    return { success: true, data: { id } };
  } catch (err) {
    console.error("updateCategory error:", err);
    return { success: false, error: "Failed to update category" };
  }
}

// ─── Delete Category ───────────────────────────────────────
export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    // Check if any active products use this category
    const [productCount] = await db
      .select({ count: count() })
      .from(products)
      .where(
        and(
          eq(products.categoryId, id),
          eq(products.tenantId, tenantId),
          isNull(products.deletedAt)
        )
      );

    if (productCount && productCount.count > 0) {
      return {
        success: false,
        error: `Cannot delete: ${productCount.count} product(s) use this category. Reassign them first.`,
      };
    }

    await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.tenantId, tenantId)));

    revalidatePath("/items");
    return { success: true };
  } catch (err) {
    console.error("deleteCategory error:", err);
    return { success: false, error: "Failed to delete category" };
  }
}
