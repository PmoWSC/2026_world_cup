const { query } = require("../config/db");

async function get_league_standings({ competition }) {
  const result = await query(
    `WITH team_stats AS (
      SELECT
        t.id as team_id, t.name as team,
        COUNT(*) as played,
        SUM(CASE
          WHEN (f.home_team_id = t.id AND f.home_score > f.away_score)
            OR (f.away_team_id = t.id AND f.away_score > f.home_score) THEN 1 ELSE 0 END) as won,
        SUM(CASE WHEN f.home_score = f.away_score THEN 1 ELSE 0 END) as drawn,
        SUM(CASE
          WHEN (f.home_team_id = t.id AND f.home_score < f.away_score)
            OR (f.away_team_id = t.id AND f.away_score < f.home_score) THEN 1 ELSE 0 END) as lost,
        SUM(CASE WHEN f.home_team_id = t.id THEN f.home_score ELSE f.away_score END) as goals_for,
        SUM(CASE WHEN f.home_team_id = t.id THEN f.away_score ELSE f.home_score END) as goals_against
      FROM fixtures f
      JOIN competitions comp ON comp.id = f.competition_id
      JOIN clubs t ON t.id = f.home_team_id OR t.id = f.away_team_id
      WHERE comp.slug = $1 AND f.status = 'finished'
      GROUP BY t.id, t.name
    )
    SELECT *,
      (won * 3 + drawn) as points,
      (goals_for - goals_against) as goal_difference
    FROM team_stats
    ORDER BY points DESC, goal_difference DESC, goals_for DESC`,
    [competition]
  );

  return result.rows.map((row, i) => ({
    position: i + 1,
    team: row.team,
    played: parseInt(row.played),
    won: parseInt(row.won),
    drawn: parseInt(row.drawn),
    lost: parseInt(row.lost),
    goals_for: parseInt(row.goals_for),
    goals_against: parseInt(row.goals_against),
    goal_difference: parseInt(row.goal_difference),
    points: parseInt(row.points),
  }));
}

module.exports = get_league_standings;
