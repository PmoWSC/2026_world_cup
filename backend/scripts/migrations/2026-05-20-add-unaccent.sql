-- Migration: enable accent-insensitive search for player / club / country names.
--
-- Without this, ILIKE 'Nunez' does not match 'Núñez' (and the testers
-- write names without accents most of the time). We expose
-- immutable_unaccent() so it can be used inside functional indexes.
--
-- Idempotent: safe to run more than once.

CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1)
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

CREATE INDEX IF NOT EXISTS idx_players_name_unaccent
  ON players (immutable_unaccent(name));

CREATE INDEX IF NOT EXISTS idx_players_full_name_unaccent
  ON players (immutable_unaccent(full_name));

CREATE INDEX IF NOT EXISTS idx_clubs_name_unaccent
  ON clubs (immutable_unaccent(name));

CREATE INDEX IF NOT EXISTS idx_clubs_short_name_unaccent
  ON clubs (immutable_unaccent(short_name));

CREATE INDEX IF NOT EXISTS idx_countries_name_unaccent
  ON countries (immutable_unaccent(name));
