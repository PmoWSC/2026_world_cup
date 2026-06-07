const { query } = require("../utils");
const { fetchApiFootball, LEAGUE_FRIENDLIES } = require("./api_football");
const path = require("path");

const countryMeta = require(path.resolve(__dirname, "../../../data/wc2026/country_meta.json"));

const COMPETITION = {
  name: "Amistosos de Selecciones 2026",
  slug: "internationals_2026",
  type: "international",
  season: "2026",
};

const SEASON = 2026;

// API-Football spells a few World Cup teams differently than openfootball
// (our canonical names). Map them so friendlies link to the same country
// row as the World Cup squad.
const WC_ALIAS = {
  "Cape Verde Islands": "Cape Verde",
  "Congo DR": "DR Congo",
  "Türkiye": "Turkey",
};

const canonical = (name) => WC_ALIAS[name] || name;
const isWcTeam = (name) => Boolean(countryMeta[canonical(name)]);

// Drop youth (U17/U20/U23…) and women's sides — this is a men's senior
// World Cup app.
const isYouthOrWomen = (n) => /\bU-?\d{2}\b/i.test(n) || /women|fem\b/i.test(n);

// API-Football status.short -> our fixtures.status vocabulary.
function mapStatus(short) {
  if (["FT", "AET", "PEN"].includes(short)) return "finished";
  if (["1H", "2H", "HT", "ET", "BT", "P", "LIVE"].includes(short)) return "IN_PLAY";
  if (["PST"].includes(short)) return "postponed";
  if (["CANC", "ABD", "AWD", "WO"].includes(short)) return "cancelled";
  if (["SUSP", "INT"].includes(short)) return "suspended";
  return "scheduled"; // NS, TBD
}

// Upsert a venue row keyed by (name, city). Country is left NULL: the
// enrich_venue_countries.js script fills it in a second pass using
// Nominatim. Returns the venue UUID or null when the API did not give
// us venue info.
async function upsertVenue(apiVenue, cache) {
  if (!apiVenue || !apiVenue.name) return null;
  const key = `${apiVenue.name}|${apiVenue.city || ""}`;
  if (cache.has(key)) return cache.get(key);

  const existing = await query(
    `SELECT id FROM venues
     WHERE name = $1 AND COALESCE(city, '') = COALESCE($2, '')
     LIMIT 1`,
    [apiVenue.name, apiVenue.city || null]
  );
  if (existing.rows.length > 0) {
    cache.set(key, existing.rows[0].id);
    return existing.rows[0].id;
  }
  const inserted = await query(
    `INSERT INTO venues (name, city) VALUES ($1, $2) RETURNING id`,
    [apiVenue.name, apiVenue.city || null]
  );
  cache.set(key, inserted.rows[0].id);
  return inserted.rows[0].id;
}

// Resolve a national team to a club row under internationals_2026, sharing
// the country with the World Cup squad when it is one of the 48.
async function resolveTeamClub(apiName, competitionId, cache) {
  const canon = canonical(apiName);
  if (cache.has(canon)) return cache.get(canon);

  const meta = countryMeta[canon];
  let countryId;
  if (meta) {
    // World Cup nation: upsert by fifa_code (already created in phase 1).
    const c = await query(
      `INSERT INTO countries (name, fifa_code, confederation, flag_emoji)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (fifa_code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [canon, meta.code, meta.conf, meta.flag]
    );
    countryId = c.rows[0].id;
  } else {
    // Non-qualified opponent: resolve by name, create without a fifa_code.
    const existing = await query("SELECT id FROM countries WHERE name = $1 LIMIT 1", [canon]);
    countryId = existing.rows.length
      ? existing.rows[0].id
      : (await query("INSERT INTO countries (name) VALUES ($1) RETURNING id", [canon])).rows[0].id;
  }

  // Prefer a row that ya existe en world_cup_2026: ese id es el "primary"
  // de la seleccion y tiene los fixtures del Mundial. Crear un duplicado en
  // internationals_2026 rompe el modelo cohesion y obliga a re-consolidar
  // cada vez que corre el cron. Si la seleccion no clasifico al Mundial,
  // caemos al insert clasico en internationals_2026.
  const existing = await query(
    `SELECT c.id FROM clubs c
     JOIN competitions comp ON comp.id = c.competition_id
     WHERE c.name = $1 AND comp.slug = 'world_cup_2026'
     LIMIT 1`,
    [canon]
  );
  if (existing.rows.length > 0) {
    cache.set(canon, existing.rows[0].id);
    return existing.rows[0].id;
  }

  const club = await query(
    `INSERT INTO clubs (name, short_name, league, country_id, competition_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (name, competition_id) DO UPDATE SET country_id = EXCLUDED.country_id
     RETURNING id`,
    [canon, meta ? meta.code : null, COMPETITION.name, countryId, competitionId]
  );
  cache.set(canon, club.rows[0].id);
  return club.rows[0].id;
}

async function ingestFriendlies() {
  console.log("[FRIENDLIES] Amistosos de selecciones 2026 (que tocan el Mundial)...");

  // Upsert the competition.
  const comp = await query(
    `INSERT INTO competitions (name, slug, type, season, is_active)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_active = true
     RETURNING id`,
    [COMPETITION.name, COMPETITION.slug, COMPETITION.type, COMPETITION.season]
  );
  const competitionId = comp.rows[0].id;

  // Pull the full year of international friendlies (one request).
  const data = await fetchApiFootball("/fixtures", {
    league: LEAGUE_FRIENDLIES,
    season: SEASON,
    from: "2026-01-01",
    to: "2026-12-31",
  });

  // Keep men's senior matches that involve at least one World Cup nation.
  const relevant = data.response.filter((m) => {
    const h = m.teams.home.name, a = m.teams.away.name;
    if (isYouthOrWomen(h) || isYouthOrWomen(a)) return false;
    return isWcTeam(h) || isWcTeam(a);
  });

  console.log(`  ${data.results} amistosos totales → ${relevant.length} relevantes (tocan el Mundial)`);

  const clubCache = new Map();
  let inserted = 0;
  let updated = 0;

  const venueCache = new Map(); // key: name|city -> venue_id

  for (const m of relevant) {
    const homeId = await resolveTeamClub(m.teams.home.name, competitionId, clubCache);
    const awayId = await resolveTeamClub(m.teams.away.name, competitionId, clubCache);
    const status = mapStatus(m.fixture.status?.short);
    const apiId = m.fixture.id;

    // Captura del venue. API-Football devuelve name + city sin country;
    // el country lo enriquecemos despues con scripts/enrich/venue_countries.js
    // (Nominatim geocoder), o queda NULL y el modelo asume partido neutral.
    const venueId = await upsertVenue(m.fixture.venue, venueCache);

    // Idempotent upsert keyed by provider id (no schema change needed).
    const existing = await query(
      "SELECT id FROM fixtures WHERE competition_id = $1 AND football_data_id = $2 LIMIT 1",
      [competitionId, apiId]
    );

    const params = [
      competitionId, "Friendly", m.fixture.date, homeId, awayId,
      m.goals.home, m.goals.away,
      m.score?.halftime?.home ?? null, m.score?.halftime?.away ?? null,
      status, apiId, venueId,
    ];

    if (existing.rows.length) {
      await query(
        `UPDATE fixtures SET
           stage = $2, match_date = $3, home_team_id = $4, away_team_id = $5,
           home_score = $6, away_score = $7,
           halftime_home_score = $8, halftime_away_score = $9,
           status = $10, venue_id = $12, updated_at = NOW()
         WHERE competition_id = $1 AND football_data_id = $11`,
        params
      );
      updated++;
    } else {
      await query(
        `INSERT INTO fixtures
           (competition_id, stage, match_date, home_team_id, away_team_id,
            home_score, away_score, halftime_home_score, halftime_away_score,
            status, football_data_id, venue_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        params
      );
      inserted++;
    }
  }

  console.log(
    `[FRIENDLIES] ${inserted} insertados, ${updated} actualizados ` +
    `(${clubCache.size} selecciones, ${relevant.filter((m) => m.fixture.date.startsWith("2026-06")).length} en junio)`
  );
  return { inserted, updated };
}

module.exports = ingestFriendlies;

if (require.main === module) {
  const { closePool } = require("../utils");
  ingestFriendlies()
    .then(() => closePool())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[ERROR]", err.message);
      process.exit(1);
    });
}
