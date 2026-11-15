CREATE TABLE IF NOT EXISTS "seksek_rate" (
  "key" text PRIMARY KEY NOT NULL,
  "count" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS "seksek_rate_expires_idx" ON "seksek_rate" ("expires_at")
