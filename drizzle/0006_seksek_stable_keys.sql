INSERT INTO "seksek_scores" ("level", "name", "player_id", "time_ms", "deaths", "items", "min_deaths", "max_items", "plays", "created_at")
SELECT DISTINCT ON (split_part(s.level, '@', 1), s.player_id)
  split_part(s.level, '@', 1) || '@s', s.name, s.player_id, s.time_ms, s.deaths, s.items,
  min(coalesce(s.min_deaths, s.deaths)) OVER w,
  max(coalesce(s.max_items, s.items)) OVER w,
  max(s.plays) OVER w, s.created_at
FROM "seksek_scores" s
WHERE s.player_id IS NOT NULL AND s.level LIKE '%@%' AND s.level NOT LIKE 'gunluk:%' AND s.level NOT LIKE '%@s' AND s.level !~ '@[0-6]$'
WINDOW w AS (PARTITION BY split_part(s.level, '@', 1), s.player_id)
ORDER BY split_part(s.level, '@', 1), s.player_id, s.time_ms ASC, s.created_at ASC
ON CONFLICT ("level", "player_id") DO NOTHING
