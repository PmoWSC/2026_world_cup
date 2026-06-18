-- Migration: prediction cache table.
--
-- Modelo "compute once, serve many" para predictMatch:
-- - El primer usuario que pregunta por un par (home, away) dispara el
--   calculo de los 3 modelos (historical + market_value + form).
-- - El resultado queda guardado con TTL de 24h.
-- - Las siguientes preguntas por el mismo par devuelven el cache
--   instantaneamente y no gastan tokens de Claude en la composicion
--   (la herramienta predict_match responde en milisegundos).
--
-- Por que TTL y no permanente:
--   El form_model usa los ultimos N partidos finished. Si entra un
--   resultado nuevo via el cron de amistosos, la prediccion queda
--   desactualizada. 24h es buen balance entre frescura y ahorro de
--   computo (los marcadores se actualizan ~12 veces al dia).
--
-- Idempotente: safe to re-run.

CREATE TABLE IF NOT EXISTS prediction_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_team_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    away_team_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    home_win NUMERIC(6,4) NOT NULL,
    draw NUMERIC(6,4) NOT NULL,
    away_win NUMERIC(6,4) NOT NULL,
    models JSONB NOT NULL,
    computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    hit_count INTEGER NOT NULL DEFAULT 0,
    UNIQUE (home_team_id, away_team_id)
);

-- Index para invalidacion por TTL y stats
CREATE INDEX IF NOT EXISTS idx_prediction_cache_computed_at
    ON prediction_cache (computed_at DESC);
