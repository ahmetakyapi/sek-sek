CREATE TABLE IF NOT EXISTS "memleket_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "player_id" uuid NOT NULL REFERENCES "memleket_players"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL UNIQUE,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE "memleket_players" ADD COLUMN IF NOT EXISTS "password_hash" text NOT NULL;
ALTER TABLE "memleket_players" DROP COLUMN IF EXISTS "token_hash";
