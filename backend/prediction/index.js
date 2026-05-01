const { query } = require("../config/db");
const historicalModel = require("./historical_model");
const marketValueModel = require("./market_value_model");
const formModel = require("./form_model");
const { ACTIVE_MODE } = require("../config/competition");

const WEIGHTS = {
  league_demo: {
    historical: 0.20,
    market_value: 0.35,
    form: 0.45,
  },
  world_cup: {
    historical: 0.15,
    market_value: 0.25,
    form: 0.25,
    cohesion: 0.15,
    pedigree: 0.10,
    tentacles: 0.10,
  },
};

const MODELS = [historicalModel, marketValueModel, formModel];

async function predictMatch(homeTeam, awayTeam) {
  // Resolve team names to club IDs
  const homeClubId = await resolveClubId(homeTeam);
  const awayClubId = await resolveClubId(awayTeam);

  if (!homeClubId) throw new Error(`Team not found: ${homeTeam}`);
  if (!awayClubId) throw new Error(`Team not found: ${awayTeam}`);

  // Run all models in parallel
  const modelResults = await Promise.all(
    MODELS.map(async (model) => {
      const result = await model.predict(homeClubId, awayClubId);
      return { name: model.name, ...result };
    })
  );

  // Apply weights for composite prediction
  const weights = WEIGHTS[ACTIVE_MODE] || WEIGHTS.league_demo;
  let compositeHome = 0;
  let compositeDraw = 0;
  let compositeAway = 0;

  for (const result of modelResults) {
    const weight = weights[result.name] || 0;
    compositeHome += result.homeWin * weight;
    compositeDraw += result.draw * weight;
    compositeAway += result.awayWin * weight;
  }

  // Normalize to ensure sum = 1.0
  const sum = compositeHome + compositeDraw + compositeAway;
  const prediction = {
    homeWin: parseFloat((compositeHome / sum).toFixed(4)),
    draw: parseFloat((compositeDraw / sum).toFixed(4)),
    awayWin: parseFloat((compositeAway / sum).toFixed(4)),
    homeTeam,
    awayTeam,
    models: modelResults.map((r) => ({
      name: r.name,
      homeWin: parseFloat(r.homeWin.toFixed(4)),
      draw: parseFloat(r.draw.toFixed(4)),
      awayWin: parseFloat(r.awayWin.toFixed(4)),
    })),
  };

  return prediction;
}

async function resolveClubId(teamName) {
  // Try exact match first, then fuzzy
  let result = await query(
    "SELECT id FROM clubs WHERE name ILIKE $1 LIMIT 1",
    [teamName]
  );

  if (result.rows.length === 0) {
    result = await query(
      "SELECT id FROM clubs WHERE name ILIKE $1 OR short_name ILIKE $1 LIMIT 1",
      [`%${teamName}%`]
    );
  }

  return result.rows.length > 0 ? result.rows[0].id : null;
}

module.exports = { predictMatch };
