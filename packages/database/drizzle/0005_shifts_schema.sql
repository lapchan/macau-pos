-- Migration: Add shifts table + shift_id/cashier_id to orders
-- Phase 2 future-proofing for Staff Daily Settlement (員工每日結數)

-- 1. Create shift_status enum
DO $$ BEGIN
  CREATE TYPE "shift_status" AS ENUM ('open', 'pending_approval', 'closed', 'flagged');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create shifts table
CREATE TABLE IF NOT EXISTS "shifts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "cashier_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "terminal_id" varchar(100),
  "opened_at" timestamp with time zone DEFAULT now() NOT NULL,
  "closed_at" timestamp with time zone,
  "opening_float" numeric(10, 2) DEFAULT '0' NOT NULL,
  "expected_cash" numeric(10, 2) DEFAULT '0' NOT NULL,
  "actual_cash" numeric(10, 2),
  "variance" numeric(10, 2),
  "total_sales" numeric(10, 2) DEFAULT '0' NOT NULL,
  "total_orders" integer DEFAULT 0 NOT NULL,
  "payment_breakdown" jsonb,
  "status" "shift_status" DEFAULT 'open' NOT NULL,
  "approved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "approved_at" timestamp with time zone,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Add indexes to shifts
CREATE INDEX IF NOT EXISTS "idx_shifts_tenant_cashier" ON "shifts" ("tenant_id", "cashier_id", "opened_at");
CREATE INDEX IF NOT EXISTS "idx_shifts_tenant_status" ON "shifts" ("tenant_id", "status");

-- 4. Add cashier_id and shift_id columns to orders (nullable — backward compatible)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cashier_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shift_id" uuid REFERENCES "shifts"("id") ON DELETE SET NULL;

-- 5. Add cashier index on orders for shift summary queries
CREATE INDEX IF NOT EXISTS "idx_orders_cashier" ON "orders" ("cashier_id", "created_at");
