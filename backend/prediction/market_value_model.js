const { query } = require("../config/db");

const HOME_ADVANTAGE = 0.05;
const BASE_DRAW = 0.22;

async function predict(homeClubId, awayClubId) {
  // Get aggregate squad market values
  const homeValue = await getSquadValue(homeClubId);
  const awayValue = await getSquadValue(awayClubId);

  if (homeValue === 0 && awayValue === 0) {
    return { homeWin: 0.40, draw: 0.25, awayWin: 0.35 };
  }

  const total = homeValue + awayValue;
  let homeStrength = homeValue / total;
  let awayStrength = awayValue / total;

  // Apply home advantage
  homeStrength += HOME_ADVANTAGE;
  awayStrength -= HOME_ADVANTAGE * 0.5;

  // Calculate win probabilities
  // Higher value difference = lower draw probability
  const valueDiff = Math.abs(homeStrength - awayStrength);
  const drawProb = Math.max(0.10, BASE_DRAW - valueDiff * 0.5);

  const remainingProb = 1 - drawProb;
  let homeWin = remainingProb * homeStrength / (homeStrength + awayStrength);
  let awayWin = remainingProb * awayStrength / (homeStrength + awayStrength);

  return normalize(homeWin, drawProb, awayWin);
}

async function getSquadValue(clubId) {
  const result = await query(
    `SELECT COALESCE(SUM(market_value_eur), 0) as total
     FROM players
     WHERE current_club_id = $1`,
    [clubId]
  );
  return parseInt(result.rows[0].total) || 0;
}

function normalize(homeWin, draw, awayWin) {
  const sum = homeWin + draw + awayWin;
  return {
    homeWin: homeWin / sum,
    draw: draw / sum,
    awayWin: awayWin / sum,
  };
}

module.exports = { predict, name: "market_value" };
