const { predictMatch } = require("../../prediction");
const { query } = require("../../config/db");

const predictionResolvers = {
  Query: {
    async predictMatch(_parent, { homeTeam, awayTeam }) {
      const result = await predictMatch(homeTeam, awayTeam);
      return {
        homeWin: result.homeWin,
        draw: result.draw,
        awayWin: result.awayWin,
        cached: result.cached === true,
        models: result.models,
      };
    },

    async predictionStats() {
      try {
        const stats = await query(
          `SELECT
             COUNT(*)::int AS unique_predictions,
             COALESCE(SUM(hit_count), 0)::int AS total_hits,
             MIN(computed_at) AS oldest_entry
           FROM prediction_cache`
        );
        const top = await query(
          `SELECT
             (SELECT name FROM clubs WHERE id = home_team_id) AS home_name,
             (SELECT name FROM clubs WHERE id = away_team_id) AS away_name,
             hit_count
           FROM prediction_cache
           ORDER BY hit_count DESC NULLS LAST
           LIMIT 1`
        );

        const row = stats.rows[0] || { unique_predictions: 0, total_hits: 0, oldest_entry: null };
        const unique = row.unique_predictions;
        const hits = row.total_hits;
        const totalRequests = unique + hits; // first hit = compute, rest = cache
        const hitRate = totalRequests > 0 ? (hits / totalRequests) * 100 : 0;

        const topRow = top.rows[0];
        return {
          uniquePredictionsCalculated: unique,
          totalHitsServed: hits,
          cacheHitRatePct: parseFloat(hitRate.toFixed(2)),
          apiCallsSaved: hits,
          mostPredictedHomeTeam: topRow ? topRow.home_name : null,
          mostPredictedAwayTeam: topRow ? topRow.away_name : null,
          mostPredictedHitCount: topRow ? topRow.hit_count : null,
          oldestCacheEntryAt: row.oldest_entry ? row.oldest_entry.toISOString() : null,
        };
      } catch (err) {
        console.warn("[PREDICTION STATS] query failed:", err.message);
        return {
          uniquePredictionsCalculated: 0,
          totalHitsServed: 0,
          cacheHitRatePct: 0,
          apiCallsSaved: 0,
          mostPredictedHomeTeam: null,
          mostPredictedAwayTeam: null,
          mostPredictedHitCount: null,
          oldestCacheEntryAt: null,
        };
      }
    },
  },
};

module.exports = predictionResolvers;
