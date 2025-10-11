CREATE TABLE "exam_criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"procedure_id" integer NOT NULL,
	"name" text NOT NULL,
	"min_rating" integer DEFAULT 1 NOT NULL,
	"max_rating" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"contender_id" integer NOT NULL,
	"criteria_id" integer NOT NULL,
	"score" integer NOT NULL,
	"evaluated_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_criteria" ADD CONSTRAINT "exam_criteria_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_contender_id_contenders_id_fk" FOREIGN KEY ("contender_id") REFERENCES "public"."contenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_criteria_id_exam_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."exam_criteria"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_evaluated_by_id_users_id_fk" FOREIGN KEY ("evaluated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contender_criteria_idx" ON "exam_scores" USING btree ("contender_id","criteria_id");