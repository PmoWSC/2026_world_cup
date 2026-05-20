-- Migration: add football_data_id to players and deduplicate.
--
-- The original schema (db_init/seed.sql) only has UUID PK on players,
-- so repeated runs of ingest_players insert duplicate rows for the
-- same person. football-data.org returns a stable integer id per
-- player; storing it lets ingest do real UPSERT on conflict.
--
-- Steps:
--   1. ADD COLUMN football_data_id INTEGER (nullable initially —
--      existing rows backfill on next ingest run).
--   2. DELETE duplicates, keeping the oldest row (by created_at) per
--      (name, current_club_id, date_of_birth) tuple. Safe at this
--      point because wc_squads / polla_bets / transfers are empty.
--   3. Partial UNIQUE index on football_data_id WHERE NOT NULL so
--      ON CONFLICT (football_data_id) works without breaking the
--      rows that haven't been backfilled yet.
--
-- Idempotent: safe to re-run.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS football_data_id INTEGER;

DELETE FROM players p
USING (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY name, current_club_id, date_of_birth
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM players
) dupes
WHERE p.id = dupes.id AND dupes.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_football_data_id_unique
  ON players (football_data_id)
  WHERE football_data_id IS NOT NULL;
