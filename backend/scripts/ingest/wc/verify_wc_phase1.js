// Offline verification of the World Cup 2026 phase-1 data + transforms.
// No DB, no deps: validates that the curated metadata, the openfootball
// schedule and the transform logic line up before anything is inserted.
// Run: node scripts/ingest/wc/verify_wc_phase1.js
const path = require("path");
const { buildFixtureRows } = require("./wc_transform");

const DATA = path.resolve(__dirname, "../../../data/wc2026");
const schedule = require(path.join(DATA, "worldcup.json"));
const venues = require(path.join(DATA, "venues.json"));
const countryMeta = require(path.join(DATA, "country_meta.json"));

let failures = 0;
function check(name, cond, detail = "") {
  const ok = Boolean(cond);
  if (!ok) failures++;
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

console.log("[VERIFY] World Cup 2026 — phase 1 (offline)\n");

const matches = schedule.matches;
const groupMatches = matches.filter((m) => m.group);
const knockout = matches.filter((m) => !m.group);

console.log("Schedule shape:");
check("104 matches total", matches.length === 104, `got ${matches.length}`);
check("72 group matches", groupMatches.length === 72, `got ${groupMatches.length}`);
check("32 knockout matches", knockout.length === 32, `got ${knockout.length}`);

console.log("\nTeams & groups:");
const teams = [...new Set(groupMatches.flatMap((m) => [m.team1, m.team2]))];
const groups = [...new Set(groupMatches.map((m) => m.group))];
check("48 unique teams", teams.length === 48, `got ${teams.length}`);
check("12 groups", groups.length === 12, `got ${groups.length}`);

const metaKeys = Object.keys(countryMeta);
const missingMeta = teams.filter((t) => !countryMeta[t]);
const extraMeta = metaKeys.filter((k) => !teams.includes(k));
check("every team has metadata", missingMeta.length === 0, missingMeta.join(", "));
check("no orphan metadata entries", extraMeta.length === 0, extraMeta.join(", "));

const codes = metaKeys.map((k) => countryMeta[k].code);
check("fifa codes unique", new Set(codes).size === codes.length);
check(
  "every team has 3-letter code + confederation + flag",
  metaKeys.every((k) => /^[A-Z]{3}$/.test(countryMeta[k].code) && countryMeta[k].conf && countryMeta[k].flag)
);

console.log("\nVenues:");
const groundsInSchedule = [...new Set(matches.map((m) => m.ground))];
const venueGrounds = new Set(venues.map((v) => v.openfootball_ground));
const unmappedGrounds = groundsInSchedule.filter((g) => !venueGrounds.has(g));
check("16 curated venues", venues.length === 16, `got ${venues.length}`);
check("every schedule ground maps to a venue", unmappedGrounds.length === 0, unmappedGrounds.join(", "));
check(
  "all venues have altitude + timezone + capacity",
  venues.every((v) => Number.isFinite(v.altitude_meters) && v.timezone && Number.isFinite(v.capacity))
);

console.log("\nTransform (match numbers, dates, stages):");
const rows = buildFixtureRows(matches);
const numbers = rows.map((r) => r.matchNumber);
check("104 fixture rows", rows.length === 104);
check("match numbers unique", new Set(numbers).size === 104, `unique ${new Set(numbers).size}`);
check(
  "match numbers cover 1..104",
  numbers.slice().sort((a, b) => a - b).every((n, i) => n === i + 1)
);
check(
  "all dates parse to a valid instant",
  rows.every((r) => !Number.isNaN(Date.parse(r.matchDate))),
);
check(
  "group rows have stage=Group + matchday + group name",
  rows.filter((r) => r.isGroup).every((r) => r.stage === "Group" && r.matchday >= 1 && r.groupName),
);
check(
  "knockout rows have a stage and no group",
  rows.filter((r) => !r.isGroup).every((r) => r.stage && !r.groupName),
);
const groupRowsResolvable = rows.filter((r) => r.isGroup).every((r) => countryMeta[r.team1] && countryMeta[r.team2]);
check("every group row's teams resolve to metadata", groupRowsResolvable);

// Spot-check a known fixture from the source (opening match).
const opener = rows.find((r) => r.matchDate.startsWith("2026-06-11"));
check(
  "opening match is Mexico vs South Africa in Group A",
  opener && opener.team1 === "Mexico" && opener.team2 === "South Africa" && opener.groupName === "A",
  opener ? `${opener.team1} vs ${opener.team2} (Group ${opener.groupName})` : "not found"
);

console.log(`\n[VERIFY] ${failures === 0 ? "ALL CHECKS PASSED ✅" : failures + " CHECK(S) FAILED ❌"}`);
process.exit(failures === 0 ? 0 : 1);
