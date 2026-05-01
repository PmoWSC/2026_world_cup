const { ACTIVE_MODE } = require("../config/competition");

async function get_tentacle_factors({ home_team, away_team, venue }) {
  if (ACTIVE_MODE !== "world_cup") {
    return {
      error: "Tentacle factors are only available in World Cup mode. Currently in league_demo mode.",
    };
  }

  // Stub — implemented in Phase 7 (World Cup expansion)
  return {
    home_team,
    away_team,
    venue,
    factors: {
      altitude: { impact: "neutral", description: "Venue at sea level" },
      climate: { impact: "neutral", description: "Moderate temperature expected" },
      recovery: { impact: "neutral", description: "Both teams with adequate rest" },
      travel: { impact: "neutral", description: "Similar travel distances" },
      referee: { impact: "neutral", description: "No referee assigned yet" },
    },
  };
}

module.exports = get_tentacle_factors;
