-- Terminal management: terminals table + terminal_id on orders/sessions/shifts

-- 1. Create terminal_status enum
DO $$ BEGIN
  CREATE TYPE "terminal_status" AS ENUM ('active', 'disabled', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create terminals table
CREATE TABLE IF NOT EXISTS "terminals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "code" varchar(20) NOT NULL,
  "activation_code" varchar(20),
  "location" varchar(200),
  "device_info" jsonb DEFAULT '{}',
  "status" "terminal_status" NOT NULL DEFAULT 'active',
  "last_heartbeat_at" timestamp with time zone,
  "activated_at" timestamp with time zone,
  "current_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "notes" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Indexes for terminals
CREATE UNIQUE INDEX IF NOT EXISTS "idx_terminals_tenant_code" ON "terminals" ("tenant_id", "code");
CREATE INDEX IF NOT EXISTS "idx_terminals_tenant_status" ON "terminals" ("tenant_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_terminals_activation_code" ON "terminals" ("activation_code")
  WHERE "activation_code" IS NOT NULL;

-- 4. Add terminal_id to orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "terminal_id" uuid REFERENCES "terminals"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "idx_orders_terminal" ON "orders" ("terminal_id", "created_at" DESC)
  WHERE "terminal_id" IS NOT NULL;

-- 5. Add terminal_id to sessions
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "terminal_id" uuid REFERENCES "terminals"("id") ON DELETE SET NULL;

-- 6. Update shifts.terminal_id from varchar to uuid FK
-- First check if it's varchar (from the original schema) and convert
DO $$
BEGIN
  -- Drop old varchar column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'terminal_id'
    AND data_type = 'character varying'
  ) THEN
    ALTER TABLE "shifts" DROP COLUMN "terminal_id";
  END IF;

  -- Add uuid FK column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shifts' AND column_name = 'terminal_id'
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE "shifts" ADD COLUMN "terminal_id" uuid REFERENCES "terminals"("id") ON DELETE SET NULL;
  END IF;
END $$;
