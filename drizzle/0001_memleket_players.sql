CREATE TABLE IF NOT EXISTS "memleket_players" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "name_key" text NOT NULL UNIQUE,
  "token_hash" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE "memleket_scores" ADD COLUMN IF NOT EXISTS "player_id" uuid REFERENCES "memleket_players"("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "memleket_scores_level_player_idx" ON "memleket_scores" ("level", "player_id");
