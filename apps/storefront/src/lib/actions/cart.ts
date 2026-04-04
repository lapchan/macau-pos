"use server";

import { cookies } from "next/headers";
import {
  db,
  carts,
  cartItems,
  products,
  categories,
  eq,
  and,
  sql,
  isNull,
} from "@macau-pos/database";
import { resolveTenant } from "@/lib/tenant-resolver";
import { revalidatePath } from "next/cache";

// ============================================================
// Helpers
// ============================================================

async function getOrCreateCart(tenantId: string, customerId?: string | null) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sf_cart_session")?.value;
  if (!sessionToken && !customerId) throw new Error("No cart session");

  // Try to find existing cart
  let cart;
  if (customerId) {
    [cart] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.tenantId, tenantId), eq(carts.customerId, customerId)))
      .limit(1);
  }
  if (!cart && sessionToken) {
    [cart] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.tenantId, tenantId), eq(carts.sessionToken, sessionToken)))
      .limit(1);
  }

  // Create new cart if none exists
  if (!cart) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    [cart] = await db
      .insert(carts)
      .values({
        tenantId,
        customerId: customerId || null,
        sessionToken: customerId ? null : sessionToken,
        expiresAt,
      })
      .returning();
  }

  return cart;
}

export type CartWithItems = {
  id: string;
  items: {
    id: string;
    productId: string;
    variantId: string | null;
    name: string;
    translations: Record<string, string> | null;
    price: number;
    originalPrice: number | null;
    quantity: number;
    image: string | null;
    stock: number | null;
    slug: string | null;
    categoryName: string | null;
    categoryTranslations: Record<string, string> | null;
  }[];
  itemCount: number;
  subtotal: number;
};

// ============================================================
// Get cart
// ============================================================

export async function getCart(): Promise<CartWithItems | null> {
  const tenant = await resolveTenant();
  if (!tenant) return null;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sf_cart_session")?.value;
  // TODO: also check customer session for logged-in users
  if (!sessionToken) return null;

  const [cart] = await db
    .select()
    .from(carts)
    .where(and(eq(carts.tenantId, tenant.id), eq(carts.sessionToken, sessionToken)))
    .limit(1);

  if (!cart) return null;

  const items = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      name: products.name,
      translations: products.translations,
      sellingPrice: products.sellingPrice,
      originalPrice: products.originalPrice,
      image: products.image,
      stock: products.stock,
      slug: products.slug,
      categoryName: categories.name,
      categoryTranslations: categories.translations,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(cartItems.cartId, cart.id));

  const mapped = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    name: item.name,
    translations: item.translations as Record<string, string> | null,
    price: parseFloat(String(item.sellingPrice)),
    originalPrice: item.originalPrice ? parseFloat(String(item.originalPrice)) : null,
    quantity: item.quantity,
    image: item.image,
    stock: item.stock,
    slug: item.slug,
    categoryName: item.categoryName,
    categoryTranslations: item.categoryTranslations as Record<string, string> | null,
  }));

  return {
    id: cart.id,
    items: mapped,
    itemCount: mapped.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: mapped.reduce((sum, i) => sum + i.price * i.quantity, 0),
  };
}

// ============================================================
// Add to cart
// ============================================================

export async function addToCart(
  productId: string,
  quantity: number = 1,
  variantId?: string | null,
) {
  const tenant = await resolveTenant();
  if (!tenant) return { error: "Tenant not found" };

  // Verify product exists and is in stock
  const [product] = await db
    .select({ id: products.id, stock: products.stock, status: products.status })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.tenantId, tenant.id), isNull(products.deletedAt)))
    .limit(1);

  if (!product) return { error: "Product not found" };
  if (product.status !== "active") return { error: "Product not available" };
  if (product.stock !== null && product.stock < quantity) return { error: "Not enough stock" };

  const cart = await getOrCreateCart(tenant.id);

  // Check if item already in cart
  const [existing] = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.cartId, cart.id),
        eq(cartItems.productId, productId),
        variantId ? eq(cartItems.variantId, variantId) : isNull(cartItems.variantId),
      )
    )
    .limit(1);

  if (existing) {
    // Update quantity
    const newQty = existing.quantity + quantity;
    if (product.stock !== null && product.stock < newQty) {
      return { error: "Not enough stock" };
    }
    await db
      .update(cartItems)
      .set({ quantity: newQty })
      .where(eq(cartItems.id, existing.id));
  } else {
    // Insert new item
    await db.insert(cartItems).values({
      cartId: cart.id,
      productId,
      variantId: variantId || null,
      quantity,
    });
  }

  // Update cart timestamp
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));

  revalidatePath("/", "layout");
  return { success: true };
}

// ============================================================
// Update cart item quantity
// ============================================================

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  if (quantity < 1) return removeCartItem(cartItemId);

  const tenant = await resolveTenant();
  if (!tenant) return { error: "Tenant not found" };

  // Get the cart item with product stock info
  const [item] = await db
    .select({
      id: cartItems.id,
      cartId: cartItems.cartId,
      productId: cartItems.productId,
      stock: products.stock,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .where(and(eq(cartItems.id, cartItemId), eq(carts.tenantId, tenant.id)))
    .limit(1);

  if (!item) return { error: "Cart item not found" };
  if (item.stock !== null && item.stock < quantity) return { error: "Not enough stock" };

  await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, cartItemId));
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, item.cartId));

  revalidatePath("/", "layout");
  return { success: true };
}

// ============================================================
// Remove cart item
// ============================================================

export async function removeCartItem(cartItemId: string) {
  const tenant = await resolveTenant();
  if (!tenant) return { error: "Tenant not found" };

  const [item] = await db
    .select({ id: cartItems.id, cartId: cartItems.cartId })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .where(and(eq(cartItems.id, cartItemId), eq(carts.tenantId, tenant.id)))
    .limit(1);

  if (!item) return { error: "Cart item not found" };

  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, item.cartId));

  revalidatePath("/", "layout");
  return { success: true };
}

// ============================================================
// Get cart count (for header badge)
// ============================================================

export async function getCartCount(): Promise<number> {
  const tenant = await resolveTenant();
  if (!tenant) return 0;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sf_cart_session")?.value;
  if (!sessionToken) return 0;

  const [cart] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(and(eq(carts.tenantId, tenant.id), eq(carts.sessionToken, sessionToken)))
    .limit(1);

  if (!cart) return 0;

  const [result] = await db
    .select({ count: sql<number>`coalesce(sum(${cartItems.quantity}), 0)` })
    .from(cartItems)
    .where(eq(cartItems.cartId, cart.id));

  return Number(result.count);
}
