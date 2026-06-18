const { query } = require("../config/db");

const MATCHES_TO_CONSIDER = 10;
const RECENCY_DECAY = 0.85; // Each older match is worth 85% of the previous

async function predict(homeClubId, awayClubId) {
  const homeForm = await getFormScore(homeClubId);
  const awayForm = await getFormScore(awayClubId);

  // Convert form scores to win probabilities
  const homeStrength = homeForm.score + 0.1; // Home advantage bonus
  const awayStrength = awayForm.score;

  if (homeStrength === 0 && awayStrength === 0) {
    return { homeWin: 0.40, draw: 0.25, awayWin: 0.35 };
  }

  // Goal difference impacts draw probability
  const avgGoalDiff = Math.abs(homeForm.avgGoalDiff - awayForm.avgGoalDiff);
  const drawProb = Math.max(0.12, 0.28 - avgGoalDiff * 0.04);

  const totalStrength = homeStrength + awayStrength;
  const remainingProb = 1 - drawProb;
  let homeWin = remainingProb * (homeStrength / totalStrength);
  let awayWin = remainingProb * (awayStrength / totalStrength);

  return normalize(homeWin, drawProb, awayWin);
}

async function getFormScore(clubId) {
  const result = await query(
    `SELECT home_team_id, away_team_id, home_score, away_score, match_date
     FROM fixtures
     WHERE status = 'finished'
       AND (home_team_id = $1 OR away_team_id = $1)
     ORDER BY match_date DESC
     LIMIT $2`,
    [clubId, MATCHES_TO_CONSIDER]
  );

  const matches = result.rows;
  if (matches.length === 0) {
    return { score: 0.5, avgGoalDiff: 0 };
  }

  let weightedPoints = 0;
  let totalWeight = 0;
  let totalGoalDiff = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const weight = Math.pow(RECENCY_DECAY, i);
    const isHome = m.home_team_id === clubId;
    const goalsFor = isHome ? m.home_score : m.away_score;
    const goalsAgainst = isHome ? m.away_score : m.home_score;

    let points = 0;
    if (goalsFor > goalsAgainst) points = 3;
    else if (goalsFor === goalsAgainst) points = 1;

    weightedPoints += points * weight;
    totalWeight += weight;
    totalGoalDiff += goalsFor - goalsAgainst;
  }

  // Normalize: max possible weighted points = 3.0
  const score = totalWeight > 0 ? weightedPoints / (totalWeight * 3) : 0.5;
  const avgGoalDiff = totalGoalDiff / matches.length;

  return { score, avgGoalDiff };
}

function normalize(homeWin, draw, awayWin) {
  const sum = homeWin + draw + awayWin;
  return {
    homeWin: homeWin / sum,
    draw: draw / sum,
    awayWin: awayWin / sum,
  };
}

module.exports = { predict, name: "form" };
