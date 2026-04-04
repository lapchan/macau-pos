-- Migration: Storefront tables for online customer-facing app
-- Date: 2026-04-05

-- ============================================================
-- 1. Modify existing tables: products + categories (add slug, images)
-- ============================================================

ALTER TABLE "products" ADD COLUMN "slug" varchar(200);
ALTER TABLE "products" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb;
CREATE UNIQUE INDEX "idx_products_tenant_slug" ON "products" ("tenant_id", "slug")
  WHERE "slug" IS NOT NULL AND "deleted_at" IS NULL;

ALTER TABLE "categories" ADD COLUMN "slug" varchar(100);
CREATE UNIQUE INDEX "idx_categories_tenant_slug" ON "categories" ("tenant_id", "slug")
  WHERE "slug" IS NOT NULL;

-- ============================================================
-- 2. New table: customers (must come before orders ALTER)
-- ============================================================

CREATE TABLE "customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "email" varchar(255),
  "phone" varchar(20),
  "password_hash" varchar(255),
  "avatar" varchar(500),
  "is_verified" boolean NOT NULL DEFAULT false,
  "locale" varchar(10) DEFAULT 'tc',
  "last_login_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "deleted_at" timestamp with time zone
);

CREATE UNIQUE INDEX "idx_customers_email" ON "customers" ("tenant_id", "email")
  WHERE "email" IS NOT NULL AND "deleted_at" IS NULL;
CREATE UNIQUE INDEX "idx_customers_phone" ON "customers" ("tenant_id", "phone")
  WHERE "phone" IS NOT NULL AND "deleted_at" IS NULL;
CREATE INDEX "idx_customers_tenant" ON "customers" ("tenant_id", "created_at");

-- ============================================================
-- 3. Modify orders table: add customer, channel, fulfillment
-- ============================================================

ALTER TABLE "orders" ADD COLUMN "customer_id" uuid REFERENCES "customers"("id") ON DELETE SET NULL;
ALTER TABLE "orders" ADD COLUMN "channel" varchar(10) NOT NULL DEFAULT 'pos';
ALTER TABLE "orders" ADD COLUMN "fulfillment_status" varchar(20);
ALTER TABLE "orders" ADD COLUMN "delivery_method" varchar(20);
ALTER TABLE "orders" ADD COLUMN "shipping_address" jsonb;
ALTER TABLE "orders" ADD COLUMN "tracking_number" varchar(100);
ALTER TABLE "orders" ADD COLUMN "courier_name" varchar(50);
ALTER TABLE "orders" ADD COLUMN "delivery_fee" decimal(10,2) DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "estimated_delivery_at" timestamp with time zone;
ALTER TABLE "orders" ADD COLUMN "fulfilled_at" timestamp with time zone;
ALTER TABLE "orders" ADD COLUMN "fulfillment_notes" varchar(1000);
ALTER TABLE "orders" ADD COLUMN "pickup_location_id" uuid REFERENCES "locations"("id") ON DELETE SET NULL;

CREATE INDEX "idx_orders_customer" ON "orders" ("customer_id", "created_at") WHERE "customer_id" IS NOT NULL;
CREATE INDEX "idx_orders_channel" ON "orders" ("tenant_id", "channel", "created_at");
CREATE INDEX "idx_orders_fulfillment" ON "orders" ("tenant_id", "fulfillment_status", "created_at") WHERE "fulfillment_status" IS NOT NULL;

-- ============================================================
-- 4. New table: customer_sessions
-- ============================================================

CREATE TABLE "customer_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "token" varchar(255) NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX "idx_customer_sessions_token" ON "customer_sessions" ("token");
CREATE INDEX "idx_customer_sessions_customer" ON "customer_sessions" ("customer_id");

-- ============================================================
-- 5. New table: customer_addresses
-- ============================================================

CREATE TABLE "customer_addresses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "label" varchar(50),
  "recipient_name" varchar(100) NOT NULL,
  "phone" varchar(20),
  "address_line1" varchar(500) NOT NULL,
  "address_line2" varchar(200),
  "district" varchar(100),
  "city" varchar(100) DEFAULT 'Macau',
  "postal_code" varchar(20),
  "country" varchar(50) DEFAULT 'MO',
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX "idx_addresses_customer" ON "customer_addresses" ("customer_id");

-- ============================================================
-- 6. New table: carts
-- ============================================================

CREATE TABLE "carts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "customer_id" uuid REFERENCES "customers"("id") ON DELETE CASCADE,
  "session_token" varchar(255),
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "idx_carts_session" ON "carts" ("session_token") WHERE "session_token" IS NOT NULL;
CREATE UNIQUE INDEX "idx_carts_customer" ON "carts" ("customer_id") WHERE "customer_id" IS NOT NULL;
CREATE INDEX "idx_carts_expires" ON "carts" ("expires_at") WHERE "customer_id" IS NULL;

-- ============================================================
-- 7. New table: cart_items
-- ============================================================

CREATE TABLE "cart_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "cart_id" uuid NOT NULL REFERENCES "carts"("id") ON DELETE CASCADE,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "variant_id" uuid REFERENCES "product_variants"("id") ON DELETE CASCADE,
  "quantity" integer NOT NULL DEFAULT 1 CHECK ("quantity" > 0),
  "added_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX "idx_cart_items_cart" ON "cart_items" ("cart_id");
CREATE UNIQUE INDEX "idx_cart_items_unique" ON "cart_items" ("cart_id", "product_id", COALESCE("variant_id", '00000000-0000-0000-0000-000000000000'));

-- ============================================================
-- 8. New table: verification_codes
-- ============================================================

CREATE TABLE "verification_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "target" varchar(255) NOT NULL,
  "code" varchar(6) NOT NULL,
  "purpose" varchar(20) NOT NULL DEFAULT 'login',
  "attempts" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 3,
  "expires_at" timestamp with time zone NOT NULL,
  "verified_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX "idx_verification_target" ON "verification_codes" ("tenant_id", "target", "created_at");
CREATE INDEX "idx_verification_expires" ON "verification_codes" ("expires_at");

-- ============================================================
-- 9. New table: storefront_configs
-- ============================================================

CREATE TABLE "storefront_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "location_id" uuid REFERENCES "locations"("id") ON DELETE CASCADE,
  "branding" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "header" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "homepage_sections" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "footer" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "idx_sf_config_tenant" ON "storefront_configs" ("tenant_id") WHERE "location_id" IS NULL;
CREATE UNIQUE INDEX "idx_sf_config_location" ON "storefront_configs" ("tenant_id", "location_id") WHERE "location_id" IS NOT NULL;
ALTER TABLE "storefront_configs" ADD CONSTRAINT "chk_sections_array" CHECK (jsonb_typeof("homepage_sections") = 'array');

-- ============================================================
-- 10. New table: storefront_pages
-- ============================================================

CREATE TABLE "storefront_pages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "slug" varchar(100) NOT NULL,
  "title" varchar(200) NOT NULL,
  "title_translations" jsonb DEFAULT '{}'::jsonb,
  "content" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "content_translations" jsonb DEFAULT '{}'::jsonb,
  "meta_description" varchar(500),
  "is_published" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "idx_sf_pages_slug" ON "storefront_pages" ("tenant_id", "slug");
CREATE INDEX "idx_sf_pages_published" ON "storefront_pages" ("tenant_id", "is_published", "sort_order");

-- ============================================================
-- 11. New table: delivery_zones
-- ============================================================

CREATE TABLE "delivery_zones" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "location_id" uuid NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
  "name" varchar(100) NOT NULL,
  "name_translations" jsonb DEFAULT '{}'::jsonb,
  "fee" decimal(10,2) NOT NULL,
  "min_order" decimal(10,2) DEFAULT 0,
  "free_above" decimal(10,2),
  "estimated_minutes" integer,
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX "idx_delivery_zones_location" ON "delivery_zones" ("tenant_id", "location_id", "is_active");

-- ============================================================
-- 12. Extend payment_method enum with online methods
-- ============================================================

ALTER TYPE "payment_method" ADD VALUE IF NOT EXISTS 'mpay';
ALTER TYPE "payment_method" ADD VALUE IF NOT EXISTS 'alipay';
ALTER TYPE "payment_method" ADD VALUE IF NOT EXISTS 'wechat_pay';
ALTER TYPE "payment_method" ADD VALUE IF NOT EXISTS 'visa';
ALTER TYPE "payment_method" ADD VALUE IF NOT EXISTS 'mastercard';
