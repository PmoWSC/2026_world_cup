-- PULPO.ai Database Schema
-- Executed automatically on first postgres container start

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- CORE FOOTBALL TABLES
-- ============================================================

-- 1. Countries
CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    fifa_code VARCHAR(10) UNIQUE,
    confederation VARCHAR(50),
    elo_rating INTEGER,
    elo_updated_at TIMESTAMP WITH TIME ZONE,
    flag_emoji VARCHAR(10),
    flag_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Competitions
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('league', 'cup', 'international')),
    season VARCHAR(20),
    country_id UUID REFERENCES countries(id),
    football_data_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Venues
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    country VARCHAR(255),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    altitude_meters INTEGER,
    capacity INTEGER,
    surface VARCHAR(100),
    avg_june_temp_celsius DECIMAL(5, 2),
    avg_july_temp_celsius DECIMAL(5, 2),
    timezone VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Referees
CREATE TABLE referees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    nationality VARCHAR(255),
    avg_fouls_per_match DECIMAL(5, 2),
    avg_yellows_per_match DECIMAL(5, 2),
    avg_reds_per_match DECIMAL(5, 2),
    penalty_rate DECIMAL(5, 4),
    avg_added_time_minutes DECIMAL(5, 2),
    matches_officiated INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Clubs
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    league VARCHAR(100),
    country_id UUID REFERENCES countries(id),
    competition_id UUID REFERENCES competitions(id),
    market_value_eur BIGINT,
    crest_url VARCHAR(512),
    football_data_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Players (with pgvector embedding)
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(512),
    date_of_birth DATE,
    nationality_id UUID REFERENCES countries(id),
    current_club_id UUID REFERENCES clubs(id),
    position VARCHAR(50),
    market_value_eur BIGINT,
    agent VARCHAR(255),
    transfermarkt_id VARCHAR(50),
    image_url VARCHAR(512),
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. World Cup Squads
CREATE TABLE wc_squads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id),
    country_id UUID NOT NULL REFERENCES countries(id),
    shirt_number INTEGER,
    is_captain BOOLEAN DEFAULT false,
    wc_experience_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, country_id)
);

-- 8. Transfers
CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id),
    from_club_id UUID REFERENCES clubs(id),
    to_club_id UUID REFERENCES clubs(id),
    transfer_date DATE,
    fee_eur BIGINT,
    season VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Fixtures (Universal — Leagues + WC)
CREATE TABLE fixtures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID REFERENCES competitions(id),
    match_number INTEGER,
    matchday INTEGER,
    group_name VARCHAR(10),
    stage VARCHAR(50),
    match_date TIMESTAMP WITH TIME ZONE,
    venue_id UUID REFERENCES venues(id),
    home_team_id UUID,
    away_team_id UUID,
    home_score INTEGER,
    away_score INTEGER,
    halftime_home_score INTEGER,
    halftime_away_score INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled',
    football_data_id INTEGER,
    referee_id UUID REFERENCES referees(id),
    first_goalscorer_player_id UUID REFERENCES players(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. World Cup Matches Historical (1930-2022)
CREATE TABLE wc_matches_historical (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_year INTEGER NOT NULL,
    stage VARCHAR(50),
    match_date DATE,
    home_country_id UUID REFERENCES countries(id),
    away_country_id UUID REFERENCES countries(id),
    home_score INTEGER,
    away_score INTEGER,
    home_penalties INTEGER,
    away_penalties INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. ELO History
CREATE TABLE elo_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID NOT NULL REFERENCES countries(id),
    rating INTEGER NOT NULL,
    recorded_at DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Recent Results
CREATE TABLE recent_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id UUID NOT NULL REFERENCES countries(id),
    opponent_id UUID REFERENCES countries(id),
    competition VARCHAR(255),
    match_date DATE,
    goals_for INTEGER,
    goals_against INTEGER,
    is_home BOOLEAN,
    opponent_elo_at_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- POLLA MODULE TABLES
-- ============================================================

-- 13. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(512),
    language_preference VARCHAR(10) DEFAULT 'en',
    push_token VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Polla Groups
CREATE TABLE polla_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description VARCHAR(512),
    created_by UUID REFERENCES users(id),
    invite_code VARCHAR(8) UNIQUE NOT NULL,
    competition VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    max_members INTEGER DEFAULT 50,
    scoring_system VARCHAR(50) DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Polla Members
CREATE TABLE polla_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES polla_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 16. Bet Types
CREATE TABLE bet_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name_key VARCHAR(255) NOT NULL,
    description_key VARCHAR(255),
    category VARCHAR(50) NOT NULL CHECK (category IN ('match', 'tournament', 'player')),
    points_correct INTEGER NOT NULL,
    points_partial INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    available_for JSONB DEFAULT '["world_cup_2026", "la_liga_2025", "premier_league_2025"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. Polla Bets
CREATE TABLE polla_bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES polla_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    bet_type_id UUID NOT NULL REFERENCES bet_types(id),
    fixture_id UUID,
    prediction JSONB NOT NULL,
    points_earned INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'partial', 'lost', 'cancelled')),
    locked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id, bet_type_id, fixture_id)
);

-- 18. Rate Limits
CREATE TABLE rate_limits (
    identifier VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    count INTEGER DEFAULT 1,
    PRIMARY KEY (identifier, date)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Players
CREATE INDEX idx_players_nationality ON players(nationality_id);
CREATE INDEX idx_players_club ON players(current_club_id);

-- Fixtures
CREATE INDEX idx_fixtures_competition ON fixtures(competition_id);
CREATE INDEX idx_fixtures_date ON fixtures(match_date);
CREATE INDEX idx_fixtures_status ON fixtures(status);
CREATE INDEX idx_fixtures_home_team ON fixtures(home_team_id);
CREATE INDEX idx_fixtures_away_team ON fixtures(away_team_id);

-- Transfers
CREATE INDEX idx_transfers_player ON transfers(player_id);

-- Historical
CREATE INDEX idx_historical_home ON wc_matches_historical(home_country_id);
CREATE INDEX idx_historical_away ON wc_matches_historical(away_country_id);

-- ELO
CREATE INDEX idx_elo_country ON elo_history(country_id);

-- Recent Results
CREATE INDEX idx_recent_results_country ON recent_results(country_id);

-- Polla Bets
CREATE INDEX idx_polla_bets_group ON polla_bets(group_id);
CREATE INDEX idx_polla_bets_fixture ON polla_bets(fixture_id);
CREATE INDEX idx_polla_bets_user ON polla_bets(user_id);

-- Polla Members
CREATE INDEX idx_polla_members_user ON polla_members(user_id);

-- ============================================================
-- MATERIALIZED VIEW: Polla Leaderboard
-- ============================================================

CREATE MATERIALIZED VIEW polla_leaderboard AS
SELECT
    pb.group_id,
    pb.user_id,
    u.display_name,
    u.avatar_url,
    COALESCE(SUM(pb.points_earned), 0) AS total_points,
    COUNT(CASE WHEN pb.status = 'won' THEN 1 END) AS exact_predictions,
    COUNT(CASE WHEN pb.status = 'partial' THEN 1 END) AS partial_predictions,
    COUNT(CASE WHEN pb.status IN ('won', 'partial', 'lost') THEN 1 END) AS total_resolved,
    RANK() OVER (
        PARTITION BY pb.group_id
        ORDER BY COALESCE(SUM(pb.points_earned), 0) DESC
    ) AS rank
FROM polla_bets pb
JOIN users u ON u.id = pb.user_id
GROUP BY pb.group_id, pb.user_id, u.display_name, u.avatar_url;

CREATE UNIQUE INDEX idx_polla_leaderboard_group_user ON polla_leaderboard(group_id, user_id);

-- ============================================================
-- SEED DATA: Bet Types (14 types)
-- ============================================================

INSERT INTO bet_types (slug, name_key, description_key, category, points_correct, points_partial, available_for) VALUES
    ('match:exact_score', 'bet_type.exact_score', 'bet_type.exact_score_desc', 'match', 10, 3, '["world_cup_2026", "la_liga_2025", "premier_league_2025"]'),
    ('match:winner', 'bet_type.winner', 'bet_type.winner_desc', 'match', 3, 0, '["world_cup_2026", "la_liga_2025", "premier_league_2025"]'),
    ('match:first_goal', 'bet_type.first_goal', 'bet_type.first_goal_desc', 'match', 8, 0, '["world_cup_2026", "la_liga_2025", "premier_league_2025"]'),
    ('match:total_goals', 'bet_type.total_goals', 'bet_type.total_goals_desc', 'match', 4, 0, '["world_cup_2026", "la_liga_2025", "premier_league_2025"]'),
    ('match:both_score', 'bet_type.both_score', 'bet_type.both_score_desc', 'match', 4, 0, '["world_cup_2026", "la_liga_2025", "premier_league_2025"]'),
    ('match:halftime_score', 'bet_type.halftime_score', 'bet_type.halftime_score_desc', 'match', 12, 4, '["world_cup_2026", "la_liga_2025", "premier_league_2025"]'),
    ('tournament:winner', 'bet_type.tournament_winner', 'bet_type.tournament_winner_desc', 'tournament', 25, 0, '["world_cup_2026"]'),
    ('tournament:finalist', 'bet_type.finalist', 'bet_type.finalist_desc', 'tournament', 15, 0, '["world_cup_2026"]'),
    ('tournament:semifinalist', 'bet_type.semifinalist', 'bet_type.semifinalist_desc', 'tournament', 8, 0, '["world_cup_2026"]'),
    ('tournament:group_winner', 'bet_type.group_winner', 'bet_type.group_winner_desc', 'tournament', 5, 0, '["world_cup_2026"]'),
    ('tournament:golden_boot', 'bet_type.golden_boot', 'bet_type.golden_boot_desc', 'tournament', 15, 0, '["world_cup_2026"]'),
    ('tournament:golden_ball', 'bet_type.golden_ball', 'bet_type.golden_ball_desc', 'tournament', 15, 0, '["world_cup_2026"]'),
    ('player:goals_total', 'bet_type.goals_total', 'bet_type.goals_total_desc', 'player', 10, 5, '["world_cup_2026", "la_liga_2025", "premier_league_2025"]'),
    ('tournament:dark_horse', 'bet_type.dark_horse', 'bet_type.dark_horse_desc', 'tournament', 20, 0, '["world_cup_2026"]');

-- ============================================================
-- NOTE: pgvector IVFFlat index on players.embedding is created
-- after data ingestion (requires rows to exist first)
-- ============================================================
