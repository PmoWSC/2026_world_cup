require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Pool } = require("pg");
const { resolveBets } = require("./resolve_bets");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Find every fixture that is finished AND has at least one bet still pending,
// then run resolve_bets for each. resolve_bets refreshes the leaderboard
// internally after each fixture, which is cheap (REFRESH MATERIALIZED VIEW
// CONCURRENTLY) and keeps the leaderboard correct as we go.
async function resolvePendingBets() {
  console.log(`[BATCH] Scanning pending bets at ${new Date().toISOString()}`);

  const result = await pool.query(
    `SELECT DISTINCT pb.fixture_id
     FROM polla_bets pb
     JOIN fixtures f ON f.id = pb.fixture_id
     WHERE pb.status = 'pending'
       AND f.status = 'finished'
       AND f.home_score IS NOT NULL
       AND f.away_score IS NOT NULL`
  );

  const fixtures = result.rows.map((r) => r.fixture_id);
  console.log(`[BATCH] ${fixtures.length} finished fixtures with pending bets`);

  let okCount = 0;
  let errCount = 0;
  for (const fixtureId of fixtures) {
    try {
      await resolveBets(fixtureId);
      okCount++;
    } catch (err) {
      console.error(`[BATCH ERROR] fixture ${fixtureId}:`, err.message);
      errCount++;
    }
  }

  console.log(`[BATCH] Done. ${okCount} OK, ${errCount} errors`);
}

if (require.main === module) {
  resolvePendingBets()
    .then(() => {
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error("[BATCH FATAL]:", err);
      pool.end();
      process.exit(1);
    });
}

module.exports = { resolvePendingBets };
