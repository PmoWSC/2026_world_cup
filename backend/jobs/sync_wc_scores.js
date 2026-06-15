require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Pool } = require("pg");
const { THIRD_PLACE_NUMBER, FINAL_NUMBER } = require("../scripts/ingest/wc/wc_transform");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Direct fetch — we don't want the cache side-effect that
// fetchOpenfootball() does (it writes to data/wc2026/worldcup.json,
// which doesn't have write permission inside the running container
// and would silently fall back to a stale cache without scores).
const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

async function fetchScheduleLive() {
  const res = await fetch(OPENFOOTBALL_URL);
  if (!res.ok) throw new Error(`openfootball HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.matches)) {
    throw new Error("openfootball returned unexpected shape: missing matches[]");
  }
  return data;
}

// openfootball publishes group-stage results without a stable per-match
// number, so we rederive the number with the SAME ordering used at
// ingest time (see wc_transform.buildFixtureRows). Knockouts already
// carry `num`; final/third place use the synthetic constants.
function buildScoreUpdates(matches) {
  const groupMatches = matches
    .filter((m) => m.group)
    .sort((a, b) =>
      (a.date + a.time + a.group + a.team1).localeCompare(
        b.date + b.time + b.group + b.team1
      )
    );
  const groupNumber = new Map();
  groupMatches.forEach((m, i) => groupNumber.set(m, i + 1));

  const updates = [];
  for (const m of matches) {
    if (!m.score || !Array.isArray(m.score.ft)) continue;
    const isGroup = Boolean(m.group);
    let matchNumber;
    if (isGroup) matchNumber = groupNumber.get(m);
    else if (m.num != null) matchNumber = m.num;
    else if (m.round === "Final") matchNumber = FINAL_NUMBER;
    else matchNumber = THIRD_PLACE_NUMBER;
    updates.push({
      matchNumber,
      homeScore: m.score.ft[0],
      awayScore: m.score.ft[1],
      htHome: Array.isArray(m.score.ht) ? m.score.ht[0] : null,
      htAway: Array.isArray(m.score.ht) ? m.score.ht[1] : null,
    });
  }
  return updates;
}

async function syncWcScores() {
  console.log(`[WC SCORES] Sync at ${new Date().toISOString()}`);

  const compRes = await pool.query(
    "SELECT id FROM competitions WHERE slug = 'world_cup_2026'"
  );
  if (compRes.rows.length === 0) {
    console.error("[WC SCORES] world_cup_2026 competition missing — skipping");
    return;
  }
  const competitionId = compRes.rows[0].id;

  const data = await fetchScheduleLive();
  const updates = buildScoreUpdates(data.matches);
  console.log(`[WC SCORES] ${updates.length} matches with scores in source`);

  let updated = 0;
  for (const u of updates) {
    const result = await pool.query(
      `UPDATE fixtures SET
         status = 'finished',
         home_score = $1,
         away_score = $2,
         halftime_home_score = COALESCE($3, halftime_home_score),
         halftime_away_score = COALESCE($4, halftime_away_score),
         updated_at = NOW()
       WHERE competition_id = $5 AND match_number = $6`,
      [u.homeScore, u.awayScore, u.htHome, u.htAway, competitionId, u.matchNumber]
    );
    if (result.rowCount > 0) updated++;
  }

  console.log(`[WC SCORES] ${updated} fixtures updated`);
}

if (require.main === module) {
  syncWcScores()
    .then(() => {
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error("[WC SCORES FATAL]:", err);
      pool.end();
      process.exit(1);
    });
}

module.exports = { syncWcScores, buildScoreUpdates };
