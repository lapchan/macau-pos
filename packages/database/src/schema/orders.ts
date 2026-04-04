import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { locations } from "./locations";
import { users } from "./users";
import { shifts } from "./shifts";
import { terminals } from "./terminals";
import { orderStatusEnum } from "./enums";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    orderNumber: varchar("order_number", { length: 20 }).notNull(),
    status: orderStatusEnum("status").notNull().default("completed"),

    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal("discount_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),

    itemCount: integer("item_count").notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("MOP"),
    notes: varchar("notes", { length: 500 }),

    // Staff & terminal accountability
    cashierId: uuid("cashier_id").references(() => users.id, { onDelete: "set null" }),
    shiftId: uuid("shift_id").references(() => shifts.id, { onDelete: "set null" }),
    terminalId: uuid("terminal_id").references(() => terminals.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_orders_tenant_date").on(table.tenantId, table.createdAt),
    index("idx_orders_cashier").on(table.cashierId, table.createdAt),
    uniqueIndex("idx_orders_tenant_number").on(
      table.tenantId,
      table.orderNumber
    ),
  ]
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
