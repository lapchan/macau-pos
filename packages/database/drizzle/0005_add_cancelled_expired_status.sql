ALTER TYPE "public"."order_status" ADD VALUE IF NOT EXISTS 'cancelled';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE IF NOT EXISTS 'expired';
