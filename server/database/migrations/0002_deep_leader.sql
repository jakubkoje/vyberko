ALTER TABLE "procedure_assignments" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "procedure_assignments" ADD COLUMN "accepted_at" timestamp with time zone;