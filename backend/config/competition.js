const COMPETITION_MODES = {
  league_demo: {
    competitions: ["la_liga_2025", "premier_league_2025"],
    features: ["chat", "predictions", "polla", "explore"],
    tentacles_enabled: false,
    data_sources: ["football-data.org", "transfermarkt-datasets"],
  },
  world_cup: {
    competitions: ["world_cup_2026"],
    features: [
      "chat",
      "predictions",
      "polla",
      "explore",
      "connections",
      "tentacles",
    ],
    tentacles_enabled: true,
    data_sources: [
      "football-data.org",
      "transfermarkt-datasets",
      "statsbomb",
      "fjelstul",
      "openfootball",
    ],
  },
};

const ACTIVE_MODE = process.env.COMPETITION_MODE || "league_demo";
const activeConfig = COMPETITION_MODES[ACTIVE_MODE];

if (!activeConfig) {
  throw new Error(
    `[CONFIG ERROR] Unknown COMPETITION_MODE: "${ACTIVE_MODE}". Valid: ${Object.keys(COMPETITION_MODES).join(", ")}`
  );
}

module.exports = { COMPETITION_MODES, ACTIVE_MODE, activeConfig };
