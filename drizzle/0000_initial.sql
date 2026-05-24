CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_url" text NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"race_at" date,
	"start_time" text,
	"distances" text NOT NULL,
	"category" text NOT NULL,
	"image_url" text NOT NULL,
	"image_source" text DEFAULT 'listing' NOT NULL,
	"contact_info" text,
	"website" text NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"publish_at" date,
	"status" text NOT NULL,
	"published_real_at" timestamp with time zone,
	"instagram_post_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "events_source_url_uidx" ON "events" USING btree ("source_url");