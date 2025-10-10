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
ALTER TABLE "contender_files" ADD CONSTRAINT "contender_files_contender_id_contenders_id_fk" FOREIGN KEY ("contender_id") REFERENCES "public"."contenders"("id") ON DELETE cascade ON UPDATE no action;