const { query, fetchFootballData } = require("./utils");

const COMPETITIONS = [
  { code: "PD", slug: "la_liga_2025", season: "2025" },
  { code: "PL", slug: "premier_league_2025", season: "2025" },
  { code: "CLI", slug: "libertadores_2026", season: "2026" },
];

async function ingestFixtures() {
  console.log("[INGEST] Fixtures from football-data.org...");

  let totalFixtures = 0;

  for (const comp of COMPETITIONS) {
    // Get competition ID
    const compResult = await query(
      "SELECT id FROM competitions WHERE slug = $1",
      [comp.slug]
    );
    if (compResult.rows.length === 0) {
      console.warn(`  [WARN] Competition ${comp.slug} not found, skipping fixtures`);
      continue;
    }
    const competitionId = compResult.rows[0].id;

    const data = await fetchFootballData(
      `/competitions/${comp.code}/matches?season=${comp.season}`
    );
    const matches = data.matches || [];

    for (const match of matches) {
      // Resolve home/away team IDs
      const homeTeamId = await resolveTeamId(match.homeTeam);
      const awayTeamId = await resolveTeamId(match.awayTeam);

      const status = mapStatus(match.status);
      const homeScore = match.score?.fullTime?.home ?? null;
      const awayScore = match.score?.fullTime?.away ?? null;
      const htHome = match.score?.halfTime?.home ?? null;
      const htAway = match.score?.halfTime?.away ?? null;

      await query(
        `INSERT INTO fixtures (
          competition_id, matchday, stage, match_date,
          home_team_id, away_team_id, home_score, away_score,
          halftime_home_score, halftime_away_score, status, football_data_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT DO NOTHING`,
        [
          competitionId,
          match.matchday || null,
          match.stage || null,
          match.utcDate,
          homeTeamId,
          awayTeamId,
          homeScore,
          awayScore,
          htHome,
          htAway,
          status,
          match.id,
        ]
      );
      totalFixtures++;
    }

    console.log(`  [INGEST] ${matches.length} fixtures from ${comp.slug}`);
  }

  console.log(`[INGEST] ${totalFixtures} total fixtures inserted`);
  return totalFixtures;
}

async function resolveTeamId(team) {
  if (!team || !team.id) return null;
  const result = await query(
    "SELECT id FROM clubs WHERE football_data_id = $1 LIMIT 1",
    [team.id]
  );
  return result.rows.length > 0 ? result.rows[0].id : null;
}

function mapStatus(status) {
  const map = {
    SCHEDULED: "scheduled",
    TIMED: "scheduled",
    IN_PLAY: "IN_PLAY",
    PAUSED: "PAUSED",
    FINISHED: "finished",
    POSTPONED: "postponed",
    SUSPENDED: "suspended",
    CANCELLED: "cancelled",
  };
  return map[status] || status;
}

module.exports = ingestFixtures;

if (require.main === module) {
  ingestFixtures()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[ERROR]", err);
      process.exit(1);
    });
}
