-- Add category column as nullable first
ALTER TABLE "surveys" ADD COLUMN "category" text;--> statement-breakpoint
-- Set default value for existing surveys
UPDATE "surveys" SET "category" = 'written_exam' WHERE "category" IS NULL;--> statement-breakpoint
-- Make it NOT NULL
ALTER TABLE "surveys" ALTER COLUMN "category" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "procedure_surveys" DROP COLUMN "category";