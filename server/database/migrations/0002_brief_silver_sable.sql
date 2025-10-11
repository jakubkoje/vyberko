ALTER TABLE "surveys" ADD COLUMN "status" text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "surveys" ADD COLUMN "rejection_reason" text;