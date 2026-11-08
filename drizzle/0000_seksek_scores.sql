CREATE TABLE IF NOT EXISTS "seksek_scores" (
  "id" serial PRIMARY KEY,
  "level" text NOT NULL,
  "name" text NOT NULL,
  "time_ms" integer NOT NULL,
  "deaths" integer NOT NULL,
  "items" integer NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "seksek_scores_level_time_idx" ON "seksek_scores" ("level", "time_ms");
