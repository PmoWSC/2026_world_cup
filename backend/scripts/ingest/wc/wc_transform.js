// Pure transformation helpers for the World Cup 2026 schedule. No I/O,
// no DB, no deps — so they can be unit-verified against the raw
// openfootball JSON without a database (see verify_wc_phase1.js).

// Synthetic match numbers for the two knockout matches openfootball does
// not number (it only numbers 73–102). They sit above the real range so
// they never collide with a placeholder reference (W73…L102).
const THIRD_PLACE_NUMBER = 103;
const FINAL_NUMBER = 104;

// "13:00 UTC-6" + "2026-06-11" -> ISO timestamptz "2026-06-11T13:00:00-06:00".
function toTimestamptz(date, time) {
  if (!time) return `${date}T00:00:00+00:00`;
  const [hm, tz] = time.split(" ");
  const m = /^UTC([+-]\d{1,2})$/.exec(tz || "");
  if (!m) return `${date}T${hm}:00+00:00`;
  const off = parseInt(m[1], 10);
  const sign = off < 0 ? "-" : "+";
  const hh = String(Math.abs(off)).padStart(2, "0");
  return `${date}T${hm}:00${sign}${hh}:00`;
}

// "Matchday 7" -> group stage with matchday 7; knockout rounds map their
// label straight to `stage`.
function parseRound(round) {
  const md = /^Matchday (\d+)$/.exec(round);
  if (md) return { stage: "Group", matchday: parseInt(md[1], 10) };
  return { stage: round, matchday: null };
}

// Turn the raw openfootball matches[] into normalized fixture rows with
// stable match numbers. Group matches get 1–72 (ordered deterministically
// so reruns are idempotent), numbered knockouts keep openfootball's num
// (73–102), and final / third place get synthetic 103 / 104.
function buildFixtureRows(matches) {
  const groupMatches = matches
    .filter((m) => m.group)
    .sort((a, b) =>
      (a.date + a.time + a.group + a.team1).localeCompare(
        b.date + b.time + b.group + b.team1
      )
    );
  const groupNumber = new Map();
  groupMatches.forEach((m, i) => groupNumber.set(m, i + 1));

  return matches.map((m) => {
    const { stage, matchday } = parseRound(m.round);
    const isGroup = Boolean(m.group);

    let matchNumber;
    if (isGroup) matchNumber = groupNumber.get(m);
    else if (m.num != null) matchNumber = m.num;
    else if (stage === "Final") matchNumber = FINAL_NUMBER;
    else matchNumber = THIRD_PLACE_NUMBER;

    return {
      matchNumber,
      matchday,
      stage,
      isGroup,
      groupName: isGroup ? m.group.replace(/^Group\s+/, "") : null,
      matchDate: toTimestamptz(m.date, m.time),
      ground: m.ground,
      team1: m.team1,
      team2: m.team2,
    };
  });
}

module.exports = {
  toTimestamptz,
  parseRound,
  buildFixtureRows,
  THIRD_PLACE_NUMBER,
  FINAL_NUMBER,
};
