const { query } = require("../config/db");
const historicalModel = require("./historical_model");
const marketValueModel = require("./market_value_model");
const formModel = require("./form_model");
const cohesionModel = require("./cohesion_model");

// Two sets of weights depending on whether the match is between national
// teams (World Cup, internationals) or club teams (La Liga, Premier,
// Libertadores). The user explicitly does NOT want club matches to be
// influenced by the national-team-specific cohesion model.
//
// For club matches we keep the classic 3-model composite.
// For national-team matches we drop a bit of market_value and form
// weight to make room for cohesion (squad chemistry from shared clubs).
const CLUB_WEIGHTS = {
  historical: 0.20,
  market_value: 0.35,
  form: 0.45,
};
const NATIONAL_WEIGHTS = {
  historical: 0.20,
  market_value: 0.20,
  form: 0.40,
  cohesion: 0.20,
};

const CLUB_MODELS = [historicalModel, marketValueModel, formModel];
const NATIONAL_MODELS = [historicalModel, marketValueModel, formModel, cohesionModel];

// TTL del cache. 24h es buen balance: el cron de amistosos refresca
// marcadores cada 2h, y los partidos del Mundial cambian con baja
// frecuencia. La gran mayoria de las preguntas a un mismo partido
// llegan dentro del mismo dia.
const CACHE_TTL_HOURS = 24;

async function predictMatch(homeTeam, awayTeam) {
  // Resolve team names to club IDs
  const homeClubId = await resolveClubId(homeTeam);
  const awayClubId = await resolveClubId(awayTeam);

  if (!homeClubId) throw new Error(`Team not found: ${homeTeam}`);
  if (!awayClubId) throw new Error(`Team not found: ${awayTeam}`);

  // 1. Cache hit (fresco) -> servir y registrar uso
  const cached = await readCache(homeClubId, awayClubId);
  if (cached) {
    incrementHitCount(homeClubId, awayClubId); // fire-and-forget
    return formatPrediction(homeTeam, awayTeam, cached, true);
  }

  // Pick the right model set: cohesion (squad chemistry) only applies
  // when BOTH teams are national teams (rows in clubs whose competition
  // is world_cup_2026). For club matches we stay with the classic
  // 3-model composite so League / Libertadores predictions are unchanged.
  const isNationalMatch = await isNationalTeamMatch(homeClubId, awayClubId);
  const models = isNationalMatch ? NATIONAL_MODELS : CLUB_MODELS;
  const weights = isNationalMatch ? NATIONAL_WEIGHTS : CLUB_WEIGHTS;

  // 2. Cache miss o expirado -> calcular
  const modelResults = await Promise.all(
    models.map(async (model) => {
      const result = await model.predict(homeClubId, awayClubId);
      return { name: model.name, ...result };
    })
  );
  let compositeHome = 0;
  let compositeDraw = 0;
  let compositeAway = 0;
  for (const result of modelResults) {
    const weight = weights[result.name] || 0;
    compositeHome += result.homeWin * weight;
    compositeDraw += result.draw * weight;
    compositeAway += result.awayWin * weight;
  }

  const sum = compositeHome + compositeDraw + compositeAway;
  const computed = {
    homeWin: compositeHome / sum,
    draw: compositeDraw / sum,
    awayWin: compositeAway / sum,
    models: modelResults.map((r) => ({
      name: r.name,
      homeWin: parseFloat(r.homeWin.toFixed(4)),
      draw: parseFloat(r.draw.toFixed(4)),
      awayWin: parseFloat(r.awayWin.toFixed(4)),
    })),
  };

  // 3. Guardar en cache (no bloquea la respuesta si falla)
  writeCache(homeClubId, awayClubId, computed);

  return formatPrediction(homeTeam, awayTeam, computed, false);
}

// Both teams have to be national teams (registered in world_cup_2026 or
// internationals_2026) for the match to trigger the cohesion + tentacle
// branch. League clubs (La Liga, Premier, Libertadores) never qualify.
// We accept internationals_2026 too because some sides (e.g. Chile) play
// friendlies without having qualified to the World Cup.
async function isNationalTeamMatch(homeClubId, awayClubId) {
  const r = await query(
    `SELECT COUNT(*)::int AS count
     FROM clubs c
     JOIN competitions comp ON comp.id = c.competition_id
     WHERE comp.slug IN ('world_cup_2026', 'internationals_2026')
       AND c.id IN ($1, $2)`,
    [homeClubId, awayClubId]
  );
  return r.rows[0].count === 2;
}

function formatPrediction(homeTeam, awayTeam, raw, cached) {
  return {
    homeWin: parseFloat(Number(raw.homeWin).toFixed(4)),
    draw: parseFloat(Number(raw.draw).toFixed(4)),
    awayWin: parseFloat(Number(raw.awayWin).toFixed(4)),
    homeTeam,
    awayTeam,
    cached,
    models: raw.models,
  };
}

async function readCache(homeClubId, awayClubId) {
  try {
    const result = await query(
      `SELECT home_win, draw, away_win, models
       FROM prediction_cache
       WHERE home_team_id = $1
         AND away_team_id = $2
         AND computed_at > NOW() - INTERVAL '${CACHE_TTL_HOURS} hours'
       LIMIT 1`,
      [homeClubId, awayClubId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      homeWin: row.home_win,
      draw: row.draw,
      awayWin: row.away_win,
      models: row.models,
    };
  } catch {
    // Si la tabla no existe (pre-migracion) seguimos en vivo
    return null;
  }
}

async function writeCache(homeClubId, awayClubId, prediction) {
  try {
    await query(
      `INSERT INTO prediction_cache
         (home_team_id, away_team_id, home_win, draw, away_win, models, computed_at, hit_count)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW(), 0)
       ON CONFLICT (home_team_id, away_team_id) DO UPDATE SET
         home_win = EXCLUDED.home_win,
         draw = EXCLUDED.draw,
         away_win = EXCLUDED.away_win,
         models = EXCLUDED.models,
         computed_at = NOW()`,
      [
        homeClubId,
        awayClubId,
        prediction.homeWin,
        prediction.draw,
        prediction.awayWin,
        JSON.stringify(prediction.models),
      ]
    );
  } catch (err) {
    console.warn("[PREDICTION CACHE] write failed:", err.message);
  }
}

function incrementHitCount(homeClubId, awayClubId) {
  query(
    `UPDATE prediction_cache SET hit_count = hit_count + 1
     WHERE home_team_id = $1 AND away_team_id = $2`,
    [homeClubId, awayClubId]
  ).catch((err) => console.warn("[PREDICTION CACHE] hit update failed:", err.message));
}

async function resolveClubId(teamName) {
  // Try exact match first (accent-insensitive), then substring fuzzy.
  let result = await query(
    "SELECT id FROM clubs WHERE immutable_unaccent(name) ILIKE immutable_unaccent($1) LIMIT 1",
    [teamName]
  );

  if (result.rows.length === 0) {
    result = await query(
      "SELECT id FROM clubs WHERE immutable_unaccent(name) ILIKE immutable_unaccent($1) OR immutable_unaccent(short_name) ILIKE immutable_unaccent($1) LIMIT 1",
      [`%${teamName}%`]
    );
  }

  return result.rows.length > 0 ? result.rows[0].id : null;
}

module.exports = { predictMatch };
