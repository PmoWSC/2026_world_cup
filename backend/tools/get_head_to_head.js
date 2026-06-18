const { query } = require("../config/db");

async function get_head_to_head({ team_a, team_b }) {
  const result = await query(
    `SELECT wmh.match_date, wmh.home_score, wmh.away_score, wmh.tournament_year, wmh.stage,
            hc.name as home_name, ac.name as away_name
     FROM wc_matches_historical wmh
     JOIN countries hc ON hc.id = wmh.home_country_id
     JOIN countries ac ON ac.id = wmh.away_country_id
     WHERE (hc.name ILIKE $1 AND ac.name ILIKE $2)
        OR (hc.name ILIKE $2 AND ac.name ILIKE $1)
     ORDER BY wmh.match_date DESC`,
    [team_a, team_b]
  );

  return {
    team_a,
    team_b,
    total_matches: result.rows.length,
    matches: result.rows,
  };
}

module.exports = get_head_to_head;
