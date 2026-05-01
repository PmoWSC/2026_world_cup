const { query } = require("../config/db");

async function find_connections({ team_a, team_b }) {
  const result = await query(
    `SELECT pa.name as player_a, pb.name as player_b, c.name as club_name
     FROM players pa
     JOIN countries ca ON ca.id = pa.nationality_id
     JOIN players pb ON pb.current_club_id = pa.current_club_id AND pb.id != pa.id
     JOIN countries cb ON cb.id = pb.nationality_id
     JOIN clubs c ON c.id = pa.current_club_id
     WHERE (ca.name ILIKE $1 AND cb.name ILIKE $2)
        OR (ca.name ILIKE $2 AND cb.name ILIKE $1)
     LIMIT 20`,
    [team_a, team_b]
  );

  return result.rows.map((row) => ({
    type: "shared_club",
    player_a: row.player_a,
    player_b: row.player_b,
    club: row.club_name,
    description: `${row.player_a} and ${row.player_b} play together at ${row.club_name}`,
  }));
}

module.exports = find_connections;
