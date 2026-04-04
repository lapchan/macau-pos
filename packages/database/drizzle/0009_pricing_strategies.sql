-- Pricing Strategies: Named price/availability groupings assignable to locations
-- Enables per-location product pricing, stock overrides, and availability control

-- 1. Create pricing_strategies table
CREATE TABLE "pricing_strategies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "description" varchar(500),
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE UNIQUE INDEX "idx_pricing_strategies_tenant_name"
  ON "pricing_strategies" USING btree ("tenant_id", "name");
--> statement-breakpoint
CREATE INDEX "idx_pricing_strategies_tenant_active"
  ON "pricing_strategies" USING btree ("tenant_id", "is_active");
--> statement-breakpoint

-- 2. Create pricing_strategy_items table
CREATE TABLE "pricing_strategy_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "strategy_id" uuid NOT NULL REFERENCES "pricing_strategies"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "variant_id" uuid REFERENCES "product_variants"("id") ON DELETE CASCADE,
  "selling_price" decimal(10,2),
  "original_price" decimal(10,2),
  "stock" integer,
  "is_available" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

-- Unique: one override per product per strategy (base product, variant_id IS NULL)
CREATE UNIQUE INDEX "idx_strategy_items_product"
  ON "pricing_strategy_items" ("strategy_id", "product_id") WHERE "variant_id" IS NULL;
--> statement-breakpoint
-- Unique: one override per variant per strategy
CREATE UNIQUE INDEX "idx_strategy_items_variant"
  ON "pricing_strategy_items" ("strategy_id", "product_id", "variant_id") WHERE "variant_id" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX "idx_strategy_items_available"
  ON "pricing_strategy_items" USING btree ("strategy_id", "is_available");
--> statement-breakpoint

-- 3. Add pricing_strategy_id to locations
ALTER TABLE "locations" ADD COLUMN "pricing_strategy_id" uuid
  REFERENCES "pricing_strategies"("id") ON DELETE SET NULL;
