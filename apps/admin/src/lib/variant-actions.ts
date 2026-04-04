"use server";

import {
  db,
  products,
  optionGroups,
  optionValues,
  productVariants,
  eq,
  and,
  asc,
  sql,
} from "@macau-pos/database";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "./auth-actions";

type ActionResult = {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

async function requireTenantId(): Promise<string> {
  const session = await getAuthSession();
  if (!session?.tenantId) throw new Error("No active session");
  return session.tenantId;
}

// ─── Toggle has_variants on product ────────────────────────
export async function toggleProductVariants(
  productId: string,
  hasVariants: boolean
): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();
    await db
      .update(products)
      .set({ hasVariants: hasVariants, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)));
    revalidatePath("/items");
    return { success: true };
  } catch (err) {
    console.error("toggleProductVariants error:", err);
    return { success: false, error: "Failed to toggle variants" };
  }
}

// ─── Get option groups + values for a product ──────────────
export async function getProductOptions(productId: string) {
  const tenantId = await requireTenantId();

  const groups = await db
    .select()
    .from(optionGroups)
    .where(and(eq(optionGroups.productId, productId), eq(optionGroups.tenantId, tenantId)))
    .orderBy(asc(optionGroups.sortOrder));

  const result = [];
  for (const group of groups) {
    const values = await db
      .select()
      .from(optionValues)
      .where(eq(optionValues.groupId, group.id))
      .orderBy(asc(optionValues.sortOrder));
    result.push({ ...group, values });
  }

  return result;
}

// ─── Get variants for a product ────────────────────────────
export async function getProductVariants(productId: string) {
  const tenantId = await requireTenantId();
  return db
    .select()
    .from(productVariants)
    .where(and(eq(productVariants.productId, productId), eq(productVariants.tenantId, tenantId)))
    .orderBy(asc(productVariants.sortOrder));
}

// ─── Create option group ───────────────────────────────────
export async function createOptionGroup(
  productId: string,
  name: string
): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    // Get max sort order
    const [maxSort] = await db
      .select({ max: sql<number>`COALESCE(MAX(sort_order), -1)` })
      .from(optionGroups)
      .where(eq(optionGroups.productId, productId));

    const [group] = await db
      .insert(optionGroups)
      .values({
        tenantId,
        productId,
        name,
        sortOrder: (maxSort?.max ?? -1) + 1,
      })
      .returning({ id: optionGroups.id });

    revalidatePath("/items");
    return { success: true, data: { id: group.id } };
  } catch (err) {
    console.error("createOptionGroup error:", err);
    return { success: false, error: "Failed to create option group" };
  }
}

// ─── Update option group name ──────────────────────────────
export async function updateOptionGroup(
  groupId: string,
  name: string
): Promise<ActionResult> {
  try {
    await db
      .update(optionGroups)
      .set({ name })
      .where(eq(optionGroups.id, groupId));
    revalidatePath("/items");
    return { success: true };
  } catch (err) {
    console.error("updateOptionGroup error:", err);
    return { success: false, error: "Failed to update option group" };
  }
}

// ─── Delete option group (cascades values) ─────────────────
export async function deleteOptionGroup(groupId: string): Promise<ActionResult> {
  try {
    await db.delete(optionGroups).where(eq(optionGroups.id, groupId));
    revalidatePath("/items");
    return { success: true };
  } catch (err) {
    console.error("deleteOptionGroup error:", err);
    return { success: false, error: "Failed to delete option group" };
  }
}

// ─── Add option value ──────────────────────────────────────
export async function addOptionValue(
  groupId: string,
  value: string
): Promise<ActionResult> {
  try {
    const [maxSort] = await db
      .select({ max: sql<number>`COALESCE(MAX(sort_order), -1)` })
      .from(optionValues)
      .where(eq(optionValues.groupId, groupId));

    const [val] = await db
      .insert(optionValues)
      .values({
        groupId,
        value,
        sortOrder: (maxSort?.max ?? -1) + 1,
      })
      .returning({ id: optionValues.id });

    revalidatePath("/items");
    return { success: true, data: { id: val.id } };
  } catch (err) {
    console.error("addOptionValue error:", err);
    return { success: false, error: "Failed to add option value" };
  }
}

// ─── Remove option value ───────────────────────────────────
export async function removeOptionValue(valueId: string): Promise<ActionResult> {
  try {
    await db.delete(optionValues).where(eq(optionValues.id, valueId));
    revalidatePath("/items");
    return { success: true };
  } catch (err) {
    console.error("removeOptionValue error:", err);
    return { success: false, error: "Failed to remove option value" };
  }
}

// ─── Generate variants from option combinations ────────────
export async function generateVariants(
  productId: string
): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    // Get product base price
    const [product] = await db
      .select({ name: products.name, sellingPrice: products.sellingPrice, originalPrice: products.originalPrice })
      .from(products)
      .where(eq(products.id, productId));
    if (!product) return { success: false, error: "Product not found" };

    // Get all option groups with values
    const groups = await db
      .select()
      .from(optionGroups)
      .where(eq(optionGroups.productId, productId))
      .orderBy(asc(optionGroups.sortOrder));

    const groupValues: { groupName: string; values: { id: string; value: string }[] }[] = [];
    for (const g of groups) {
      const vals = await db
        .select({ id: optionValues.id, value: optionValues.value })
        .from(optionValues)
        .where(eq(optionValues.groupId, g.id))
        .orderBy(asc(optionValues.sortOrder));
      if (vals.length > 0) {
        groupValues.push({ groupName: g.name, values: vals });
      }
    }

    if (groupValues.length === 0) {
      return { success: false, error: "Add option values first" };
    }

    // Generate all combinations (cartesian product)
    function cartesian(arrays: { groupName: string; value: string }[][]): { groupName: string; value: string }[][] {
      if (arrays.length === 0) return [[]];
      const [first, ...rest] = arrays;
      const restCombos = cartesian(rest);
      return first.flatMap((item) => restCombos.map((combo) => [item, ...combo]));
    }

    const optionArrays = groupValues.map((g) =>
      g.values.map((v) => ({ groupName: g.groupName, value: v.value }))
    );
    const combos = cartesian(optionArrays);

    // Delete existing variants for this product
    await db.delete(productVariants).where(eq(productVariants.productId, productId));

    // Insert new variants
    const variantRows = combos.map((combo, idx) => {
      const optionCombo: Record<string, string> = {};
      const nameParts: string[] = [];
      for (const c of combo) {
        optionCombo[c.groupName] = c.value;
        nameParts.push(c.value);
      }
      return {
        tenantId,
        productId,
        name: `${product.name} · ${nameParts.join(" / ")}`,
        sellingPrice: product.sellingPrice,
        originalPrice: product.originalPrice,
        optionCombo,
        sortOrder: idx,
      };
    });

    if (variantRows.length > 0) {
      await db.insert(productVariants).values(variantRows);
    }

    // Mark product as having variants
    await db
      .update(products)
      .set({ hasVariants: true, updatedAt: new Date() })
      .where(eq(products.id, productId));

    revalidatePath("/items");
    return { success: true, data: { count: variantRows.length } };
  } catch (err) {
    console.error("generateVariants error:", err);
    return { success: false, error: "Failed to generate variants" };
  }
}

// ─── Update a single variant (price, stock, SKU, barcode) ──
export async function updateVariant(
  variantId: string,
  data: {
    sellingPrice?: string;
    originalPrice?: string | null;
    stock?: number | null;
    sku?: string | null;
    barcode?: string | null;
    isActive?: boolean;
  }
): Promise<ActionResult> {
  try {
    await db
      .update(productVariants)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, variantId));
    revalidatePath("/items");
    return { success: true };
  } catch (err) {
    console.error("updateVariant error:", err);
    return { success: false, error: "Failed to update variant" };
  }
}

// ─── Delete all variants for a product ─────────────────────
export async function clearVariants(productId: string): Promise<ActionResult> {
  try {
    const tenantId = await requireTenantId();

    await db.delete(productVariants).where(eq(productVariants.productId, productId));
    await db.delete(optionValues).where(
      sql`group_id IN (SELECT id FROM option_groups WHERE product_id = ${productId})`
    );
    await db.delete(optionGroups).where(eq(optionGroups.productId, productId));
    await db
      .update(products)
      .set({ hasVariants: false, updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)));

    revalidatePath("/items");
    return { success: true };
  } catch (err) {
    console.error("clearVariants error:", err);
    return { success: false, error: "Failed to clear variants" };
  }
}
