CREATE TYPE "public"."order_status" AS ENUM('pending', 'completed', 'refunded', 'voided');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('tap', 'insert', 'qr', 'cash');--> statement-breakpoint
CREATE TYPE "public"."pos_role" AS ENUM('store_manager');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'active', 'inactive', 'sold_out');--> statement-breakpoint
CREATE TYPE "public"."shift_status" AS ENUM('open', 'pending_approval', 'closed', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'suspended', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."terminal_status" AS ENUM('active', 'disabled', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('platform_admin', 'merchant_owner', 'cashier', 'customer', 'promoter', 'accountant', 'potential_customer');--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"subscription_status" "subscription_status" DEFAULT 'trial' NOT NULL,
	"supported_locales" text[] DEFAULT '{en}' NOT NULL,
	"currency" varchar(10) DEFAULT 'MOP' NOT NULL,
	"default_locale" varchar(10) DEFAULT 'tc',
	"accent_color" varchar(20) DEFAULT '#4f6ef7',
	"theme" varchar(20) DEFAULT 'light',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"code" varchar(20) NOT NULL,
	"address" varchar(500),
	"phone" varchar(20),
	"email" varchar(255),
	"pricing_strategy_id" uuid,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"email" varchar(255),
	"phone" varchar(20),
	"name" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"pin" varchar(255),
	"avatar" varchar(500),
	"role" "user_role" NOT NULL,
	"pos_role" "pos_role",
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"terminal_id" uuid,
	"location_id" uuid,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"parent_category_id" uuid,
	"slug" varchar(100),
	"name" varchar(100) NOT NULL,
	"translations" jsonb DEFAULT '{}'::jsonb,
	"icon" varchar(50),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category_id" uuid,
	"name" varchar(255) NOT NULL,
	"translations" jsonb DEFAULT '{}'::jsonb,
	"description" varchar(1000),
	"desc_translations" jsonb DEFAULT '{}'::jsonb,
	"slug" varchar(200),
	"sku" varchar(100),
	"barcode" varchar(100),
	"image" varchar(500),
	"images" jsonb DEFAULT '[]'::jsonb,
	"selling_price" numeric(10, 2) NOT NULL,
	"original_price" numeric(10, 2),
	"stock" integer,
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"has_variants" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "option_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"translations" jsonb DEFAULT '{}'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "option_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"value" varchar(100) NOT NULL,
	"translations" jsonb DEFAULT '{}'::jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(100),
	"barcode" varchar(100),
	"name" varchar(255) NOT NULL,
	"selling_price" numeric(10, 2) NOT NULL,
	"original_price" numeric(10, 2),
	"stock" integer,
	"image" varchar(500),
	"option_combo" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_strategy_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"selling_price" numeric(10, 2),
	"original_price" numeric(10, 2),
	"stock" integer,
	"is_available" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"shop_name" varchar(200),
	"address" text,
	"phone" varchar(30),
	"email" varchar(200),
	"logo" varchar(500),
	"business_hours" jsonb DEFAULT '[]',
	"tax_rate" numeric(5, 2) DEFAULT '0.00',
	"payment_cash" boolean DEFAULT true NOT NULL,
	"payment_card" boolean DEFAULT true NOT NULL,
	"payment_mpay" boolean DEFAULT false NOT NULL,
	"payment_alipay" boolean DEFAULT false NOT NULL,
	"payment_wechat" boolean DEFAULT false NOT NULL,
	"receipt_header" text,
	"receipt_footer" text,
	"receipt_show_address" boolean DEFAULT true NOT NULL,
	"receipt_show_phone" boolean DEFAULT true NOT NULL,
	"receipt_show_tax" boolean DEFAULT false NOT NULL,
	"print_mode" varchar(20) DEFAULT 'browser' NOT NULL,
	"print_server_url" varchar(500) DEFAULT 'http://localhost:9100',
	"online_enabled" boolean DEFAULT false NOT NULL,
	"online_url" varchar(500),
	"online_description" text,
	"online_banner" varchar(500),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_settings_location_id_unique" UNIQUE("location_id")
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"cashier_id" uuid NOT NULL,
	"terminal_id" uuid,
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
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"status" "order_status" DEFAULT 'completed' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"item_count" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'MOP' NOT NULL,
	"notes" varchar(500),
	"cashier_id" uuid,
	"shift_id" uuid,
	"terminal_id" uuid,
	"customer_id" uuid,
	"channel" varchar(10) DEFAULT 'pos' NOT NULL,
	"fulfillment_status" varchar(20),
	"delivery_method" varchar(20),
	"shipping_address" jsonb,
	"tracking_number" varchar(100),
	"courier_name" varchar(50),
	"delivery_fee" numeric(10, 2) DEFAULT '0',
	"estimated_delivery_at" timestamp with time zone,
	"fulfilled_at" timestamp with time zone,
	"fulfillment_notes" varchar(1000),
	"pickup_location_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"variant_name" varchar(255),
	"option_combo" jsonb,
	"name" varchar(255) NOT NULL,
	"translations" jsonb DEFAULT '{}'::jsonb,
	"unit_price" numeric(10, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0',
	"discount_note" varchar(100),
	"line_total" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"cash_received" numeric(10, 2),
	"change_given" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terminals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"activation_code" varchar(20),
	"location" varchar(200),
	"device_info" jsonb DEFAULT '{}',
	"status" "terminal_status" DEFAULT 'active' NOT NULL,
	"last_heartbeat_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"current_user_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terminal_cash_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"shift_id" uuid,
	"terminal_id" uuid,
	"event_type" varchar(50) NOT NULL,
	"credit_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"debit_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"balance_after" numeric(10, 2) NOT NULL,
	"order_id" uuid,
	"payment_id" uuid,
	"recorded_by" uuid NOT NULL,
	"authorized_by" uuid,
	"reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"password_hash" varchar(255),
	"avatar" varchar(500),
	"is_verified" boolean DEFAULT false NOT NULL,
	"locale" varchar(10) DEFAULT 'tc',
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "customer_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"label" varchar(50),
	"recipient_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"address_line1" varchar(500) NOT NULL,
	"address_line2" varchar(200),
	"district" varchar(100),
	"city" varchar(100) DEFAULT 'Macau',
	"postal_code" varchar(20),
	"country" varchar(50) DEFAULT 'MO',
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid,
	"session_token" varchar(255),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"target" varchar(255) NOT NULL,
	"code" varchar(6) NOT NULL,
	"purpose" varchar(20) DEFAULT 'login' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid,
	"branding" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"header" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"homepage_sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"footer" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" varchar(200) NOT NULL,
	"title_translations" jsonb DEFAULT '{}'::jsonb,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"content_translations" jsonb DEFAULT '{}'::jsonb,
	"meta_description" varchar(500),
	"is_published" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_translations" jsonb DEFAULT '{}'::jsonb,
	"fee" numeric(10, 2) NOT NULL,
	"min_order" numeric(10, 2) DEFAULT '0',
	"free_above" numeric(10, 2),
	"estimated_minutes" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_pricing_strategy_id_pricing_strategies_id_fk" FOREIGN KEY ("pricing_strategy_id") REFERENCES "public"."pricing_strategies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_locations" ADD CONSTRAINT "user_locations_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_terminal_id_terminals_id_fk" FOREIGN KEY ("terminal_id") REFERENCES "public"."terminals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_groups" ADD CONSTRAINT "option_groups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_groups" ADD CONSTRAINT "option_groups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "option_values" ADD CONSTRAINT "option_values_group_id_option_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."option_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_strategies" ADD CONSTRAINT "pricing_strategies_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_strategy_items" ADD CONSTRAINT "pricing_strategy_items_strategy_id_pricing_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."pricing_strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_strategy_items" ADD CONSTRAINT "pricing_strategy_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_strategy_items" ADD CONSTRAINT "pricing_strategy_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_settings" ADD CONSTRAINT "shop_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_settings" ADD CONSTRAINT "shop_settings_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_terminal_id_terminals_id_fk" FOREIGN KEY ("terminal_id") REFERENCES "public"."terminals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cashier_id_users_id_fk" FOREIGN KEY ("cashier_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_terminal_id_terminals_id_fk" FOREIGN KEY ("terminal_id") REFERENCES "public"."terminals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_pickup_location_id_locations_id_fk" FOREIGN KEY ("pickup_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminals" ADD CONSTRAINT "terminals_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminals" ADD CONSTRAINT "terminals_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminals" ADD CONSTRAINT "terminals_current_user_id_users_id_fk" FOREIGN KEY ("current_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_cash_log" ADD CONSTRAINT "terminal_cash_log_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_cash_log" ADD CONSTRAINT "terminal_cash_log_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_cash_log" ADD CONSTRAINT "terminal_cash_log_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_cash_log" ADD CONSTRAINT "terminal_cash_log_terminal_id_terminals_id_fk" FOREIGN KEY ("terminal_id") REFERENCES "public"."terminals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_cash_log" ADD CONSTRAINT "terminal_cash_log_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_cash_log" ADD CONSTRAINT "terminal_cash_log_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_cash_log" ADD CONSTRAINT "terminal_cash_log_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_cash_log" ADD CONSTRAINT "terminal_cash_log_authorized_by_users_id_fk" FOREIGN KEY ("authorized_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_sessions" ADD CONSTRAINT "customer_sessions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_configs" ADD CONSTRAINT "storefront_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_configs" ADD CONSTRAINT "storefront_configs_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_pages" ADD CONSTRAINT "storefront_pages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_locations_tenant_slug" ON "locations" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_locations_tenant_code" ON "locations" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_locations_tenant_active" ON "locations" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_locations_unique" ON "user_locations" USING btree ("user_id","location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email" ON "users" USING btree ("email") WHERE "users"."email" IS NOT NULL AND "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_phone" ON "users" USING btree ("phone") WHERE "users"."phone" IS NOT NULL AND "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_users_tenant_role" ON "users" USING btree ("tenant_id","role");--> statement-breakpoint
CREATE INDEX "idx_sessions_token" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_categories_tenant" ON "categories" USING btree ("tenant_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_categories_tenant_slug" ON "categories" USING btree ("tenant_id","slug") WHERE "categories"."slug" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_products_tenant_cat" ON "products" USING btree ("tenant_id","category_id","status");--> statement-breakpoint
CREATE INDEX "idx_products_tenant_status" ON "products" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_products_barcode" ON "products" USING btree ("tenant_id","barcode");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_products_tenant_slug" ON "products" USING btree ("tenant_id","slug") WHERE "products"."slug" IS NOT NULL AND "products"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_option_groups_product" ON "option_groups" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_option_values_group" ON "option_values" USING btree ("group_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_variants_product" ON "product_variants" USING btree ("product_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_variants_tenant_sku" ON "product_variants" USING btree ("tenant_id","sku");--> statement-breakpoint
CREATE INDEX "idx_variants_tenant_barcode" ON "product_variants" USING btree ("tenant_id","barcode");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pricing_strategies_tenant_name" ON "pricing_strategies" USING btree ("tenant_id","name");--> statement-breakpoint
CREATE INDEX "idx_pricing_strategies_tenant_active" ON "pricing_strategies" USING btree ("tenant_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_strategy_items_product" ON "pricing_strategy_items" USING btree ("strategy_id","product_id");--> statement-breakpoint
CREATE INDEX "idx_strategy_items_available" ON "pricing_strategy_items" USING btree ("strategy_id","is_available");--> statement-breakpoint
CREATE INDEX "idx_shifts_tenant_cashier" ON "shifts" USING btree ("tenant_id","cashier_id","opened_at");--> statement-breakpoint
CREATE INDEX "idx_shifts_tenant_status" ON "shifts" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "idx_orders_tenant_date" ON "orders" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_cashier" ON "orders" USING btree ("cashier_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_orders_tenant_number" ON "orders" USING btree ("tenant_id","order_number");--> statement-breakpoint
CREATE INDEX "idx_orders_customer" ON "orders" USING btree ("customer_id","created_at") WHERE "orders"."customer_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_orders_channel" ON "orders" USING btree ("tenant_id","channel","created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_fulfillment" ON "orders" USING btree ("tenant_id","fulfillment_status","created_at") WHERE "orders"."fulfillment_status" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_order_items_order" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_payments_order" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_terminals_tenant_code" ON "terminals" USING btree ("tenant_id","code");--> statement-breakpoint
CREATE INDEX "idx_terminals_tenant_status" ON "terminals" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_terminals_activation_code" ON "terminals" USING btree ("activation_code");--> statement-breakpoint
CREATE INDEX "idx_cash_log_shift" ON "terminal_cash_log" USING btree ("shift_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_cash_log_terminal" ON "terminal_cash_log" USING btree ("terminal_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_customers_email" ON "customers" USING btree ("tenant_id","email") WHERE "customers"."email" IS NOT NULL AND "customers"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_customers_phone" ON "customers" USING btree ("tenant_id","phone") WHERE "customers"."phone" IS NOT NULL AND "customers"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_customers_tenant" ON "customers" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_customer_sessions_token" ON "customer_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_customer_sessions_customer" ON "customer_sessions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_addresses_customer" ON "customer_addresses" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_carts_session" ON "carts" USING btree ("session_token") WHERE "carts"."session_token" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_carts_customer" ON "carts" USING btree ("customer_id") WHERE "carts"."customer_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_carts_expires" ON "carts" USING btree ("expires_at") WHERE "carts"."customer_id" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_cart_items_cart" ON "cart_items" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "idx_verification_target" ON "verification_codes" USING btree ("tenant_id","target","created_at");--> statement-breakpoint
CREATE INDEX "idx_verification_expires" ON "verification_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sf_pages_slug" ON "storefront_pages" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "idx_sf_pages_published" ON "storefront_pages" USING btree ("tenant_id","is_published","sort_order");--> statement-breakpoint
CREATE INDEX "idx_delivery_zones_location" ON "delivery_zones" USING btree ("tenant_id","location_id","is_active");