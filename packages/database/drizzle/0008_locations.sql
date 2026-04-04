-- Multi-Location Architecture: Add locations layer between tenant and operational data
-- Enables one merchant to manage multiple physical locations (stores/branches)

-- 1. Add org-wide settings to tenants (moved from shop_settings)
ALTER TABLE "tenants" ADD COLUMN "currency" varchar(10) NOT NULL DEFAULT 'MOP';
ALTER TABLE "tenants" ADD COLUMN "default_locale" varchar(10) DEFAULT 'tc';
ALTER TABLE "tenants" ADD COLUMN "accent_color" varchar(20) DEFAULT '#4f6ef7';
ALTER TABLE "tenants" ADD COLUMN "theme" varchar(20) DEFAULT 'light';
--> statement-breakpoint

-- 2. Copy org-wide values from shop_settings → tenants
UPDATE "tenants" t SET
  "currency" = COALESCE(s."currency", 'MOP'),
  "default_locale" = COALESCE(s."default_locale", 'tc'),
  "accent_color" = COALESCE(s."accent_color", '#4f6ef7'),
  "theme" = COALESCE(s."theme", 'light')
FROM "shop_settings" s WHERE s."tenant_id" = t."id";
--> statement-breakpoint

-- 3. Create locations table
CREATE TABLE "locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "slug" varchar(50) NOT NULL,
  "code" varchar(20) NOT NULL,
  "address" varchar(500),
  "phone" varchar(20),
  "email" varchar(255),
  "is_default" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE UNIQUE INDEX "idx_locations_tenant_slug" ON "locations" USING btree ("tenant_id", "slug");
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_locations_tenant_code" ON "locations" USING btree ("tenant_id", "code");
--> statement-breakpoint
CREATE INDEX "idx_locations_tenant_active" ON "locations" USING btree ("tenant_id", "is_active");
--> statement-breakpoint

-- 4. Insert default location per tenant (using shop_settings data where available)
INSERT INTO "locations" ("id", "tenant_id", "name", "slug", "code", "address", "phone", "email", "is_default")
SELECT gen_random_uuid(), t."id",
       COALESCE(s."shop_name", t."name"),
       'main', 'L-001',
       SUBSTRING(s."address" FROM 1 FOR 500),
       SUBSTRING(s."phone" FROM 1 FOR 20),
       SUBSTRING(s."email" FROM 1 FOR 200),
       true
FROM "tenants" t
LEFT JOIN "shop_settings" s ON s."tenant_id" = t."id";
--> statement-breakpoint

-- 5. Add location_id columns (nullable first for backfill)
ALTER TABLE "terminals" ADD COLUMN "location_id" uuid REFERENCES "locations"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "location_id" uuid REFERENCES "locations"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "shifts" ADD COLUMN "location_id" uuid REFERENCES "locations"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "location_id" uuid REFERENCES "locations"("id") ON DELETE SET NULL;
--> statement-breakpoint

-- 6. Backfill location_id from tenant's default location
UPDATE "terminals" SET "location_id" = (
  SELECT "id" FROM "locations" WHERE "tenant_id" = "terminals"."tenant_id" AND "is_default" = true LIMIT 1
);
--> statement-breakpoint
UPDATE "orders" SET "location_id" = (
  SELECT "id" FROM "locations" WHERE "tenant_id" = "orders"."tenant_id" AND "is_default" = true LIMIT 1
);
--> statement-breakpoint
UPDATE "shifts" SET "location_id" = (
  SELECT "id" FROM "locations" WHERE "tenant_id" = "shifts"."tenant_id" AND "is_default" = true LIMIT 1
);
--> statement-breakpoint

-- 7. Make NOT NULL (except sessions where location is optional for admin sessions)
ALTER TABLE "terminals" ALTER COLUMN "location_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "location_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "shifts" ALTER COLUMN "location_id" SET NOT NULL;
--> statement-breakpoint

-- 8. Transform shop_settings: add location_id, migrate, change unique constraint
ALTER TABLE "shop_settings" ADD COLUMN "location_id" uuid REFERENCES "locations"("id") ON DELETE CASCADE;
--> statement-breakpoint
UPDATE "shop_settings" ss SET "location_id" = (
  SELECT "id" FROM "locations" WHERE "tenant_id" = ss."tenant_id" AND "is_default" = true LIMIT 1
);
--> statement-breakpoint
ALTER TABLE "shop_settings" ALTER COLUMN "location_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "shop_settings" DROP CONSTRAINT IF EXISTS "shop_settings_tenant_id_unique";
--> statement-breakpoint
ALTER TABLE "shop_settings" ADD CONSTRAINT "shop_settings_location_id_unique" UNIQUE("location_id");
--> statement-breakpoint

-- 9. Drop org-wide columns from shop_settings (now on tenants)
ALTER TABLE "shop_settings" DROP COLUMN IF EXISTS "currency";
--> statement-breakpoint
ALTER TABLE "shop_settings" DROP COLUMN IF EXISTS "default_locale";
--> statement-breakpoint
ALTER TABLE "shop_settings" DROP COLUMN IF EXISTS "accent_color";
--> statement-breakpoint
ALTER TABLE "shop_settings" DROP COLUMN IF EXISTS "theme";
--> statement-breakpoint

-- 10. Create user_locations junction table
CREATE TABLE "user_locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "location_id" uuid NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE UNIQUE INDEX "idx_user_locations_unique" ON "user_locations" USING btree ("user_id", "location_id");
