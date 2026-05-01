const { query, fetchFootballData } = require("./utils");

const COMPETITIONS = [
  { code: "PD", slug: "la_liga_2025", name: "La Liga", type: "league", season: "2025" },
  { code: "PL", slug: "premier_league_2025", name: "Premier League", type: "league", season: "2025" },
];

async function ingestClubs() {
  console.log("[INGEST] Clubs from football-data.org...");

  let totalClubs = 0;

  for (const comp of COMPETITIONS) {
    // Upsert competition
    const compResult = await query(
      `INSERT INTO competitions (name, slug, type, season, football_data_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         is_active = true
       RETURNING id`,
      [comp.name, comp.slug, comp.type, comp.season, null]
    );
    const competitionId = compResult.rows[0].id;

    // Fetch teams
    const data = await fetchFootballData(`/competitions/${comp.code}/teams?season=${comp.season}`);
    const teams = data.teams || [];

    for (const team of teams) {
      // Find country
      let countryId = null;
      if (team.area && team.area.name) {
        const countryResult = await query(
          "SELECT id FROM countries WHERE name ILIKE $1 LIMIT 1",
          [team.area.name]
        );
        if (countryResult.rows.length > 0) {
          countryId = countryResult.rows[0].id;
        }
      }

      await query(
        `INSERT INTO clubs (name, short_name, league, country_id, competition_id, crest_url, football_data_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT DO NOTHING`,
        [
          team.name,
          team.shortName || team.tla,
          comp.name,
          countryId,
          competitionId,
          team.crest || null,
          team.id,
        ]
      );
      totalClubs++;
    }

    console.log(`  [INGEST] ${teams.length} clubs from ${comp.name}`);
  }

  console.log(`[INGEST] ${totalClubs} total clubs inserted`);
  return totalClubs;
}

module.exports = ingestClubs;

if (require.main === module) {
  ingestClubs()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[ERROR]", err);
      process.exit(1);
    });
}
