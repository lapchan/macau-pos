import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { products } from "./products";

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

    // Snapshot at sale time (survives product changes/deletion)
    name: varchar("name", { length: 255 }).notNull(),
    nameCn: varchar("name_cn", { length: 255 }),

    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
    lineTotal: decimal("line_total", { precision: 10, scale: 2 }).notNull(),
  },
  (table) => [index("idx_order_items_order").on(table.orderId)]
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
