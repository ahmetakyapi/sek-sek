CREATE TABLE IF NOT EXISTS "seksek_saves" (
  "player_id" uuid PRIMARY KEY REFERENCES "seksek_players"("id") ON DELETE CASCADE,
  "data" jsonb NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
