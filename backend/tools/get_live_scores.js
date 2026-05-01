const { query } = require("../config/db");

async function get_live_scores({ competition }) {
  let sql = `
    SELECT f.match_date, f.home_score, f.away_score, f.status,
           ht.name as home_team, at2.name as away_team,
           comp.name as competition_name
    FROM fixtures f
    LEFT JOIN clubs ht ON ht.id = f.home_team_id
    LEFT JOIN clubs at2 ON at2.id = f.away_team_id
    LEFT JOIN competitions comp ON comp.id = f.competition_id
    WHERE f.status IN ('IN_PLAY', 'PAUSED', 'HALFTIME')
  `;
  const params = [];

  if (competition) {
    sql += ` AND comp.slug = $1`;
    params.push(competition);
  }

  sql += ` ORDER BY f.match_date ASC`;

  const result = await query(sql, params);

  if (result.rows.length === 0) {
    return { message: "No live matches at the moment.", matches: [] };
  }

  return { matches: result.rows };
}

module.exports = get_live_scores;
