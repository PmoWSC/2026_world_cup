const { query, fetchFootballData } = require("./utils");

const COMPETITIONS = [
  { code: "PD", slug: "la_liga_2025", season: "2025" },
  { code: "PL", slug: "premier_league_2025", season: "2025" },
  { code: "CLI", slug: "libertadores_2026", season: "2026" },
];

async function ingestPlayers() {
  console.log("[INGEST] Players from football-data.org team squads...");

  let totalPlayers = 0;

  for (const comp of COMPETITIONS) {
    const data = await fetchFootballData(
      `/competitions/${comp.code}/teams?season=${comp.season}`
    );
    const teams = data.teams || [];

    for (const team of teams) {
      // Find club in our DB
      const clubResult = await query(
        "SELECT id FROM clubs WHERE football_data_id = $1 LIMIT 1",
        [team.id]
      );
      if (clubResult.rows.length === 0) continue;
      const clubId = clubResult.rows[0].id;

      const squad = team.squad || [];
      for (const player of squad) {
        // Find nationality
        let nationalityId = null;
        if (player.nationality) {
          const natResult = await query(
            "SELECT id FROM countries WHERE name ILIKE $1 LIMIT 1",
            [player.nationality]
          );
          if (natResult.rows.length > 0) {
            nationalityId = natResult.rows[0].id;
          }
        }

        const position = mapPosition(player.position);

        await query(
          `INSERT INTO players (football_data_id, name, full_name, date_of_birth, nationality_id, current_club_id, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (football_data_id) DO UPDATE SET
             name = EXCLUDED.name,
             full_name = EXCLUDED.full_name,
             date_of_birth = EXCLUDED.date_of_birth,
             nationality_id = EXCLUDED.nationality_id,
             current_club_id = EXCLUDED.current_club_id,
             position = EXCLUDED.position`,
          [
            player.id,
            player.name,
            player.name,
            player.dateOfBirth || null,
            nationalityId,
            clubId,
            position,
          ]
        );
        totalPlayers++;
      }
    }

    console.log(`  [INGEST] Players loaded for ${comp.slug}`);
  }

  console.log(`[INGEST] ${totalPlayers} total players inserted`);
  return totalPlayers;
}

function mapPosition(pos) {
  if (!pos) return null;
  const map = {
    Goalkeeper: "Goalkeeper",
    Defence: "Defender",
    "Left-Back": "Defender",
    "Right-Back": "Defender",
    "Centre-Back": "Defender",
    Midfield: "Midfielder",
    "Central Midfield": "Midfielder",
    "Attacking Midfield": "Midfielder",
    "Defensive Midfield": "Midfielder",
    "Left Midfield": "Midfielder",
    "Right Midfield": "Midfielder",
    "Left Winger": "Forward",
    "Right Winger": "Forward",
    Offence: "Forward",
    "Centre-Forward": "Forward",
  };
  return map[pos] || pos;
}

module.exports = ingestPlayers;

if (require.main === module) {
  ingestPlayers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[ERROR]", err);
      process.exit(1);
    });
}
