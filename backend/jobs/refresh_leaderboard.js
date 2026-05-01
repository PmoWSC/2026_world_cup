require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Pool } = require("pg");

/**
 * Refresh the polla_leaderboard materialized view.
 * Accepts an optional pool instance (used when called from resolve_bets);
 * creates its own pool when run standalone.
 */
async function refreshLeaderboard(existingPool) {
  const pool = existingPool || new Pool({ connectionString: process.env.DATABASE_URL });
  const ownPool = !existingPool;

  console.log(`[LEADERBOARD] Refreshing materialized view at ${new Date().toISOString()}`);

  try {
    const result = await pool.query(
      "REFRESH MATERIALIZED VIEW CONCURRENTLY polla_leaderboard"
    );
    console.log(`[LEADERBOARD] Materialized view refreshed successfully`);
    return result;
  } catch (err) {
    console.error("[LEADERBOARD ERROR]:", err.message);
    throw err;
  } finally {
    if (ownPool) {
      await pool.end();
    }
  }
}

// ── Standalone execution ─────────────────────────────────────────────
if (require.main === module) {
  refreshLeaderboard()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("[LEADERBOARD FATAL]:", err);
      process.exit(1);
    });
}

module.exports = { refreshLeaderboard };
