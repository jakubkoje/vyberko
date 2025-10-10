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
ALTER TABLE "contenders" ADD CONSTRAINT "contenders_procedure_id_procedures_id_fk" FOREIGN KEY ("procedure_id") REFERENCES "public"."procedures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;