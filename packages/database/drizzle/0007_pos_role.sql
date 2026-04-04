-- Add pos_role enum and column to users table
CREATE TYPE "public"."pos_role" AS ENUM('store_manager');

ALTER TABLE "users" ADD COLUMN "pos_role" "pos_role";

-- Migrate existing data: merchant_owner gets implicit POS access (no pos_role needed, handled in code)
-- Existing cashier users get store_manager POS role
UPDATE "users" SET "pos_role" = 'store_manager' WHERE "role" = 'cashier';
