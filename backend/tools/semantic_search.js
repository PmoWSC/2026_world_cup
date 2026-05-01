const { query } = require("../config/db");

async function semantic_search({ query: searchQuery, limit = 5 }) {
  // Fallback to ILIKE search until embeddings are generated (Phase 3)
  const result = await query(
    `SELECT p.name, p.position, p.market_value_eur,
            c.name as club_name, co.name as country_name
     FROM players p
     LEFT JOIN clubs c ON c.id = p.current_club_id
     LEFT JOIN countries co ON co.id = p.nationality_id
     WHERE p.name ILIKE $1 OR c.name ILIKE $1 OR co.name ILIKE $1
     ORDER BY p.market_value_eur DESC NULLS LAST
     LIMIT $2`,
    [`%${searchQuery}%`, limit]
  );

  return { query: searchQuery, results: result.rows, method: "text_fallback" };
}

module.exports = semantic_search;
