const { closePool } = require("../utils");
const ingestWcBase = require("./ingest_wc_base");
const ingestWcVenues = require("./ingest_wc_venues");
const ingestWcFixtures = require("./ingest_wc_fixtures");

// Phase 1 World Cup 2026 ingest: competition + 48 national teams + 16
// venues + 104-match schedule. 100% open data (openfootball + curated
// venues), no API key required. Players, referees, friendlies and the
// dynamic knockout bracket come in later phases.
async function runAllWc() {
  const start = Date.now();
  console.log("=".repeat(60));
  console.log("[WC INGEST] World Cup 2026 — structure (phase 1)");
  console.log("=".repeat(60));

  try {
    const { competitionId } = await ingestWcBase();
    console.log("");

    const groundToVenueId = await ingestWcVenues();
    console.log("");

    await ingestWcFixtures({ competitionId, groundToVenueId });
    console.log("");

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log("=".repeat(60));
    console.log(`[WC INGEST] Complete in ${elapsed}s`);
    console.log("=".repeat(60));
  } catch (err) {
    console.error("[WC INGEST FATAL ERROR]:", err);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

runAllWc();
