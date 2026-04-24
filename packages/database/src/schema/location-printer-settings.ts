import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  smallint,
  boolean,
  timestamp,
  pgEnum,
  index,
  integer,
  jsonb,
  check,
} from "drizzle-orm/pg-core";
import { locations } from "./locations";

export const printerDriverEnum = pgEnum("printer_driver", [
  "generic",
  "star",
  "epson",
  "custom",
]);

export const printerCodePageEnum = pgEnum("printer_code_page", [
  "cp437",
  "gb18030",
  "big5",
  "shift_jis",
]);

export const printerStatusEnum = pgEnum("printer_status", [
  "ok",
  "offline",
  "out_of_paper",
  "error",
  "unknown",
]);

export const printerLocationStatusEnum = pgEnum("printer_location_status", [
  "disabled",
  "enabled",
  "maintenance",
]);

export const locationPrinterSettings = pgTable(
  "location_printer_settings",
  {
    locationId: uuid("location_id")
      .primaryKey()
      .references(() => locations.id, { onDelete: "cascade" }),

    status: printerLocationStatusEnum("status").notNull().default("disabled"),
    endpointUrl: text("endpoint_url").notNull(),
    tunnelId: text("tunnel_id").notNull(),
    driver: printerDriverEnum("driver").notNull().default("generic"),
    paperWidth: smallint("paper_width").notNull().default(80),
    codePage: printerCodePageEnum("code_page").notNull().default("big5"),
    defaultCopies: smallint("default_copies").notNull().default(1),
    cashDrawerEnabled: boolean("cash_drawer_enabled").notNull().default(false),

    tokenHash: text("token_hash").notNull(),
    pendingTokenHash: text("pending_token_hash"),
    rotationOverlapUntil: timestamp("rotation_overlap_until", {
      withTimezone: true,
    }),
    pendingCommandType: text("pending_command_type"),
    pendingCommandPayload: jsonb("pending_command_payload"),
    tokenRotatedAt: timestamp("token_rotated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    bootstrapUsed: boolean("bootstrap_used").notNull().default(false),

    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    bridgeVersion: text("bridge_version"),
    printerStatus: printerStatusEnum("printer_status")
      .notNull()
      .default("unknown"),
    lastError: text("last_error"),
    lastPrinterModel: text("last_printer_model"),
    jobsServedTotal: integer("jobs_served_total").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("location_printer_offline_idx")
      .on(table.lastSeenAt)
      .where(sql`${table.status} = 'enabled'`),
    index("location_printer_status_idx").on(table.status),
    check(
      "location_printer_settings_paper_width_check",
      sql`${table.paperWidth} IN (58, 80)`,
    ),
    check(
      "location_printer_settings_default_copies_check",
      sql`${table.defaultCopies} BETWEEN 1 AND 10`,
    ),
    check(
      "location_printer_settings_pending_command_type_check",
      sql`${table.pendingCommandType} IS NULL OR ${table.pendingCommandType} IN ('rotate_token', 'force_update', 'reload_config')`,
    ),
  ],
);

export type LocationPrinterSettings =
  typeof locationPrinterSettings.$inferSelect;
export type NewLocationPrinterSettings =
  typeof locationPrinterSettings.$inferInsert;
export type PrinterDriver = (typeof printerDriverEnum.enumValues)[number];
export type PrinterCodePage = (typeof printerCodePageEnum.enumValues)[number];
export type PrinterStatus = (typeof printerStatusEnum.enumValues)[number];
export type PrinterLocationStatus =
  (typeof printerLocationStatusEnum.enumValues)[number];

export type PrinterPendingCommandType =
  | "rotate_token"
  | "force_update"
  | "reload_config";
