ALTER TYPE "public"."payment_method" ADD VALUE 'online';--> statement-breakpoint
CREATE TABLE "intellipay_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_id" varchar(64) NOT NULL,
	"event_type" varchar(32) NOT NULL,
	"payment_id" uuid,
	"raw_body" text NOT NULL,
	"status" varchar(16) NOT NULL,
	"error_message" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "provider" varchar(16);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_payment_id" varchar(64);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_order_id" varchar(32);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_payment_service" varchar(32);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_terminal_id" varchar(64);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_status" integer;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_status_desc" varchar(32);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_payment_url" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_qr_code_url" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_provider_code" varchar(16);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_webhook_url" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_request_id" varchar(64);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_last_event_id" varchar(64);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "intellipay_last_event_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "intellipay_webhook_events" ADD CONSTRAINT "intellipay_webhook_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intellipay_webhook_events" ADD CONSTRAINT "intellipay_webhook_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_intellipay_events_tenant_event" ON "intellipay_webhook_events" USING btree ("tenant_id","event_id");--> statement-breakpoint
CREATE INDEX "idx_intellipay_events_payment" ON "intellipay_webhook_events" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_intellipay_events_received" ON "intellipay_webhook_events" USING btree ("received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payments_intellipay_payment_id" ON "payments" USING btree ("intellipay_payment_id") WHERE "payments"."intellipay_payment_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payments_intellipay_order_id" ON "payments" USING btree ("intellipay_order_id") WHERE "payments"."intellipay_order_id" IS NOT NULL;