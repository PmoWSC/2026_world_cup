const { query } = require("../../config/db");

const playerResolvers = {
  Query: {
    async players(_parent, { query: searchQuery, position, club, nationality, limit = 20 }) {
      let sql = `
        SELECT p.id, p.name, p.full_name, p.date_of_birth, p.position, p.market_value_eur, p.image_url,
               c.id as club_id, c.name as club_name, c.short_name as club_short_name, c.crest_url,
               co.id as country_id, co.name as country_name, co.fifa_code, co.flag_emoji
        FROM players p
        LEFT JOIN clubs c ON c.id = p.current_club_id
        LEFT JOIN countries co ON co.id = p.nationality_id
        WHERE 1=1
      `;
      const params = [];
      let paramIdx = 1;

      if (searchQuery) {
        sql += ` AND (p.name ILIKE $${paramIdx} OR p.full_name ILIKE $${paramIdx})`;
        params.push(`%${searchQuery}%`);
        paramIdx++;
      }
      if (position) {
        sql += ` AND p.position ILIKE $${paramIdx}`;
        params.push(`%${position}%`);
        paramIdx++;
      }
      if (club) {
        sql += ` AND c.name ILIKE $${paramIdx}`;
        params.push(`%${club}%`);
        paramIdx++;
      }
      if (nationality) {
        sql += ` AND (co.name ILIKE $${paramIdx} OR co.fifa_code ILIKE $${paramIdx})`;
        params.push(`%${nationality}%`);
        paramIdx++;
      }

      sql += ` ORDER BY p.market_value_eur DESC NULLS LAST LIMIT $${paramIdx}`;
      params.push(limit);

      const result = await query(sql, params);
      return result.rows.map(mapPlayerRow);
    },

    async squad(_parent, { country, competition }) {
      let sql = `
        SELECT p.id, p.name, p.full_name, p.date_of_birth, p.position, p.market_value_eur, p.image_url,
               c.id as club_id, c.name as club_name, c.short_name as club_short_name, c.crest_url,
               co.id as country_id, co.name as country_name, co.fifa_code, co.flag_emoji
        FROM players p
        LEFT JOIN clubs c ON c.id = p.current_club_id
        LEFT JOIN countries co ON co.id = p.nationality_id
        WHERE (co.name ILIKE $1 OR co.fifa_code ILIKE $1)
      `;
      const params = [country];

      if (competition) {
        sql += ` AND c.competition_id = (SELECT id FROM competitions WHERE slug = $2)`;
        params.push(competition);
      }

      sql += ` ORDER BY p.position, p.name`;

      const result = await query(sql, params);
      return result.rows.map(mapPlayerRow);
    },
  },
};

function mapPlayerRow(row) {
  return {
    id: row.id,
    name: row.name,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    position: row.position,
    marketValueEur: row.market_value_eur,
    imageUrl: row.image_url,
    currentClub: row.club_id
      ? {
          id: row.club_id,
          name: row.club_name,
          shortName: row.club_short_name,
          crestUrl: row.crest_url,
        }
      : null,
    nationality: row.country_id
      ? {
          id: row.country_id,
          name: row.country_name,
          fifaCode: row.fifa_code,
          flagEmoji: row.flag_emoji,
        }
      : null,
  };
}

module.exports = playerResolvers;
