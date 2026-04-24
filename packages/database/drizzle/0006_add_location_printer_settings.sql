CREATE TYPE "public"."printer_driver" AS ENUM('generic', 'star', 'epson', 'custom');--> statement-breakpoint
CREATE TYPE "public"."printer_code_page" AS ENUM('cp437', 'gb18030', 'big5', 'shift_jis');--> statement-breakpoint
CREATE TYPE "public"."printer_status" AS ENUM('ok', 'offline', 'out_of_paper', 'error', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."printer_location_status" AS ENUM('disabled', 'enabled', 'maintenance');--> statement-breakpoint
CREATE TABLE "location_printer_settings" (
	"location_id" uuid PRIMARY KEY NOT NULL,
	"status" "printer_location_status" DEFAULT 'disabled' NOT NULL,
	"endpoint_url" text NOT NULL,
	"tunnel_id" text NOT NULL,
	"driver" "printer_driver" DEFAULT 'generic' NOT NULL,
	"paper_width" smallint DEFAULT 80 NOT NULL,
	"code_page" "printer_code_page" DEFAULT 'big5' NOT NULL,
	"default_copies" smallint DEFAULT 1 NOT NULL,
	"cash_drawer_enabled" boolean DEFAULT false NOT NULL,
	"token_hash" text NOT NULL,
	"pending_token_hash" text,
	"rotation_overlap_until" timestamp with time zone,
	"pending_command_type" text,
	"pending_command_payload" jsonb,
	"token_rotated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"bootstrap_used" boolean DEFAULT false NOT NULL,
	"last_seen_at" timestamp with time zone,
	"bridge_version" text,
	"printer_status" "printer_status" DEFAULT 'unknown' NOT NULL,
	"last_error" text,
	"last_printer_model" text,
	"jobs_served_total" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "location_printer_settings_paper_width_check" CHECK ("paper_width" IN (58, 80)),
	CONSTRAINT "location_printer_settings_default_copies_check" CHECK ("default_copies" BETWEEN 1 AND 10),
	CONSTRAINT "location_printer_settings_pending_command_type_check" CHECK ("pending_command_type" IS NULL OR "pending_command_type" IN ('rotate_token', 'force_update', 'reload_config'))
);--> statement-breakpoint
ALTER TABLE "location_printer_settings" ADD CONSTRAINT "location_printer_settings_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "location_printer_offline_idx" ON "location_printer_settings" ("last_seen_at") WHERE "status" = 'enabled';--> statement-breakpoint
CREATE INDEX "location_printer_status_idx" ON "location_printer_settings" ("status");
