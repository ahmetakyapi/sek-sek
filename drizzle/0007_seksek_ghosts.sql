CREATE TABLE IF NOT EXISTS "seksek_ghosts" (
  "player_id" uuid NOT NULL REFERENCES "seksek_players"("id") ON DELETE CASCADE,
  "level" text NOT NULL,
  "v" text NOT NULL,
  "time_ms" integer NOT NULL,
  "hero" text NOT NULL,
  "data" jsonb NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY ("player_id", "level")
)
