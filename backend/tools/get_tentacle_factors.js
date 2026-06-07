const { query } = require("../config/db");

// `get_tentacle_factors` exposes the context that the numeric prediction
// models cannot capture: where the match is played, how rested each side
// is, how taxing the venue is. Pulpo uses this to enrich its answer
// after running predict_match.
//
// Designed for national-team matches (World Cup, internationals). For
// club matches it returns a polite "not applicable" so Pulpo skips it.
async function get_tentacle_factors({ home_team, away_team, venue }) {
  try {
    const homeId = await resolveClubId(home_team);
    const awayId = await resolveClubId(away_team);
    if (!homeId || !awayId) {
      return { error: `Team not found: ${!homeId ? home_team : away_team}` };
    }

    if (!(await areBothNationalTeams(homeId, awayId))) {
      return {
        applies: false,
        reason: "Tentacle factors only apply to national-team matches (World Cup, friendlies).",
      };
    }

    const [recoveryHome, recoveryAway, venueData] = await Promise.all([
      daysSinceLastMatch(homeId),
      daysSinceLastMatch(awayId),
      resolveVenue(venue, homeId, awayId),
    ]);

    return {
      applies: true,
      home_team,
      away_team,
      venue: venueData ? venueData.name : null,
      factors: {
        altitude: formatAltitude(venueData),
        climate: formatClimate(venueData),
        recovery: formatRecovery(home_team, recoveryHome, away_team, recoveryAway),
        travel: { applies: false, note: "Travel distance not yet available." },
        referee: { applies: false, note: "Referee assignment not in database." },
      },
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function resolveClubId(teamName) {
  const exact = await query(
    `SELECT id FROM clubs
     WHERE immutable_unaccent(name) ILIKE immutable_unaccent($1)
     LIMIT 1`,
    [teamName]
  );
  if (exact.rows.length) return exact.rows[0].id;
  const fuzzy = await query(
    `SELECT id FROM clubs
     WHERE immutable_unaccent(name) ILIKE immutable_unaccent($1)
        OR immutable_unaccent(short_name) ILIKE immutable_unaccent($1)
     LIMIT 1`,
    [`%${teamName}%`]
  );
  return fuzzy.rows.length ? fuzzy.rows[0].id : null;
}

async function areBothNationalTeams(homeId, awayId) {
  const r = await query(
    `SELECT COUNT(*)::int AS count
     FROM clubs c JOIN competitions comp ON comp.id = c.competition_id
     WHERE comp.slug = 'world_cup_2026' AND c.id IN ($1, $2)`,
    [homeId, awayId]
  );
  return r.rows[0].count === 2;
}

async function daysSinceLastMatch(clubId) {
  const r = await query(
    `SELECT EXTRACT(EPOCH FROM (NOW() - MAX(match_date))) / 86400 AS days
     FROM fixtures
     WHERE status = 'finished'
       AND (home_team_id = $1 OR away_team_id = $1)`,
    [clubId]
  );
  const days = r.rows[0] && r.rows[0].days != null ? Number(r.rows[0].days) : null;
  return days != null ? Math.round(days) : null;
}

// Try to find the venue by name; fall back to the next scheduled fixture's
// venue for these two teams if no name was provided.
async function resolveVenue(venueName, homeId, awayId) {
  if (venueName) {
    const r = await query(
      `SELECT name, city, country, altitude_meters, avg_june_temp_celsius
       FROM venues
       WHERE immutable_unaccent(name) ILIKE immutable_unaccent($1)
       LIMIT 1`,
      [`%${venueName}%`]
    );
    if (r.rows.length) return r.rows[0];
  }
  const fixture = await query(
    `SELECT v.name, v.city, v.country, v.altitude_meters, v.avg_june_temp_celsius
     FROM fixtures f
     JOIN venues v ON v.id = f.venue_id
     WHERE ((f.home_team_id = $1 AND f.away_team_id = $2)
            OR (f.home_team_id = $2 AND f.away_team_id = $1))
     ORDER BY f.match_date ASC
     LIMIT 1`,
    [homeId, awayId]
  );
  return fixture.rows.length ? fixture.rows[0] : null;
}

function formatAltitude(venueData) {
  if (!venueData || venueData.altitude_meters == null) {
    return { applies: false, note: "Venue altitude unknown." };
  }
  const m = venueData.altitude_meters;
  if (m >= 1500) {
    return {
      applies: true,
      meters: m,
      impact: "high",
      description: `${m}m altitude — significant advantage for the team acclimated to it; visitors typically lose stamina in the last 20 min.`,
    };
  }
  if (m >= 800) {
    return {
      applies: true,
      meters: m,
      impact: "moderate",
      description: `${m}m altitude — mild aerobic disadvantage for visitors.`,
    };
  }
  return {
    applies: true,
    meters: m,
    impact: "neutral",
    description: `${m}m — sea-level conditions, no altitude effect.`,
  };
}

function formatClimate(venueData) {
  if (!venueData || venueData.avg_june_temp_celsius == null) {
    return { applies: false, note: "Venue climate unknown." };
  }
  const t = Number(venueData.avg_june_temp_celsius);
  if (t >= 32) return { applies: true, avg_temp_c: t, impact: "high", description: `Avg ${t}°C — extreme heat favours teams accustomed to it.` };
  if (t >= 26) return { applies: true, avg_temp_c: t, impact: "moderate", description: `Avg ${t}°C — warm; minor stamina drain in afternoon kickoffs.` };
  if (t <= 5) return { applies: true, avg_temp_c: t, impact: "moderate", description: `Avg ${t}°C — cold venue; pitch may be harder.` };
  return { applies: true, avg_temp_c: t, impact: "neutral", description: `Avg ${t}°C — mild conditions.` };
}

function formatRecovery(homeName, homeDays, awayName, awayDays) {
  if (homeDays == null || awayDays == null) {
    return { applies: false, note: "No recent finished matches in the database for one of the teams." };
  }
  const diff = homeDays - awayDays;
  return {
    applies: true,
    home_days_since_last: homeDays,
    away_days_since_last: awayDays,
    impact: Math.abs(diff) >= 4 ? "moderate" : "neutral",
    description:
      Math.abs(diff) < 4
        ? "Both teams with similar rest."
        : diff > 0
        ? `${awayName} more rested (${awayDays}d vs ${homeDays}d) — slight visitor edge.`
        : `${homeName} more rested (${homeDays}d vs ${awayDays}d) — slight home edge.`,
  };
}

module.exports = get_tentacle_factors;
