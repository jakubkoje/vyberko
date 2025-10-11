CREATE TABLE "question_battery" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_slug" text NOT NULL,
	"question_sk" text NOT NULL,
	"question_en" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
