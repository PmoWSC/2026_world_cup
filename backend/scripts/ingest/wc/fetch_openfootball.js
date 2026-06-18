const fs = require("fs");
const path = require("path");

// openfootball/worldcup.json — CC0, no API key. Source of truth for
// the 48 teams, 12 groups and 104-match schedule of World Cup 2026.
const OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

const CACHE_PATH = path.resolve(__dirname, "../../../data/wc2026/worldcup.json");

// Fetch the schedule from openfootball and refresh the local cache. On
// network failure, fall back to the committed cache so ingest still runs
// offline / in CI. Returns the parsed { name, matches: [...] } object.
async function fetchOpenfootball() {
  try {
    console.log(`  [openfootball] GET ${OPENFOOTBALL_URL}`);
    const res = await fetch(OPENFOOTBALL_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data.matches)) {
      throw new Error("unexpected shape: missing matches[]");
    }
    fs.writeFileSync(CACHE_PATH, text);
    console.log(`  [openfootball] ${data.matches.length} matches (cache refreshed)`);
    return data;
  } catch (err) {
    console.warn(`  [openfootball] fetch failed (${err.message}); using cached file`);
    const cached = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
    console.log(`  [openfootball] ${cached.matches.length} matches (from cache)`);
    return cached;
  }
}

module.exports = { fetchOpenfootball, OPENFOOTBALL_URL, CACHE_PATH };
