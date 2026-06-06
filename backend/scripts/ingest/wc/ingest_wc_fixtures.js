const { query } = require("../utils");
const { fetchOpenfootball } = require("./fetch_openfootball");
const ingestWcVenues = require("./ingest_wc_venues");
const { COMPETITION } = require("./ingest_wc_base");
const { buildFixtureRows } = require("./wc_transform");

async function ingestWcFixtures(opts = {}) {
  console.log("[WC FIXTURES] Schedule (104 matches)...");

  // Resolve competition id.
  let competitionId = opts.competitionId;
  if (!competitionId) {
    const r = await query("SELECT id FROM competitions WHERE slug = $1", [COMPETITION.slug]);
    if (r.rows.length === 0) {
      throw new Error(`Competition ${COMPETITION.slug} not found — run ingest_wc_base first.`);
    }
    competitionId = r.rows[0].id;
  }

  // Resolve venues (ground string -> venue id).
  const groundToVenueId = opts.groundToVenueId || (await ingestWcVenues());

  // Resolve national teams (team name -> club id) for this competition.
  const clubRows = await query(
    "SELECT id, name FROM clubs WHERE competition_id = $1",
    [competitionId]
  );
  const teamToClubId = {};
  for (const row of clubRows.rows) teamToClubId[row.name] = row.id;

  const data = await fetchOpenfootball();
  const rows = buildFixtureRows(data.matches);

  let unresolvedVenues = 0;
  let groupTeamsResolved = 0;
  let total = 0;

  for (const r of rows) {
    const venueId = groundToVenueId[r.ground] || null;
    if (!venueId) {
      console.warn(`  [WARN] no venue match for ground "${r.ground}"`);
      unresolvedVenues++;
    }

    // Only group matches have real teams now; knockout slots are
    // placeholders (1A, W74) and stay NULL until Phase 3 resolves them.
    let homeId = null;
    let awayId = null;
    if (r.isGroup) {
      homeId = teamToClubId[r.team1] || null;
      awayId = teamToClubId[r.team2] || null;
      if (homeId && awayId) groupTeamsResolved++;
      else console.warn(`  [WARN] unresolved group team: ${r.team1} vs ${r.team2}`);
    }

    await query(
      `INSERT INTO fixtures
         (competition_id, match_number, matchday, group_name, stage, match_date,
          venue_id, home_team_id, away_team_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
       ON CONFLICT (competition_id, match_number) DO UPDATE SET
         matchday = EXCLUDED.matchday,
         group_name = EXCLUDED.group_name,
         stage = EXCLUDED.stage,
         match_date = EXCLUDED.match_date,
         venue_id = COALESCE(EXCLUDED.venue_id, fixtures.venue_id),
         -- keep teams/scores already resolved by Phase 3: only fill from
         -- the schedule when it actually carries a value (group matches).
         home_team_id = COALESCE(EXCLUDED.home_team_id, fixtures.home_team_id),
         away_team_id = COALESCE(EXCLUDED.away_team_id, fixtures.away_team_id),
         updated_at = NOW()`,
      [competitionId, r.matchNumber, r.matchday, r.groupName, r.stage, r.matchDate,
       venueId, homeId, awayId]
    );
    total++;
  }

  console.log(
    `[WC FIXTURES] ${total} fixtures (${groupTeamsResolved}/72 group matches with teams, ` +
    `${unresolvedVenues} venue misses)`
  );
  return { total, groupTeamsResolved, unresolvedVenues };
}

module.exports = ingestWcFixtures;

if (require.main === module) {
  const { closePool } = require("../utils");
  ingestWcFixtures()
    .then(() => closePool())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[ERROR]", err);
      process.exit(1);
    });
}
