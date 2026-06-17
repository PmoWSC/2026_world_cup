const { query } = require("../config/db");

async function get_fixtures({ competition, team, status, date_from, date_to, limit = 10 }) {
  // time_status is computed from match_date so Pulpo can answer "what's
  // playing right now" even when the WC scores cron hasn't landed a
  // final score yet. openfootball publishes only finished results, so a
  // match in the middle of its 90 minutes is still status='scheduled'
  // in the DB — we surface "likely_live" for the kickoff..+2h window so
  // Pulpo can say "the match started ~X min ago and is probably running".
  let sql = `
    SELECT f.match_date, f.status, f.home_score, f.away_score, f.matchday,
           ht.name as home_team, at2.name as away_team,
           comp.name as competition_name,
           CASE
             WHEN f.status IN ('IN_PLAY','PAUSED','HALFTIME') THEN 'live'
             WHEN f.status = 'scheduled' AND f.match_date BETWEEN NOW() - INTERVAL '2 hours' AND NOW() + INTERVAL '5 minutes' THEN 'likely_live'
             WHEN f.status = 'finished' THEN 'finished'
             WHEN f.status = 'scheduled' AND f.match_date > NOW() THEN 'upcoming'
             ELSE f.status
           END AS time_status,
           EXTRACT(EPOCH FROM (NOW() - f.match_date))::int AS seconds_since_kickoff
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
    // Inclusive of the entire day. Without this, "date_to=2026-06-06"
    // is interpreted as 2026-06-06 00:00:00 UTC and excludes any
    // match later that day.
    sql += ` AND f.match_date < ($${idx}::date + interval '1 day')`;
    params.push(date_to);
    idx++;
  }

  sql += ` ORDER BY f.match_date ASC LIMIT $${idx}`;
  params.push(limit);

  const result = await query(sql, params);
  return result.rows;
}

module.exports = get_fixtures;
