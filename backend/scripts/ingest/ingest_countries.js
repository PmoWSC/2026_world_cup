const { query, fetchFootballData } = require("./utils");

async function ingestCountries() {
  console.log("[INGEST] Countries from football-data.org...");

  const data = await fetchFootballData("/areas");
  const areas = data.areas || [];

  let count = 0;
  for (const area of areas) {
    if (!area.name || area.name === "World") continue;

    await query(
      `INSERT INTO countries (name, fifa_code, flag_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (fifa_code) DO UPDATE SET
         name = EXCLUDED.name,
         flag_url = EXCLUDED.flag_url`,
      [area.name, area.countryCode || area.code, area.flag || null]
    );
    count++;
  }

  console.log(`[INGEST] ${count} countries inserted/updated`);
  return count;
}

module.exports = ingestCountries;

if (require.main === module) {
  ingestCountries()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[ERROR]", err);
      process.exit(1);
    });
}
