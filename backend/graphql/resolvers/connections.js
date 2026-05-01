const { query } = require("../../config/db");

const connectionResolvers = {
  Query: {
    async headToHead(_parent, { teamA, teamB }) {
      const result = await query(
        `SELECT wmh.match_date, wmh.home_score, wmh.away_score,
                hc.name as home_name, ac.name as away_name
         FROM wc_matches_historical wmh
         JOIN countries hc ON hc.id = wmh.home_country_id
         JOIN countries ac ON ac.id = wmh.away_country_id
         WHERE (hc.name ILIKE $1 AND ac.name ILIKE $2)
            OR (hc.name ILIKE $2 AND ac.name ILIKE $1)
         ORDER BY wmh.match_date DESC`,
        [teamA, teamB]
      );

      let teamAWins = 0;
      let teamBWins = 0;
      let draws = 0;

      const matches = result.rows.map((row) => {
        const isTeamAHome = row.home_name.toLowerCase().includes(teamA.toLowerCase());
        if (row.home_score > row.away_score) {
          if (isTeamAHome) teamAWins++;
          else teamBWins++;
        } else if (row.home_score < row.away_score) {
          if (isTeamAHome) teamBWins++;
          else teamAWins++;
        } else {
          draws++;
        }

        return {
          date: row.match_date,
          homeTeam: row.home_name,
          awayTeam: row.away_name,
          homeScore: row.home_score,
          awayScore: row.away_score,
        };
      });

      return {
        teamA,
        teamB,
        totalMatches: matches.length,
        teamAWins,
        teamBWins,
        draws,
        matches,
      };
    },

    async connections(_parent, { teamA, teamB }) {
      const result = await query(
        `SELECT DISTINCT
           pa.name as player_a, pb.name as player_b, c.name as club_name
         FROM players pa
         JOIN countries ca ON ca.id = pa.nationality_id
         JOIN players pb ON pb.current_club_id = pa.current_club_id AND pb.id != pa.id
         JOIN countries cb ON cb.id = pb.nationality_id
         JOIN clubs c ON c.id = pa.current_club_id
         WHERE (ca.name ILIKE $1 AND cb.name ILIKE $2)
            OR (ca.name ILIKE $2 AND cb.name ILIKE $1)
         LIMIT 20`,
        [teamA, teamB]
      );

      return result.rows.map((row) => ({
        type: "shared_club",
        description: `${row.player_a} and ${row.player_b} play together at ${row.club_name}`,
        playerA: row.player_a,
        playerB: row.player_b,
        club: row.club_name,
      }));
    },
  },
};

module.exports = connectionResolvers;
