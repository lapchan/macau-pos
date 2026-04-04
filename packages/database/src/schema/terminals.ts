import { pgTable, uuid, varchar, text, jsonb, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { locations } from "./locations";
import { users } from "./users";
import { terminalStatusEnum } from "./enums";

export const terminals = pgTable(
  "terminals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),

    // Identity
    name: varchar("name", { length: 100 }).notNull(),
    code: varchar("code", { length: 20 }).notNull(), // e.g. "T-001", unique per tenant
    activationCode: varchar("activation_code", { length: 20 }), // 6-char, cleared after pairing
    location: varchar("location", { length: 200 }),

    // Device info captured on activation
    deviceInfo: jsonb("device_info").default("{}"),

    // Status
    status: terminalStatusEnum("status").notNull().default("active"),
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
    activatedAt: timestamp("activated_at", { withTimezone: true }),

    // Current logged-in user
    currentUserId: uuid("current_user_id").references(() => users.id, { onDelete: "set null" }),

    // Admin notes
    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("idx_terminals_tenant_code").on(table.tenantId, table.code),
    index("idx_terminals_tenant_status").on(table.tenantId, table.status),
    uniqueIndex("idx_terminals_activation_code")
      .on(table.activationCode),
  ]
);

export type Terminal = typeof terminals.$inferSelect;
export type NewTerminal = typeof terminals.$inferInsert;
