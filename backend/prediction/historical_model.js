const { query } = require("../config/db");

// Default probabilities when insufficient H2H data
const DEFAULT_HOME_WIN = 0.42;
const DEFAULT_DRAW = 0.26;
const DEFAULT_AWAY_WIN = 0.32;
// Con solo una temporada cargada en `fixtures`, pedir 3 H2H es demasiado
// y casi todos los pares caen al default (0.42/0.26/0.32). Con 1 ya se
// mueve el numero y el blend con `sampleWeight = total/10` mantiene la
// estabilidad ante pocas muestras (el peso del primer H2H es ~10%).
const MIN_MATCHES = 1;

async function predict(homeClubId, awayClubId) {
  const result = await query(
    `SELECT
       home_team_id, away_team_id, home_score, away_score
     FROM fixtures
     WHERE status = 'finished'
       AND (
         (home_team_id = $1 AND away_team_id = $2)
         OR (home_team_id = $2 AND away_team_id = $1)
       )
     ORDER BY match_date DESC
     LIMIT 20`,
    [homeClubId, awayClubId]
  );

  const matches = result.rows;

  if (matches.length < MIN_MATCHES) {
    // Fall back to league-wide averages
    return { homeWin: DEFAULT_HOME_WIN, draw: DEFAULT_DRAW, awayWin: DEFAULT_AWAY_WIN };
  }

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;

  for (const m of matches) {
    const isHomeTeamHome = m.home_team_id === homeClubId;
    const hScore = m.home_score;
    const aScore = m.away_score;

    if (hScore > aScore) {
      if (isHomeTeamHome) homeWins++;
      else awayWins++;
    } else if (hScore < aScore) {
      if (isHomeTeamHome) awayWins++;
      else homeWins++;
    } else {
      draws++;
    }
  }

  const total = matches.length;
  let homeWin = homeWins / total;
  let draw = draws / total;
  let awayWin = awayWins / total;

  // Blend with defaults to avoid extreme values from small samples
  const sampleWeight = Math.min(total / 10, 1.0);
  homeWin = sampleWeight * homeWin + (1 - sampleWeight) * DEFAULT_HOME_WIN;
  draw = sampleWeight * draw + (1 - sampleWeight) * DEFAULT_DRAW;
  awayWin = sampleWeight * awayWin + (1 - sampleWeight) * DEFAULT_AWAY_WIN;

  return normalize(homeWin, draw, awayWin);
}

function normalize(homeWin, draw, awayWin) {
  const sum = homeWin + draw + awayWin;
  return {
    homeWin: homeWin / sum,
    draw: draw / sum,
    awayWin: awayWin / sum,
  };
}

module.exports = { predict, name: "historical" };
