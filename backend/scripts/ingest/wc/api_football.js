require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });

// API-Football (api-sports.io) v3 — DIRECT access client (not RapidAPI).
// Used in phase 3 for national-team friendlies and live World Cup scores.
// Auth: header `x-apisports-key`. Key lives in backend/.env as
// API_FOOTBALL_KEY (gitignored) — never commit it.
const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";

// Stable league ids (confirmed against the official WC2026 API-Sports guide).
const LEAGUE_WORLD_CUP = 1; // World Cup, season 2026
const LEAGUE_FRIENDLIES = 10; // International friendlies (national teams)

function buildUrl(path, params) {
  const url = new URL(`${API_FOOTBALL_BASE}${path}`);
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  return url.toString();
}

// GET an API-Football endpoint. Returns the full envelope
// { get, parameters, errors, results, paging, response }. Throws on
// missing key, transport error, or a non-empty `errors` payload so callers
// fail loudly instead of silently iterating an empty `response`.
async function fetchApiFootball(path, params = {}) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    throw new Error(
      "API_FOOTBALL_KEY no está definido. Agrégalo a backend/.env (no lo subas a git)."
    );
  }

  const url = buildUrl(path, params);
  console.log(`  [api-football] GET ${path} ${JSON.stringify(params)}`);
  const res = await fetch(url, { headers: { "x-apisports-key": key } });

  // Surface the quota so we can self-limit on the Free plan (100/day).
  const remaining = res.headers.get("x-ratelimit-requests-remaining");
  const dailyLimit = res.headers.get("x-ratelimit-requests-limit");
  if (remaining != null) {
    console.log(`  [api-football] quota: ${remaining}/${dailyLimit} requests restantes hoy`);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`api-football HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();

  // `errors` is `[]` when fine, but an object/array with messages on failure
  // (bad key, plan limits, invalid params). Treat any content as fatal.
  const errs = data.errors;
  const hasErrors = Array.isArray(errs) ? errs.length > 0 : errs && Object.keys(errs).length > 0;
  if (hasErrors) {
    throw new Error(`api-football errors: ${JSON.stringify(errs)}`);
  }

  return data;
}

module.exports = {
  fetchApiFootball,
  API_FOOTBALL_BASE,
  LEAGUE_WORLD_CUP,
  LEAGUE_FRIENDLIES,
};
