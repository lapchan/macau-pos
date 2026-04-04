-- Migration: Add product variants (option groups system)

-- 1. Add has_variants flag to products
ALTER TABLE "products" ADD COLUMN "has_variants" boolean NOT NULL DEFAULT false;

-- 2. Create option_groups table
CREATE TABLE IF NOT EXISTS "option_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "translations" jsonb DEFAULT '{}'::jsonb,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_option_groups_product" ON "option_groups" ("product_id", "sort_order");

-- 3. Create option_values table
CREATE TABLE IF NOT EXISTS "option_values" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "group_id" uuid NOT NULL REFERENCES "option_groups"("id") ON DELETE CASCADE,
  "value" varchar(100) NOT NULL,
  "translations" jsonb DEFAULT '{}'::jsonb,
  "sort_order" integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "idx_option_values_group" ON "option_values" ("group_id", "sort_order");

-- 4. Create product_variants table
CREATE TABLE IF NOT EXISTS "product_variants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "sku" varchar(100),
  "barcode" varchar(100),
  "name" varchar(255) NOT NULL,
  "selling_price" decimal(10,2) NOT NULL,
  "original_price" decimal(10,2),
  "stock" integer,
  "image" varchar(500),
  "option_combo" jsonb NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_variants_product" ON "product_variants" ("product_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_variants_tenant_sku" ON "product_variants" ("tenant_id", "sku");
CREATE INDEX IF NOT EXISTS "idx_variants_tenant_barcode" ON "product_variants" ("tenant_id", "barcode");

-- 5. Add variant tracking columns to order_items
ALTER TABLE "order_items" ADD COLUMN "variant_id" uuid REFERENCES "product_variants"("id") ON DELETE SET NULL;
ALTER TABLE "order_items" ADD COLUMN "variant_name" varchar(255);
ALTER TABLE "order_items" ADD COLUMN "option_combo" jsonb;
