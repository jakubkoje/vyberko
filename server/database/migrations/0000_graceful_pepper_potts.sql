CREATE TABLE "contender_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"contender_id" integer NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"sharepoint_id" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contenders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"procedure_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "procedures" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"organization_id" integer NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"permissions" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text DEFAULT 'Untitled Survey' NOT NULL,
	"json_data" jsonb NOT NULL,
	"organization_id" integer NOT NULL,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"organization_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"avatar" text NOT NULL,
	"current_organization_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "contender_files" ADD CONSTRAINT "contender_files_contender_id_contenders_id_fk" FOREIGN KEY ("contender_id") REFERENCES "public"."contenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contenders" ADD CONSTRAINT "contenders_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_criteria" ADD CONSTRAINT "exam_criteria_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_contender_id_contenders_id_fk" FOREIGN KEY ("contender_id") REFERENCES "public"."contenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_criteria_id_exam_criteria_id_fk" FOREIGN KEY ("criteria_id") REFERENCES "public"."exam_criteria"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_evaluated_by_id_users_id_fk" FOREIGN KEY ("evaluated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_current_organization_id_organizations_id_fk" FOREIGN KEY ("current_organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contender_criteria_idx" ON "exam_scores" USING btree ("contender_id","criteria_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_org_idx" ON "user_organizations" USING btree ("user_id","organization_id");