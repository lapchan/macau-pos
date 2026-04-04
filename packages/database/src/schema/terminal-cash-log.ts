import {
  pgTable,
  uuid,
  varchar,
  decimal,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { locations } from "./locations";
import { shifts } from "./shifts";
import { terminals } from "./terminals";
import { orders } from "./orders";
import { payments } from "./payments";
import { users } from "./users";

/**
 * Terminal Cash Log — immutable ledger of all cash-flow events per shift/terminal.
 *
 * Event types:
 * - shift_open: Opening float deposited
 * - cash_sale: Cash received from customer
 * - cash_change: Change given to customer
 * - refund: Cash refund to customer
 * - withdrawal: Mid-shift cash removal
 * - drop_to_safe: Security deposit to safe
 * - adjustment: Manual correction (credit or debit)
 * - shift_close: Final count record
 */
export const terminalCashLog = pgTable(
  "terminal_cash_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    shiftId: uuid("shift_id")
      .references(() => shifts.id, { onDelete: "cascade" }),
    terminalId: uuid("terminal_id")
      .references(() => terminals.id, { onDelete: "set null" }),

    // Event classification
    eventType: varchar("event_type", { length: 50 }).notNull(),

    // Cash movement
    creditAmount: decimal("credit_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    debitAmount: decimal("debit_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),

    // Reference to source transaction
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "set null" }),
    paymentId: uuid("payment_id")
      .references(() => payments.id, { onDelete: "set null" }),

    // Actor
    recordedBy: uuid("recorded_by")
      .notNull()
      .references(() => users.id),
    authorizedBy: uuid("authorized_by")
      .references(() => users.id),

    reason: text("reason"),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_cash_log_shift").on(table.shiftId, table.createdAt),
    index("idx_cash_log_terminal").on(table.terminalId, table.createdAt),
  ]
);

export type TerminalCashLogEntry = typeof terminalCashLog.$inferSelect;
export type NewTerminalCashLogEntry = typeof terminalCashLog.$inferInsert;
