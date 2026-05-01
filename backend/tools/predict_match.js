const { predictMatch } = require("../prediction");

async function predict_match({ home_team, away_team }) {
  const result = await predictMatch(home_team, away_team);
  return result;
}

module.exports = predict_match;
