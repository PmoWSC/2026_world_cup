const fs = require("fs");
const path = require("path");
const { query } = require("../utils");

const VENUES_PATH = path.resolve(__dirname, "../../../data/wc2026/venues.json");

// Loads the 16 curated World Cup 2026 venues. Returns a map of the
// openfootball "ground" string -> venues.id so the fixtures ingest can
// resolve each match to its stadium. The `roof` and `openfootball_ground`
// fields in the JSON are mapping/metadata only and are not columns yet.
async function ingestWcVenues() {
  console.log("[WC VENUES] Stadiums...");
  const venues = JSON.parse(fs.readFileSync(VENUES_PATH, "utf8"));
  const groundToVenueId = {};

  for (const v of venues) {
    const existing = await query("SELECT id FROM venues WHERE name = $1 LIMIT 1", [v.name]);
    let id;
    if (existing.rows.length > 0) {
      id = existing.rows[0].id;
      await query(
        `UPDATE venues SET
           city = $2, country = $3, latitude = $4, longitude = $5,
           altitude_meters = $6, capacity = $7,
           avg_june_temp_celsius = $8, avg_july_temp_celsius = $9, timezone = $10
         WHERE id = $1`,
        [id, v.city, v.country, v.latitude, v.longitude, v.altitude_meters,
         v.capacity, v.avg_june_temp_celsius, v.avg_july_temp_celsius, v.timezone]
      );
    } else {
      const r = await query(
        `INSERT INTO venues
           (name, city, country, latitude, longitude, altitude_meters, capacity,
            avg_june_temp_celsius, avg_july_temp_celsius, timezone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [v.name, v.city, v.country, v.latitude, v.longitude, v.altitude_meters,
         v.capacity, v.avg_june_temp_celsius, v.avg_july_temp_celsius, v.timezone]
      );
      id = r.rows[0].id;
    }
    groundToVenueId[v.openfootball_ground] = id;
  }

  console.log(`[WC VENUES] ${venues.length} venues ready`);
  return groundToVenueId;
}

module.exports = ingestWcVenues;

if (require.main === module) {
  const { closePool } = require("../utils");
  ingestWcVenues()
    .then(() => closePool())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[ERROR]", err);
      process.exit(1);
    });
}
