import {
  pgTable,
  uuid,
  decimal,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { paymentMethodEnum } from "./enums";

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),

    // Cash-specific fields
    cashReceived: decimal("cash_received", { precision: 10, scale: 2 }),
    changeGiven: decimal("change_given", { precision: 10, scale: 2 }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_payments_order").on(table.orderId)]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
