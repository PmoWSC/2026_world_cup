const { query } = require("../config/db");

async function get_fixtures({ competition, team, status, date_from, date_to, limit = 10 }) {
  let sql = `
    SELECT f.match_date, f.status, f.home_score, f.away_score, f.matchday,
           ht.name as home_team, at2.name as away_team,
           comp.name as competition_name
    FROM fixtures f
    LEFT JOIN clubs ht ON ht.id = f.home_team_id
    LEFT JOIN clubs at2 ON at2.id = f.away_team_id
    LEFT JOIN competitions comp ON comp.id = f.competition_id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (competition) {
    sql += ` AND comp.slug = $${idx}`;
    params.push(competition);
    idx++;
  }
  if (team) {
    sql += ` AND (immutable_unaccent(ht.name) ILIKE immutable_unaccent($${idx}) OR immutable_unaccent(at2.name) ILIKE immutable_unaccent($${idx}))`;
    params.push(`%${team}%`);
    idx++;
  }
  if (status) {
    sql += ` AND f.status = $${idx}`;
    params.push(status);
    idx++;
  }
  if (date_from) {
    sql += ` AND f.match_date >= $${idx}`;
    params.push(date_from);
    idx++;
  }
  if (date_to) {
    sql += ` AND f.match_date <= $${idx}`;
    params.push(date_to);
    idx++;
  }

  sql += ` ORDER BY f.match_date ASC LIMIT $${idx}`;
  params.push(limit);

  const result = await query(sql, params);
  return result.rows;
}

module.exports = get_fixtures;
