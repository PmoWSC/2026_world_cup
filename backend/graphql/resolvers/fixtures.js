const { query } = require("../../config/db");

const fixtureResolvers = {
  Query: {
    async fixtures(_parent, { competition, team, status, dateFrom, dateTo, limit = 20 }) {
      let sql = `
        SELECT f.id, f.matchday, f.group_name, f.stage, f.match_date, f.home_score, f.away_score,
               f.halftime_home_score, f.halftime_away_score, f.status,
               comp.id as comp_id, comp.name as comp_name, comp.slug as comp_slug, comp.type as comp_type, comp.season,
               v.id as venue_id, v.name as venue_name, v.city as venue_city, v.country as venue_country, v.capacity as venue_capacity,
               ht.id as home_id, ht.name as home_name, ht.short_name as home_short, ht.crest_url as home_crest,
               at2.id as away_id, at2.name as away_name, at2.short_name as away_short, at2.crest_url as away_crest
        FROM fixtures f
        LEFT JOIN competitions comp ON comp.id = f.competition_id
        LEFT JOIN venues v ON v.id = f.venue_id
        LEFT JOIN clubs ht ON ht.id = f.home_team_id
        LEFT JOIN clubs at2 ON at2.id = f.away_team_id
        WHERE 1=1
      `;
      const params = [];
      let paramIdx = 1;

      if (competition) {
        sql += ` AND comp.slug = $${paramIdx}`;
        params.push(competition);
        paramIdx++;
      }
      if (team) {
        sql += ` AND (ht.name ILIKE $${paramIdx} OR at2.name ILIKE $${paramIdx})`;
        params.push(`%${team}%`);
        paramIdx++;
      }
      if (status) {
        sql += ` AND f.status = $${paramIdx}`;
        params.push(status);
        paramIdx++;
      }
      if (dateFrom) {
        sql += ` AND f.match_date >= $${paramIdx}`;
        params.push(dateFrom);
        paramIdx++;
      }
      if (dateTo) {
        sql += ` AND f.match_date <= $${paramIdx}`;
        params.push(dateTo);
        paramIdx++;
      }

      sql += ` ORDER BY f.match_date ASC LIMIT $${paramIdx}`;
      params.push(limit);

      const result = await query(sql, params);
      return result.rows.map(mapFixtureRow);
    },

    async liveScores(_parent, { competition }) {
      let sql = `
        SELECT f.id, f.matchday, f.group_name, f.stage, f.match_date, f.home_score, f.away_score,
               f.halftime_home_score, f.halftime_away_score, f.status,
               comp.id as comp_id, comp.name as comp_name, comp.slug as comp_slug, comp.type as comp_type, comp.season,
               v.id as venue_id, v.name as venue_name, v.city as venue_city, v.country as venue_country, v.capacity as venue_capacity,
               ht.id as home_id, ht.name as home_name, ht.short_name as home_short, ht.crest_url as home_crest,
               at2.id as away_id, at2.name as away_name, at2.short_name as away_short, at2.crest_url as away_crest
        FROM fixtures f
        LEFT JOIN competitions comp ON comp.id = f.competition_id
        LEFT JOIN venues v ON v.id = f.venue_id
        LEFT JOIN clubs ht ON ht.id = f.home_team_id
        LEFT JOIN clubs at2 ON at2.id = f.away_team_id
        WHERE f.status IN ('IN_PLAY', 'PAUSED', 'HALFTIME')
      `;
      const params = [];

      if (competition) {
        sql += ` AND comp.slug = $1`;
        params.push(competition);
      }

      sql += ` ORDER BY f.match_date ASC`;

      const result = await query(sql, params);
      return result.rows.map(mapFixtureRow);
    },
  },
};

function mapFixtureRow(row) {
  return {
    id: row.id,
    matchday: row.matchday,
    groupName: row.group_name,
    stage: row.stage,
    matchDate: row.match_date,
    homeScore: row.home_score,
    awayScore: row.away_score,
    halftimeHomeScore: row.halftime_home_score,
    halftimeAwayScore: row.halftime_away_score,
    status: row.status,
    competition: row.comp_id
      ? { id: row.comp_id, name: row.comp_name, slug: row.comp_slug, type: row.comp_type, season: row.season }
      : null,
    venue: row.venue_id
      ? { id: row.venue_id, name: row.venue_name, city: row.venue_city, country: row.venue_country, capacity: row.venue_capacity }
      : null,
    homeTeam: row.home_id
      ? { id: row.home_id, name: row.home_name, shortName: row.home_short, crestUrl: row.home_crest }
      : null,
    awayTeam: row.away_id
      ? { id: row.away_id, name: row.away_name, shortName: row.away_short, crestUrl: row.away_crest }
      : null,
  };
}

module.exports = fixtureResolvers;
