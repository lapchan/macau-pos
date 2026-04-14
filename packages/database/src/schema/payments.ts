import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  decimal,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
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

    // Gateway provider tag — NULL for in-house methods (cash/card),
    // 'intellipay' for simpaylicity-routed payments.
    provider: varchar("provider", { length: 16 }),

    // Intellipay fields — all nullable so existing cash-path inserts are untouched.
    intellipayPaymentId: varchar("intellipay_payment_id", { length: 64 }),
    intellipayOrderId: varchar("intellipay_order_id", { length: 32 }),
    intellipayPaymentService: varchar("intellipay_payment_service", { length: 32 }),
    intellipayTerminalId: varchar("intellipay_terminal_id", { length: 64 }),
    intellipayStatus: integer("intellipay_status"),
    intellipayStatusDesc: varchar("intellipay_status_desc", { length: 32 }),
    intellipayPaymentUrl: text("intellipay_payment_url"),
    intellipayQrCodeUrl: text("intellipay_qr_code_url"),
    intellipayProviderCode: varchar("intellipay_provider_code", { length: 16 }),
    intellipayWebhookUrl: text("intellipay_webhook_url"),
    intellipayRequestId: varchar("intellipay_request_id", { length: 64 }),
    intellipayLastEventId: varchar("intellipay_last_event_id", { length: 64 }),
    intellipayLastEventAt: timestamp("intellipay_last_event_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_payments_order").on(table.orderId),
    uniqueIndex("idx_payments_intellipay_payment_id")
      .on(table.intellipayPaymentId)
      .where(sql`${table.intellipayPaymentId} IS NOT NULL`),
    uniqueIndex("idx_payments_intellipay_order_id")
      .on(table.intellipayOrderId)
      .where(sql`${table.intellipayOrderId} IS NOT NULL`),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
