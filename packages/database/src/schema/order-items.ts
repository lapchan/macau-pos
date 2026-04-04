import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { products } from "./products";
import { productVariants } from "./product-variants";

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),

    // Variant tracking (nullable — simple products have no variant)
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    variantName: varchar("variant_name", { length: 255 }), // Snapshot: "M / 暗魂黑"
    optionCombo: jsonb("option_combo").$type<Record<string, string>>(), // Snapshot: { "Size": "M", "Color": "暗魂黑" }

    // Snapshot at sale time (survives product changes/deletion)
    name: varchar("name", { length: 255 }).notNull(),
    // Full translations snapshot at purchase time
    translations: jsonb("translations").$type<Record<string, string>>().default({}),

    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [index("idx_order_items_order").on(table.orderId)]
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
