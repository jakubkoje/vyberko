CREATE TABLE "procedure_surveys" (
	"id" serial PRIMARY KEY NOT NULL,
	"procedure_id" integer NOT NULL,
	"survey_id" integer NOT NULL,
	"category" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "procedures" DROP CONSTRAINT "procedures_survey_id_surveys_id_fk";
--> statement-breakpoint
ALTER TABLE "procedure_surveys" ADD CONSTRAINT "procedure_surveys_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedure_surveys" ADD CONSTRAINT "procedure_surveys_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "procedure_survey_idx" ON "procedure_surveys" USING btree ("survey_id");--> statement-breakpoint
ALTER TABLE "procedures" DROP COLUMN "survey_id";