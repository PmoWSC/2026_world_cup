const path = require("path");
const { query } = require("../utils");
const { fetchOpenfootball } = require("./fetch_openfootball");

// FIFA World Cup 2026 — Canada / Mexico / USA, 11 Jun – 19 Jul 2026.
const COMPETITION = {
  name: "FIFA World Cup 2026",
  slug: "world_cup_2026",
  type: "international",
  season: "2026",
  startDate: "2026-06-11",
  endDate: "2026-07-19",
};

// Metadata for the 48 qualified teams. Keys MUST match the team names
// used by openfootball/worldcup.json verbatim (that is the join key for
// fixtures); fifa_code follows the official FIFA three-letter codes.
// Kept in a dep-free JSON so it can be validated without a DB.
// elo_rating is intentionally not set here — it is enriched later, we do
// not invent ratings.
const COUNTRY_META = require(
  path.resolve(__dirname, "../../../data/wc2026/country_meta.json")
);

async function ingestWcBase() {
  console.log("[WC BASE] Competition + countries + national teams...");

  // 1. Upsert the competition.
  const comp = await query(
    `INSERT INTO competitions (name, slug, type, season, is_active, start_date, end_date)
     VALUES ($1, $2, $3, $4, true, $5, $6)
     ON CONFLICT (slug) DO UPDATE SET
       name = EXCLUDED.name, type = EXCLUDED.type, season = EXCLUDED.season,
       is_active = true, start_date = EXCLUDED.start_date, end_date = EXCLUDED.end_date
     RETURNING id`,
    [COMPETITION.name, COMPETITION.slug, COMPETITION.type, COMPETITION.season,
     COMPETITION.startDate, COMPETITION.endDate]
  );
  const competitionId = comp.rows[0].id;

  // 2. Derive the 48 teams from the group-stage matches (the join key
  //    for fixtures), so the team list never drifts from the schedule.
  const data = await fetchOpenfootball();
  const teamNames = [
    ...new Set(
      data.matches.filter((m) => m.group).flatMap((m) => [m.team1, m.team2])
    ),
  ].sort();

  if (teamNames.length !== 48) {
    console.warn(`  [WARN] expected 48 teams, found ${teamNames.length}`);
  }

  // 3. Upsert each country and its national team (modeled as a club).
  let teamCount = 0;
  for (const name of teamNames) {
    const meta = COUNTRY_META[name];
    if (!meta) {
      throw new Error(
        `No metadata for team "${name}". Add it to COUNTRY_META in ingest_wc_base.js.`
      );
    }

    const country = await query(
      `INSERT INTO countries (name, fifa_code, confederation, flag_emoji)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (fifa_code) DO UPDATE SET
         name = EXCLUDED.name, confederation = EXCLUDED.confederation,
         flag_emoji = EXCLUDED.flag_emoji
       RETURNING id`,
      [name, meta.code, meta.conf, meta.flag]
    );
    const countryId = country.rows[0].id;

    await query(
      `INSERT INTO clubs (name, short_name, league, country_id, competition_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (name, competition_id) DO UPDATE SET
         short_name = EXCLUDED.short_name, league = EXCLUDED.league,
         country_id = EXCLUDED.country_id
       RETURNING id`,
      [name, meta.code, COMPETITION.name, countryId, competitionId]
    );
    teamCount++;
  }

  console.log(`[WC BASE] competition + ${teamCount} national teams ready`);
  return { competitionId, teamCount };
}

module.exports = ingestWcBase;
module.exports.COMPETITION = COMPETITION;

if (require.main === module) {
  const { closePool } = require("../utils");
  ingestWcBase()
    .then(() => closePool())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[ERROR]", err);
      process.exit(1);
    });
}
