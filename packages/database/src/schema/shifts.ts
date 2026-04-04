/**
 * Shifts table — Staff Daily Settlement (員工每日結數)
 *
 * Phase 2 feature. Schema created now to avoid retrofitting orders later.
 * Each shift represents a cashier's work period with cash accountability.
 *
 * Flow: Open shift (enter float) → Process orders → Close shift (count cash) → Manager approves
 */
import {
  pgTable,
  uuid,
  varchar,
  decimal,
  integer,
  timestamp,
  text,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { locations } from "./locations";
import { users } from "./users";
import { terminals } from "./terminals";
import { shiftStatusEnum } from "./enums";

export const shifts = pgTable(
  "shifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    cashierId: uuid("cashier_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    terminalId: uuid("terminal_id")
      .references(() => terminals.id, { onDelete: "set null" }),

    // Shift timing
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),

    // Cash accountability
    openingFloat: decimal("opening_float", { precision: 10, scale: 2 }).notNull().default("0"),
    expectedCash: decimal("expected_cash", { precision: 10, scale: 2 }).notNull().default("0"),
    actualCash: decimal("actual_cash", { precision: 10, scale: 2 }),
    variance: decimal("variance", { precision: 10, scale: 2 }),

    // Shift totals (calculated at close)
    totalSales: decimal("total_sales", { precision: 10, scale: 2 }).notNull().default("0"),
    totalOrders: integer("total_orders").notNull().default(0),

    // Payment method breakdown: { "cash": 1234.50, "card": 5678.00, "qr": 910.00 }
    paymentBreakdown: jsonb("payment_breakdown"),

    // Approval
    status: shiftStatusEnum("status").notNull().default("open"),
    approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_shifts_tenant_cashier").on(table.tenantId, table.cashierId, table.openedAt),
    index("idx_shifts_tenant_status").on(table.tenantId, table.status),
  ]
);

export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;
