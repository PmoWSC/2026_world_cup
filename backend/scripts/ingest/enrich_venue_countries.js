// enrich_venue_countries.js
//
// Fills in venues.country for rows where it's NULL (typically venues
// inserted by ingest_friendlies, which only captures name + city from
// API-Football). Uses Nominatim (OpenStreetMap geocoder) — free, no
// auth, rate-limited to 1 request per second per their usage policy.
//
// Run manually after ingest_friendlies:
//   docker compose ... exec backend node scripts/ingest/enrich_venue_countries.js
//
// Idempotent: only touches venues with country IS NULL. Re-running is
// safe and cheap (skips already-resolved rows).

const { query } = require("./utils");

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
// Nominatim policy: max 1 req/s, identify with a User-Agent.
const USER_AGENT = "PulpoAi/0.0.2 (david.blanco@white-systems.com)";
const SLEEP_MS = 1100; // a hair over 1s to stay polite

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function geocodeCountry(name, city) {
  const params = new URLSearchParams({
    q: city ? `${name}, ${city}` : name,
    format: "json",
    addressdetails: "1",
    limit: "1",
  });
  const url = `${NOMINATIM_URL}?${params.toString()}`;
  const resp = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!resp.ok) {
    throw new Error(`Nominatim ${resp.status} for "${name}, ${city || ""}"`);
  }
  const data = await resp.json();
  if (!data.length) return null;
  return data[0].address?.country || null;
}

async function enrichVenueCountries() {
  const pending = await query(
    `SELECT id, name, city FROM venues
     WHERE country IS NULL OR country = ''
     ORDER BY name`
  );

  console.log(`[VENUE ENRICH] ${pending.rows.length} venues sin country`);
  let resolved = 0;
  let failed = 0;

  for (const v of pending.rows) {
    try {
      const country = await geocodeCountry(v.name, v.city);
      if (country) {
        await query(`UPDATE venues SET country = $1 WHERE id = $2`, [country, v.id]);
        resolved++;
        console.log(`  ✓ ${v.name} (${v.city}) → ${country}`);
      } else {
        failed++;
        console.log(`  ✗ ${v.name} (${v.city}) — no match`);
      }
    } catch (err) {
      failed++;
      console.log(`  ✗ ${v.name} (${v.city}) — error: ${err.message}`);
    }
    await sleep(SLEEP_MS);
  }

  console.log(`[VENUE ENRICH] resolved=${resolved} failed=${failed}`);
  return { resolved, failed };
}

module.exports = enrichVenueCountries;

if (require.main === module) {
  const { closePool } = require("./utils");
  enrichVenueCountries()
    .then(() => closePool())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[ERROR]", err.message);
      process.exit(1);
    });
}
