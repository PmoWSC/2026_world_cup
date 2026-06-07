const { query } = require("../config/db");

// Squad size considered for national-team cohesion. 26 matches the FIFA
// World Cup roster limit (2022 onwards). For league clubs the model does
// not apply, so this constant is only used for national-team paths.
const SQUAD_SIZE = 26;
const HOME_ADVANTAGE = 0.05;
const BASE_DRAW = 0.24;
const NEUTRAL = { homeWin: 0.45, draw: 0.25, awayWin: 0.30 };

// Cohesion = how often the country's top players share clubs in real life.
// If many of Brazil's top 26 play for the same handful of European clubs,
// they have higher on-field chemistry than a side whose players are spread
// across 26 different leagues. Score is in [0, 1]:
//   0 → every player in a different club (no shared cohesion)
//   1 → all players in the same club (impossible but conceptually max)
//
// Computed as the share of "co-pairs" out of total pairs:
//   SUM_{c}(n_c choose 2) / (SQUAD_SIZE choose 2)
async function predict(homeClubId, awayClubId) {
  const homeNation = await resolveNationalTeam(homeClubId);
  const awayNation = await resolveNationalTeam(awayClubId);

  // Both must be national teams; otherwise this model has no opinion
  // and we return a neutral prior with mild home advantage.
  if (!homeNation || !awayNation) return NEUTRAL;

  const [homeScore, awayScore] = await Promise.all([
    cohesionScore(homeNation),
    cohesionScore(awayNation),
  ]);

  // Map scores to probabilities. The team with higher cohesion wins more
  // often. The gap drives how much; if both are 0.0 the result collapses
  // to neutral.
  let homeStrength = homeScore + HOME_ADVANTAGE;
  let awayStrength = awayScore;
  const total = homeStrength + awayStrength;
  if (total === 0) return NEUTRAL;

  const gap = Math.abs(homeStrength - awayStrength);
  const drawProb = Math.max(0.12, BASE_DRAW - gap * 0.3);
  const remaining = 1 - drawProb;
  const homeWin = remaining * (homeStrength / total);
  const awayWin = remaining * (awayStrength / total);
  return normalize(homeWin, drawProb, awayWin);
}

// A "national team" in this database is a row in `clubs` whose competition
// is world_cup_2026 (the same id is used for both the WC fixtures and any
// friendlies, after the consolidation migration). We use the club's name
// to find the country and from there the players whose nationality_id
// points at it.
async function resolveNationalTeam(clubId) {
  // Accept both world_cup_2026 (qualified national teams) and
  // internationals_2026 (non-qualified opponents that still play
  // friendlies, e.g. Chile). The name of the row IS the country.
  const r = await query(
    `SELECT c.name AS country_name
     FROM clubs c
     JOIN competitions comp ON comp.id = c.competition_id
     WHERE c.id = $1
       AND comp.slug IN ('world_cup_2026', 'internationals_2026')`,
    [clubId]
  );
  return r.rows.length > 0 ? r.rows[0].country_name : null;
}

async function cohesionScore(countryName) {
  // Take the top-N players of that nationality by market value. The
  // top group is a reasonable proxy for a likely starting + bench XI.
  const r = await query(
    `SELECT p.current_club_id
     FROM players p
     JOIN countries co ON co.id = p.nationality_id
     WHERE immutable_unaccent(co.name) = immutable_unaccent($1)
       AND p.current_club_id IS NOT NULL
     ORDER BY p.market_value_eur DESC NULLS LAST
     LIMIT $2`,
    [countryName, SQUAD_SIZE]
  );
  const clubs = r.rows.map((row) => row.current_club_id).filter(Boolean);
  if (clubs.length < 2) return 0;

  const groups = {};
  for (const id of clubs) groups[id] = (groups[id] || 0) + 1;

  let coPairs = 0;
  for (const id of Object.keys(groups)) {
    const n = groups[id];
    if (n > 1) coPairs += (n * (n - 1)) / 2;
  }

  const totalPairs = (clubs.length * (clubs.length - 1)) / 2;
  return totalPairs > 0 ? coPairs / totalPairs : 0;
}

function normalize(homeWin, draw, awayWin) {
  const sum = homeWin + draw + awayWin;
  return {
    homeWin: homeWin / sum,
    draw: draw / sum,
    awayWin: awayWin / sum,
  };
}

module.exports = { predict, name: "cohesion" };
