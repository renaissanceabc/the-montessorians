CREATE TYPE "public"."education_type" AS ENUM('montessori', 'homeschool', 'other');--> statement-breakpoint
CREATE TYPE "public"."link_type" AS ENUM('wikipedia', 'website', 'linkedin', 'x', 'tiktok', 'instagram', 'article', 'youtube', 'imdb');--> statement-breakpoint
CREATE TABLE "daily_feature" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"profile_slug" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "daily_feature_date_key" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_slug" text NOT NULL,
	"type" "link_type" NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "profile_tags" (
	"profile_slug" text NOT NULL,
	"tag_slug" text NOT NULL,
	CONSTRAINT "profile_tags_pkey" PRIMARY KEY("profile_slug","tag_slug")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"bio" text,
	"education_notes" text,
	"education" "education_type"[],
	"notable_achievements" text[],
	"image_url" text,
	"featured_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"quotes" text[],
	CONSTRAINT "slug_format_check" CHECK (slug ~ '^[a-z0-9-]+$'::text)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"slug" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "tag_slug_format_check" CHECK (slug ~ '^[a-z0-9-]+$'::text)
);
--> statement-breakpoint
ALTER TABLE "daily_feature" ADD CONSTRAINT "daily_feature_profile_slug_fkey" FOREIGN KEY ("profile_slug") REFERENCES "public"."profiles"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_profile_slug_fkey" FOREIGN KEY ("profile_slug") REFERENCES "public"."profiles"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_tags" ADD CONSTRAINT "profile_tags_profile_slug_fkey" FOREIGN KEY ("profile_slug") REFERENCES "public"."profiles"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_tags" ADD CONSTRAINT "profile_tags_tag_slug_fkey" FOREIGN KEY ("tag_slug") REFERENCES "public"."tags"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_feature_date_idx" ON "daily_feature" USING btree ("date" date_ops);--> statement-breakpoint
CREATE INDEX "links_profile_slug_idx" ON "links" USING btree ("profile_slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "links_profile_slug_type_idx" ON "links" USING btree ("profile_slug" text_ops,"type","url" text_ops);--> statement-breakpoint
CREATE INDEX "profile_tags_profile_slug_idx" ON "profile_tags" USING btree ("profile_slug" text_ops);--> statement-breakpoint
CREATE INDEX "profile_tags_tag_slug_idx" ON "profile_tags" USING btree ("tag_slug" text_ops);--> statement-breakpoint
CREATE INDEX "profiles_slug_idx" ON "profiles" USING btree ("slug" text_ops);