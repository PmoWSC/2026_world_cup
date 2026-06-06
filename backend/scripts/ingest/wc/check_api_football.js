// Diagnostic for API-Football (api-sports.io) — read-only, NO database.
// Answers the critical question before we build anything on top of the
// Free plan: does this key cover season 2026, and how many 2026
// national-team friendlies are available? Spends ~4 requests of the
// daily quota. Run: node scripts/ingest/wc/check_api_football.js
const {
  fetchApiFootball,
  LEAGUE_WORLD_CUP,
  LEAGUE_FRIENDLIES,
} = require("./api_football");

const SEASON = 2026;

async function check() {
  console.log("=".repeat(60));
  console.log("[API-FOOTBALL] Diagnóstico de cobertura (plan + season 2026)");
  console.log("=".repeat(60));

  // 1. Account / plan / quota.
  const status = await fetchApiFootball("/status");
  const acc = status.response || {};
  const plan = acc.subscription?.plan || acc.account?.plan || "desconocido";
  const reqs = acc.requests || {};
  console.log(`\nPlan: ${plan}`);
  console.log(`Requests hoy: ${reqs.current ?? "?"} / ${reqs.limit_day ?? "?"}`);

  // 2. Confirm the friendlies league id.
  const leagues = await fetchApiFootball("/leagues", { search: "Friendlies" });
  const friendly = (leagues.response || []).map((l) => ({
    id: l.league?.id,
    name: l.league?.name,
    type: l.league?.type,
    country: l.country?.name,
  }));
  console.log("\nLigas 'Friendlies' encontradas:");
  friendly.forEach((l) => console.log(`  id=${l.id}  ${l.name}  (${l.type}, ${l.country})`));

  // 3. CRITICAL: are 2026 national-team friendlies available on this plan?
  const fr = await fetchApiFootball("/fixtures", {
    league: LEAGUE_FRIENDLIES,
    season: SEASON,
    from: "2026-01-01",
    to: "2026-07-01",
    timezone: "America/Bogota",
  });
  console.log(`\nAmistosos selecciones 2026 (league=${LEAGUE_FRIENDLIES}): results=${fr.results}`);
  if (fr.results > 0) {
    const sample = fr.response.slice(0, 6).map((m) => {
      const d = (m.fixture?.date || "").slice(0, 10);
      const st = m.fixture?.status?.short;
      const h = m.teams?.home?.name, a = m.teams?.away?.name;
      const gh = m.goals?.home, ga = m.goals?.away;
      const score = gh == null ? "" : `  ${gh}-${ga}`;
      return `  ${d}  ${h} vs ${a}  [${st}]${score}`;
    });
    console.log(sample.join("\n"));
    // How many fall in the June prep window?
    const june = fr.response.filter((m) => (m.fixture?.date || "").startsWith("2026-06")).length;
    console.log(`  ... total ${fr.results}, de los cuales ${june} en junio 2026`);
  }

  // 4. World Cup coverage (for the live-scores part of phase 3).
  const wc = await fetchApiFootball("/fixtures", { league: LEAGUE_WORLD_CUP, season: SEASON });
  console.log(`\nMundial 2026 (league=${LEAGUE_WORLD_CUP}): results=${wc.results}`);

  // Verdict.
  console.log("\n" + "=".repeat(60));
  const covers2026 = fr.results > 0 || wc.results > 0;
  if (covers2026) {
    console.log("VEREDICTO: ✅ el plan cubre datos de 2026. Podemos cargar amistosos.");
  } else {
    console.log(
      "VEREDICTO: ⚠️ results=0 en 2026. Si los datos existen, tu plan Free\n" +
      "probablemente NO cubre la temporada actual — haría falta un plan de pago."
    );
  }
  console.log("=".repeat(60));
}

check()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n[ERROR]", err.message);
    process.exit(1);
  });
