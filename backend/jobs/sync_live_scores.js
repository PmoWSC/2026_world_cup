require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;

async function syncLiveScores() {
  console.log(`[SYNC] Checking live scores at ${new Date().toISOString()}`);

  const today = new Date().toISOString().slice(0, 10);
  const url = `${FOOTBALL_DATA_BASE}/matches?dateFrom=${today}&dateTo=${today}`;

  const res = await fetch(url, {
    headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
  });

  if (!res.ok) {
    console.error(`[SYNC ERROR] API returned ${res.status}`);
    return;
  }

  const data = await res.json();
  const matches = data.matches || [];

  let updated = 0;
  for (const match of matches) {
    const status = mapStatus(match.status);
    const homeScore = match.score?.fullTime?.home ?? null;
    const awayScore = match.score?.fullTime?.away ?? null;
    const htHome = match.score?.halfTime?.home ?? null;
    const htAway = match.score?.halfTime?.away ?? null;

    const result = await pool.query(
      `UPDATE fixtures SET
         status = $1,
         home_score = COALESCE($2, home_score),
         away_score = COALESCE($3, away_score),
         halftime_home_score = COALESCE($4, halftime_home_score),
         halftime_away_score = COALESCE($5, halftime_away_score),
         updated_at = NOW()
       WHERE football_data_id = $6`,
      [status, homeScore, awayScore, htHome, htAway, match.id]
    );

    if (result.rowCount > 0) updated++;
  }

  console.log(`[SYNC] ${updated} fixtures updated from ${matches.length} matches`);
}

function mapStatus(status) {
  const map = {
    SCHEDULED: "scheduled",
    TIMED: "scheduled",
    IN_PLAY: "IN_PLAY",
    PAUSED: "PAUSED",
    FINISHED: "finished",
    POSTPONED: "postponed",
    SUSPENDED: "suspended",
    CANCELLED: "cancelled",
  };
  return map[status] || status;
}

// Run once or on interval
if (require.main === module) {
  syncLiveScores()
    .then(() => {
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error("[SYNC FATAL]:", err);
      pool.end();
      process.exit(1);
    });
}

module.exports = syncLiveScores;
