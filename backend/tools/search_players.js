const { query } = require("../config/db");

async function search_players({ query: searchQuery, position, club, nationality, limit = 10 }) {
  let sql = `
    SELECT p.name, p.position, p.market_value_eur, p.image_url,
           c.name as club_name, co.name as country_name, co.fifa_code
    FROM players p
    LEFT JOIN clubs c ON c.id = p.current_club_id
    LEFT JOIN countries co ON co.id = p.nationality_id
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (searchQuery) {
    sql += ` AND immutable_unaccent(p.name) ILIKE immutable_unaccent($${idx})`;
    params.push(`%${searchQuery}%`);
    idx++;
  }
  if (position) {
    sql += ` AND p.position ILIKE $${idx}`;
    params.push(`%${position}%`);
    idx++;
  }
  if (club) {
    // Bidirectional match: either the DB name/short_name contains the
    // user query, or the user query contains the DB name/short_name.
    // Lets "Junior de Barranquilla" match "CDP Junior FC" via the
    // short_name "Junior" being a substring of the query.
    sql += ` AND (
      immutable_unaccent(c.name) ILIKE immutable_unaccent($${idx})
      OR immutable_unaccent(c.short_name) ILIKE immutable_unaccent($${idx})
      OR immutable_unaccent($${idx + 1}) ILIKE '%' || immutable_unaccent(c.name) || '%'
      OR immutable_unaccent($${idx + 1}) ILIKE '%' || immutable_unaccent(c.short_name) || '%'
    )`;
    params.push(`%${club}%`);
    params.push(club);
    idx += 2;
  }
  if (nationality) {
    sql += ` AND (immutable_unaccent(co.name) ILIKE immutable_unaccent($${idx}) OR co.fifa_code ILIKE $${idx})`;
    params.push(`%${nationality}%`);
    idx++;
  }

  sql += ` ORDER BY p.market_value_eur DESC NULLS LAST LIMIT $${idx}`;
  params.push(limit);

  const result = await query(sql, params);
  return result.rows;
}

module.exports = search_players;
