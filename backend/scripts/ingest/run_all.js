const { closePool } = require("./utils");
const ingestCountries = require("./ingest_countries");
const ingestClubs = require("./ingest_clubs");
const ingestPlayers = require("./ingest_players");
const ingestFixtures = require("./ingest_fixtures");
const ingestMarketValues = require("./ingest_market_values");
const ingestTransfers = require("./ingest_transfers");

async function runAll() {
  const start = Date.now();
  console.log("=".repeat(60));
  console.log("[INGESTION] Starting full data ingestion (league_demo)");
  console.log("=".repeat(60));

  try {
    // Step 1: Countries (dependency for clubs/players)
    await ingestCountries();
    console.log("");

    // Step 2: Clubs + competitions
    await ingestClubs();
    console.log("");

    // Step 3: Players from squad data
    await ingestPlayers();
    console.log("");

    // Step 4: Market values from Transfermarkt (optional — may fail if CSVs unavailable)
    try {
      await ingestMarketValues();
    } catch (err) {
      console.warn(`[WARN] Market value ingestion skipped: ${err.message}`);
    }
    console.log("");

    // Step 5: Fixtures
    await ingestFixtures();
    console.log("");

    // Step 6: Transfers (optional — may fail if CSVs unavailable)
    try {
      await ingestTransfers();
    } catch (err) {
      console.warn(`[WARN] Transfer ingestion skipped: ${err.message}`);
    }
    console.log("");

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log("=".repeat(60));
    console.log(`[INGESTION] Complete in ${elapsed}s`);
    console.log("=".repeat(60));
  } catch (err) {
    console.error("[INGESTION FATAL ERROR]:", err);
    process.exit(1);
  } finally {
    await closePool();
  }
}

runAll();
