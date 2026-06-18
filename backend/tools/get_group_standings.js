const { query } = require("../config/db");

async function get_group_standings({ competition, group }) {
  let sql = `
    SELECT
      c.name as team,
      COUNT(*) as played,
      SUM(CASE WHEN
        (f.home_team_id = c2.id AND f.home_score > f.away_score) OR
        (f.away_team_id = c2.id AND f.away_score > f.home_score) THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN f.home_score = f.away_score THEN 1 ELSE 0 END) as drawn,
      SUM(CASE WHEN
        (f.home_team_id = c2.id AND f.home_score < f.away_score) OR
        (f.away_team_id = c2.id AND f.away_score < f.home_score) THEN 1 ELSE 0 END) as lost,
      SUM(CASE WHEN f.home_team_id = c2.id THEN f.home_score ELSE f.away_score END) as goals_for,
      SUM(CASE WHEN f.home_team_id = c2.id THEN f.away_score ELSE f.home_score END) as goals_against
    FROM fixtures f
    JOIN competitions comp ON comp.id = f.competition_id
    JOIN clubs c2 ON c2.id = f.home_team_id OR c2.id = f.away_team_id
    JOIN countries c ON c.id = c2.country_id
    WHERE comp.slug = $1 AND f.status = 'finished'
  `;
  const params = [competition];

  if (group) {
    sql += ` AND f.group_name = $2`;
    params.push(group);
  }

  sql += `
    GROUP BY c.name
    ORDER BY (SUM(CASE WHEN
      (f.home_team_id = c2.id AND f.home_score > f.away_score) OR
      (f.away_team_id = c2.id AND f.away_score > f.home_score) THEN 3
      WHEN f.home_score = f.away_score THEN 1 ELSE 0 END)) DESC
  `;

  const result = await query(sql, params);
  return result.rows;
}

module.exports = get_group_standings;
