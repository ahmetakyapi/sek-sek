ALTER TABLE "seksek_scores" ADD COLUMN IF NOT EXISTS "min_deaths" integer;
ALTER TABLE "seksek_scores" ADD COLUMN IF NOT EXISTS "max_items" integer;
ALTER TABLE "seksek_scores" ADD COLUMN IF NOT EXISTS "plays" integer DEFAULT 1 NOT NULL;
UPDATE "seksek_scores" SET "min_deaths" = "deaths" WHERE "min_deaths" IS NULL;
UPDATE "seksek_scores" SET "max_items" = "items" WHERE "max_items" IS NULL
