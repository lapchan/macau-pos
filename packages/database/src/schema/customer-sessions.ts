import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { customers } from "./customers";

export const customerSessions = pgTable("customer_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("idx_customer_sessions_token").on(table.token),
  index("idx_customer_sessions_customer").on(table.customerId),
]);
