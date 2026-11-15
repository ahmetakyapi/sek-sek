CREATE TABLE IF NOT EXISTS "seksek_maps" (
  "id" serial PRIMARY KEY,
  "code" text NOT NULL,
  "title" text NOT NULL,
  "player_id" uuid NOT NULL REFERENCES "seksek_players"("id") ON DELETE CASCADE,
  "author" text NOT NULL,
  "city" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "plays" integer DEFAULT 0 NOT NULL,
  "likes" integer DEFAULT 0 NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "seksek_maps_code_idx" ON "seksek_maps" ("code");
CREATE INDEX IF NOT EXISTS "seksek_maps_created_idx" ON "seksek_maps" ("created_at");
CREATE INDEX IF NOT EXISTS "seksek_maps_likes_idx" ON "seksek_maps" ("likes", "created_at");
CREATE INDEX IF NOT EXISTS "seksek_maps_plays_idx" ON "seksek_maps" ("plays", "created_at");
CREATE INDEX IF NOT EXISTS "seksek_maps_player_idx" ON "seksek_maps" ("player_id", "created_at");
CREATE TABLE IF NOT EXISTS "seksek_map_likes" (
  "map_id" integer NOT NULL REFERENCES "seksek_maps"("id") ON DELETE CASCADE,
  "player_id" uuid NOT NULL REFERENCES "seksek_players"("id") ON DELETE CASCADE,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY ("map_id", "player_id")
)
