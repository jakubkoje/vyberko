ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "keycloak_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auth_provider" text DEFAULT 'local' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_keycloak_id_unique" UNIQUE("keycloak_id");