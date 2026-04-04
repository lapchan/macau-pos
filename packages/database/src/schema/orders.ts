import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { locations } from "./locations";
import { users } from "./users";
import { shifts } from "./shifts";
import { terminals } from "./terminals";
import { customers } from "./customers";
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

    // Staff & terminal accountability (POS orders)
    cashierId: uuid("cashier_id").references(() => users.id, { onDelete: "set null" }),
    shiftId: uuid("shift_id").references(() => shifts.id, { onDelete: "set null" }),
    terminalId: uuid("terminal_id").references(() => terminals.id, { onDelete: "set null" }),

    // Online storefront fields
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    channel: varchar("channel", { length: 10 }).notNull().default("pos"), // pos, online, kiosk

    // Fulfillment (online orders — NULL for POS)
    fulfillmentStatus: varchar("fulfillment_status", { length: 20 }),
    deliveryMethod: varchar("delivery_method", { length: 20 }),
    shippingAddress: jsonb("shipping_address"),
    trackingNumber: varchar("tracking_number", { length: 100 }),
    courierName: varchar("courier_name", { length: 50 }),
    deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0"),
    estimatedDeliveryAt: timestamp("estimated_delivery_at", { withTimezone: true }),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    fulfillmentNotes: varchar("fulfillment_notes", { length: 1000 }),
    pickupLocationId: uuid("pickup_location_id").references(() => locations.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_orders_tenant_date").on(table.tenantId, table.createdAt),
    index("idx_orders_cashier").on(table.cashierId, table.createdAt),
    uniqueIndex("idx_orders_tenant_number").on(table.tenantId, table.orderNumber),
    index("idx_orders_customer").on(table.customerId, table.createdAt)
      .where(sql`${table.customerId} IS NOT NULL`),
    index("idx_orders_channel").on(table.tenantId, table.channel, table.createdAt),
    index("idx_orders_fulfillment").on(table.tenantId, table.fulfillmentStatus, table.createdAt)
      .where(sql`${table.fulfillmentStatus} IS NOT NULL`),
  ]
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
