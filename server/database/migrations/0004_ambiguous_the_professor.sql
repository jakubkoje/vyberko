CREATE TABLE "oral_exam_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_sk" text NOT NULL,
	"name_en" text NOT NULL,
	"description" text,
	"min_rating" integer DEFAULT 1 NOT NULL,
	"max_rating" integer DEFAULT 5 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oral_exam_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "written_exam_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name_sk" text NOT NULL,
	"name_en" text NOT NULL,
	"description" text,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "written_exam_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "contenders" ALTER COLUMN "status" SET DEFAULT 'registered';--> statement-breakpoint
ALTER TABLE "procedures" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "contenders" ADD COLUMN "cis_identifier" text;--> statement-breakpoint
UPDATE "contenders" SET "cis_identifier" = 'CIS-' || id::text WHERE "cis_identifier" IS NULL;--> statement-breakpoint
ALTER TABLE "contenders" ALTER COLUMN "cis_identifier" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "contenders" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "identifier" text;--> statement-breakpoint
UPDATE "procedures" SET "identifier" = 'VK/' || EXTRACT(YEAR FROM created_at)::text || '/' || LPAD(id::text, 4, '0') WHERE "identifier" IS NULL;--> statement-breakpoint
ALTER TABLE "procedures" ALTER COLUMN "identifier" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "procedure_type" text;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "organizational_unit" text;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "civil_service_sector" text;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "position_title" text;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "service_type" text;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "procedure_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "procedures" ADD COLUMN "number_of_positions" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "requires_2fa" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "contenders" ADD CONSTRAINT "contenders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contender_cis_procedure_idx" ON "contenders" USING btree ("cis_identifier","procedure_id");--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_identifier_unique" UNIQUE("identifier");