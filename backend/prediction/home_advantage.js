// Continuous home-advantage factor for a single team in a single match.
//
// The classic model assumes "the team listed as home gets full home
// advantage". For league matches that's fine (Madrid in the Bernabéu).
// For national-team matches it's wrong: a Portugal-Germany friendly in
// Istanbul has neither side at home. This module fixes that.
//
// Returns a number in [0, 1]:
//   1.0 — team plays in its own country (true home)
//   0.4 — team plays in a country of the same confederation (familiar
//         climate / time zone / partial diaspora support)
//   0.0 — team plays in another confederation (true away or true neutral)
//
// When we cannot resolve the venue country we return null. The caller
// should then assume neutral (0.5/0.5) rather than fall back to the
// historical "home gets 100%" bias.

const { query } = require("../config/db");

// Cache per process: clubId -> { confederation, countryName }.
// Cleared on process restart, which is fine — a single chat session
// usually re-queries the same pair multiple times.
const teamCache = new Map();
const venueCache = new Map();

async function homeAdvantageFactor(clubId, fixtureContext) {
  // fixtureContext is optional; when present it carries { venue_id }.
  // For ad-hoc predictMatch calls (no fixture) we look up the next
  // scheduled fixture between the two teams.
  const venue = await resolveVenueForClub(clubId, fixtureContext);
  if (!venue || !venue.country) return null;

  const team = await getTeamCountry(clubId);
  if (!team) return null;

  if (sameCountry(venue.country, team.countryName)) return 1.0;
  if (
    team.confederation &&
    venue.confederation &&
    team.confederation === venue.confederation
  ) {
    return 0.4;
  }
  return 0.0;
}

async function getTeamCountry(clubId) {
  if (teamCache.has(clubId)) return teamCache.get(clubId);
  const r = await query(
    `SELECT co.name AS country_name, co.confederation
     FROM clubs c
     LEFT JOIN countries co ON co.id = c.country_id
     WHERE c.id = $1
     LIMIT 1`,
    [clubId]
  );
  if (r.rows.length === 0) return null;
  const out = {
    countryName: r.rows[0].country_name,
    confederation: r.rows[0].confederation,
  };
  teamCache.set(clubId, out);
  return out;
}

// Try the fixture's own venue first, then fall back to the next scheduled
// venue when none is bound (e.g. the prediction is for a hypothetical
// match-up, not a real fixture).
async function resolveVenueForClub(clubId, fixtureContext) {
  let venueId = fixtureContext && fixtureContext.venue_id;
  if (!venueId) {
    const r = await query(
      `SELECT venue_id FROM fixtures
       WHERE (home_team_id = $1 OR away_team_id = $1)
         AND status = 'scheduled'
         AND venue_id IS NOT NULL
       ORDER BY match_date ASC
       LIMIT 1`,
      [clubId]
    );
    venueId = r.rows[0] && r.rows[0].venue_id;
  }
  if (!venueId) return null;
  if (venueCache.has(venueId)) return venueCache.get(venueId);

  const v = await query(
    `SELECT v.country,
            (SELECT confederation FROM countries WHERE name = v.country LIMIT 1) AS confederation
     FROM venues v
     WHERE v.id = $1
     LIMIT 1`,
    [venueId]
  );
  const venue = v.rows[0]
    ? { country: v.rows[0].country, confederation: v.rows[0].confederation }
    : null;
  venueCache.set(venueId, venue);
  return venue;
}

function sameCountry(a, b) {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

module.exports = { homeAdvantageFactor };
