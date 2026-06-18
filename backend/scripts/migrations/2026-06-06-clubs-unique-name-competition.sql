-- Migration: idempotency keys for World Cup ingest (clubs + fixtures).
--
-- The World Cup ingest models each national team as a row in `clubs`
-- (name = country, competition_id = world_cup_2026) and loads the 104
-- fixtures keyed by (competition_id, match_number). To re-run either
-- ingest safely we need real conflict targets. The original schema only
-- has UUID PKs, and the league ingest uses bare `ON CONFLICT DO NOTHING`,
-- so reruns silently skip (clubs) or duplicate (fixtures).
--
-- Steps:
--   1. DELETE duplicate clubs sharing the same (name, competition_id),
--      keeping the oldest row (by created_at). Safe at this point: WC
--      teams are not yet loaded and league clubs are not duplicated.
--   2. UNIQUE INDEX clubs (name, competition_id).
--   3. UNIQUE INDEX fixtures (competition_id, match_number). League
--      fixtures carry match_number = NULL; Postgres treats NULLs as
--      distinct, so they never collide and keep working unchanged.
--
-- Idempotent: safe to re-run.

DELETE FROM clubs c
USING (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY name, competition_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM clubs
) dupes
WHERE c.id = dupes.id AND dupes.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clubs_name_competition_unique
  ON clubs (name, competition_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fixtures_competition_match_number_unique
  ON fixtures (competition_id, match_number);
