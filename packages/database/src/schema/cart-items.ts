import { pgTable, uuid, integer, timestamp, index } from "drizzle-orm/pg-core";
import { carts } from "./carts";
import { products } from "./products";
import { productVariants } from "./product-variants";

export const cartItems = pgTable("cart_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  cartId: uuid("cart_id").references(() => carts.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_cart_items_cart").on(table.cartId),
  // Unique constraint + check constraint added via raw SQL in migration
]);
