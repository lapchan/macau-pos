import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { payments } from "./payments";

/**
 * Dedupe + audit log for inbound Intellipay webhook deliveries.
 * Delivery is at-least-once (up to 10 retries over ~several minutes);
 * we must drop duplicates on (tenant_id, event_id) and return 200.
 */
export const intellipayWebhookEvents = pgTable(
  "intellipay_webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    eventId: varchar("event_id", { length: 64 }).notNull(),
    eventType: varchar("event_type", { length: 32 }).notNull(),

    paymentId: uuid("payment_id").references(() => payments.id, {
      onDelete: "set null",
    }),

    // Raw signed body we received — kept for audit / replay / debugging.
    rawBody: text("raw_body").notNull(),

    // 'ok' = processed successfully, 'duplicate' = short-circuited, 'error' = handler threw
    status: varchar("status", { length: 16 }).notNull(),
    errorMessage: text("error_message"),

    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("idx_intellipay_events_tenant_event")
      .on(table.tenantId, table.eventId),
    index("idx_intellipay_events_payment").on(table.paymentId),
    index("idx_intellipay_events_received").on(table.receivedAt),
  ]
);

export type IntellipayWebhookEvent = typeof intellipayWebhookEvents.$inferSelect;
export type NewIntellipayWebhookEvent = typeof intellipayWebhookEvents.$inferInsert;
