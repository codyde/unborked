CREATE TABLE "feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"value" boolean DEFAULT false NOT NULL,
	"description" text,
	"last_updated_by" varchar(255),
	"last_updated_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "feature_flags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "flags" (
	"name" text PRIMARY KEY NOT NULL,
	"defaultValue" boolean NOT NULL
);
