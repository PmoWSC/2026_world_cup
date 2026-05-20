const { query } = require("../config/db");

async function get_squad({ country, competition }) {
  let sql = `
    SELECT p.name, p.position, p.market_value_eur, c.name as club_name,
           co.name as country_name, co.fifa_code
    FROM players p
    LEFT JOIN clubs c ON c.id = p.current_club_id
    JOIN countries co ON co.id = p.nationality_id
    WHERE immutable_unaccent(co.name) ILIKE immutable_unaccent($1) OR co.fifa_code ILIKE $1
  `;
  const params = [country];

  if (competition) {
    sql += ` AND c.competition_id = (SELECT id FROM competitions WHERE slug = $2)`;
    params.push(competition);
  }

  sql += ` ORDER BY p.position, p.market_value_eur DESC NULLS LAST`;

  const result = await query(sql, params);
  return { country, players: result.rows, total: result.rows.length };
}

module.exports = get_squad;
