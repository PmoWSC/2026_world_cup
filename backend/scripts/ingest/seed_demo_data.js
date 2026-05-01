require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function q(text, params) {
  return pool.query(text, params);
}

async function seedDemoData() {
  const start = Date.now();
  console.log("=".repeat(60));
  console.log("[SEED] Inserting demo data (La Liga + Premier League)");
  console.log("=".repeat(60));

  // ---- COUNTRIES ----
  console.log("[SEED] Countries...");
  const countries = [
    ["Spain", "ESP", "🇪🇸"], ["England", "ENG", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"], ["France", "FRA", "🇫🇷"],
    ["Germany", "GER", "🇩🇪"], ["Brazil", "BRA", "🇧🇷"], ["Argentina", "ARG", "🇦🇷"],
    ["Portugal", "POR", "🇵🇹"], ["Netherlands", "NED", "🇳🇱"], ["Belgium", "BEL", "🇧🇪"],
    ["Croatia", "CRO", "🇭🇷"], ["Uruguay", "URU", "🇺🇾"], ["Colombia", "COL", "🇨🇴"],
    ["Norway", "NOR", "🇳🇴"], ["Poland", "POL", "🇵🇱"], ["Senegal", "SEN", "🇸🇳"],
    ["Morocco", "MAR", "🇲🇦"], ["Nigeria", "NGA", "🇳🇬"], ["Egypt", "EGY", "🇪🇬"],
    ["South Korea", "KOR", "🇰🇷"], ["Japan", "JPN", "🇯🇵"], ["Canada", "CAN", "🇨🇦"],
    ["Mexico", "MEX", "🇲🇽"], ["USA", "USA", "🇺🇸"], ["Wales", "WAL", "🏴󠁧󠁢󠁷󠁬󠁳󠁿"],
    ["Scotland", "SCO", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"], ["Italy", "ITA", "🇮🇹"], ["Ivory Coast", "CIV", "🇨🇮"],
    ["Cameroon", "CMR", "🇨🇲"], ["Ghana", "GHA", "🇬🇭"], ["Ecuador", "ECU", "🇪🇨"],
    ["Serbia", "SRB", "🇷🇸"], ["Denmark", "DEN", "🇩🇰"], ["Sweden", "SWE", "🇸🇪"],
    ["Austria", "AUT", "🇦🇹"], ["Switzerland", "SUI", "🇨🇭"], ["Algeria", "ALG", "🇩🇿"],
    ["Chile", "CHI", "🇨🇱"], ["Paraguay", "PAR", "🇵🇾"], ["Gabon", "GAB", "🇬🇦"],
    ["Guinea", "GUI", "🇬🇳"], ["Mali", "MLI", "🇲🇱"], ["Ukraine", "UKR", "🇺🇦"],
    ["Czech Republic", "CZE", "🇨🇿"], ["Turkey", "TUR", "🇹🇷"], ["Georgia", "GEO", "🇬🇪"],
  ];

  const countryIds = {};
  for (const [name, code, emoji] of countries) {
    const r = await q(
      `INSERT INTO countries (name, fifa_code, flag_emoji)
       VALUES ($1, $2, $3) ON CONFLICT (fifa_code) DO UPDATE SET name=EXCLUDED.name
       RETURNING id`,
      [name, code, emoji]
    );
    countryIds[code] = r.rows[0].id;
  }
  console.log(`  ${countries.length} countries`);

  // ---- COMPETITIONS ----
  console.log("[SEED] Competitions...");
  const laLigaId = (await q(
    `INSERT INTO competitions (name, slug, type, season, is_active)
     VALUES ('La Liga', 'la_liga_2025', 'league', '2025', true)
     ON CONFLICT (slug) DO UPDATE SET is_active=true RETURNING id`
  )).rows[0].id;

  const plId = (await q(
    `INSERT INTO competitions (name, slug, type, season, is_active)
     VALUES ('Premier League', 'premier_league_2025', 'league', '2025', true)
     ON CONFLICT (slug) DO UPDATE SET is_active=true RETURNING id`
  )).rows[0].id;

  // ---- LA LIGA CLUBS ----
  console.log("[SEED] La Liga clubs...");
  const laLigaClubs = [
    ["Real Madrid", "RMA", "ESP", 1050], ["FC Barcelona", "BAR", "ESP", 1040],
    ["Atlético Madrid", "ATM", "ESP", 1020], ["Real Sociedad", "RSO", "ESP", 1030],
    ["Athletic Club", "ATH", "ESP", 1025], ["Villarreal CF", "VIL", "ESP", 1015],
    ["Real Betis", "BET", "ESP", 1010], ["Sevilla FC", "SEV", "ESP", 1005],
    ["Girona FC", "GIR", "ESP", 1035], ["Valencia CF", "VAL", "ESP", 1000],
    ["Celta de Vigo", "CEL", "ESP", 1045], ["RCD Mallorca", "MLL", "ESP", 1055],
    ["Getafe CF", "GET", "ESP", 1060], ["Rayo Vallecano", "RAY", "ESP", 1065],
    ["CA Osasuna", "OSA", "ESP", 1070], ["UD Las Palmas", "LPA", "ESP", 1075],
    ["Deportivo Alavés", "ALA", "ESP", 1080], ["RCD Espanyol", "ESP2", "ESP", 1085],
    ["CD Leganés", "LEG", "ESP", 1090], ["Real Valladolid", "VLL", "ESP", 1095],
  ];

  const clubIds = {};
  for (const [name, shortName, countryCode, fdId] of laLigaClubs) {
    const r = await q(
      `INSERT INTO clubs (name, short_name, league, country_id, competition_id, football_data_id)
       VALUES ($1, $2, 'La Liga', $3, $4, $5)
       ON CONFLICT DO NOTHING RETURNING id`,
      [name, shortName, countryIds[countryCode], laLigaId, fdId]
    );
    if (r.rows.length > 0) clubIds[shortName] = r.rows[0].id;
    else {
      const existing = await q("SELECT id FROM clubs WHERE name = $1", [name]);
      if (existing.rows.length > 0) clubIds[shortName] = existing.rows[0].id;
    }
  }

  // ---- PREMIER LEAGUE CLUBS ----
  console.log("[SEED] Premier League clubs...");
  const plClubs = [
    ["Manchester City", "MCI", "ENG", 2000], ["Arsenal", "ARS", "ENG", 2001],
    ["Liverpool", "LIV", "ENG", 2002], ["Manchester United", "MUN", "ENG", 2003],
    ["Chelsea", "CHE", "ENG", 2004], ["Tottenham Hotspur", "TOT", "ENG", 2005],
    ["Newcastle United", "NEW", "ENG", 2006], ["Aston Villa", "AVL", "ENG", 2007],
    ["Brighton & Hove Albion", "BHA", "ENG", 2008], ["West Ham United", "WHU", "ENG", 2009],
    ["Wolverhampton Wanderers", "WOL", "ENG", 2010], ["Crystal Palace", "CRY", "ENG", 2011],
    ["Fulham", "FUL", "ENG", 2012], ["Brentford", "BRE", "ENG", 2013],
    ["Nottingham Forest", "NFO", "ENG", 2014], ["Everton", "EVE", "ENG", 2015],
    ["AFC Bournemouth", "BOU", "ENG", 2016], ["Ipswich Town", "IPS", "ENG", 2017],
    ["Leicester City", "LEI", "ENG", 2018], ["Southampton", "SOU", "ENG", 2019],
  ];

  for (const [name, shortName, countryCode, fdId] of plClubs) {
    const r = await q(
      `INSERT INTO clubs (name, short_name, league, country_id, competition_id, football_data_id)
       VALUES ($1, $2, 'Premier League', $3, $4, $5)
       ON CONFLICT DO NOTHING RETURNING id`,
      [name, shortName, countryIds[countryCode], plId, fdId]
    );
    if (r.rows.length > 0) clubIds[shortName] = r.rows[0].id;
    else {
      const existing = await q("SELECT id FROM clubs WHERE name = $1", [name]);
      if (existing.rows.length > 0) clubIds[shortName] = existing.rows[0].id;
    }
  }
  console.log(`  ${laLigaClubs.length + plClubs.length} clubs`);

  // ---- PLAYERS ----
  console.log("[SEED] Players...");
  const players = [
    // Real Madrid
    ["Thibaut Courtois", "BEL", "RMA", "Goalkeeper", 35000000],
    ["Dani Carvajal", "ESP", "RMA", "Defender", 20000000],
    ["Éder Militão", "BRA", "RMA", "Defender", 60000000],
    ["Antonio Rüdiger", "GER", "RMA", "Defender", 30000000],
    ["Ferland Mendy", "FRA", "RMA", "Defender", 25000000],
    ["Eduardo Camavinga", "FRA", "RMA", "Midfielder", 80000000],
    ["Aurélien Tchouaméni", "FRA", "RMA", "Midfielder", 80000000],
    ["Jude Bellingham", "ENG", "RMA", "Midfielder", 150000000],
    ["Federico Valverde", "URU", "RMA", "Midfielder", 120000000],
    ["Vinícius Jr.", "BRA", "RMA", "Forward", 200000000],
    ["Rodrygo", "BRA", "RMA", "Forward", 100000000],
    ["Kylian Mbappé", "FRA", "RMA", "Forward", 180000000],
    ["Luka Modrić", "CRO", "RMA", "Midfielder", 10000000],
    ["Endrick", "BRA", "RMA", "Forward", 60000000],
    // Barcelona
    ["Marc-André ter Stegen", "GER", "BAR", "Goalkeeper", 25000000],
    ["Jules Koundé", "FRA", "BAR", "Defender", 60000000],
    ["Ronald Araújo", "URU", "BAR", "Defender", 60000000],
    ["Alejandro Balde", "ESP", "BAR", "Defender", 50000000],
    ["Pedri", "ESP", "BAR", "Midfielder", 100000000],
    ["Gavi", "ESP", "BAR", "Midfielder", 90000000],
    ["Frenkie de Jong", "NED", "BAR", "Midfielder", 60000000],
    ["Lamine Yamal", "ESP", "BAR", "Forward", 150000000],
    ["Raphinha", "BRA", "BAR", "Forward", 70000000],
    ["Robert Lewandowski", "POL", "BAR", "Forward", 15000000],
    ["Fermín López", "ESP", "BAR", "Midfielder", 40000000],
    ["Pau Cubarsí", "ESP", "BAR", "Defender", 60000000],
    // Atlético Madrid
    ["Jan Oblak", "SRB", "ATM", "Goalkeeper", 30000000],
    ["José Giménez", "URU", "ATM", "Defender", 20000000],
    ["Rodrigo De Paul", "ARG", "ATM", "Midfielder", 25000000],
    ["Antoine Griezmann", "FRA", "ATM", "Forward", 20000000],
    ["Álvaro Morata", "ESP", "ATM", "Forward", 15000000],
    ["Julián Álvarez", "ARG", "ATM", "Forward", 80000000],
    // Manchester City
    ["Ederson", "BRA", "MCI", "Goalkeeper", 35000000],
    ["Kyle Walker", "ENG", "MCI", "Defender", 8000000],
    ["Rúben Dias", "POR", "MCI", "Defender", 75000000],
    ["John Stones", "ENG", "MCI", "Defender", 30000000],
    ["Joško Gvardiol", "CRO", "MCI", "Defender", 75000000],
    ["Rodri", "ESP", "MCI", "Midfielder", 130000000],
    ["Kevin De Bruyne", "BEL", "MCI", "Midfielder", 45000000],
    ["Bernardo Silva", "POR", "MCI", "Midfielder", 80000000],
    ["Phil Foden", "ENG", "MCI", "Midfielder", 120000000],
    ["Erling Haaland", "NOR", "MCI", "Forward", 200000000],
    ["Jeremy Doku", "BEL", "MCI", "Forward", 65000000],
    ["Jack Grealish", "ENG", "MCI", "Forward", 45000000],
    ["Savinho", "BRA", "MCI", "Forward", 60000000],
    // Arsenal
    ["David Raya", "ESP", "ARS", "Goalkeeper", 35000000],
    ["William Saliba", "FRA", "ARS", "Defender", 90000000],
    ["Gabriel Magalhães", "BRA", "ARS", "Defender", 75000000],
    ["Ben White", "ENG", "ARS", "Defender", 50000000],
    ["Declan Rice", "ENG", "ARS", "Midfielder", 110000000],
    ["Martin Ødegaard", "NOR", "ARS", "Midfielder", 100000000],
    ["Bukayo Saka", "ENG", "ARS", "Forward", 140000000],
    ["Gabriel Martinelli", "BRA", "ARS", "Forward", 65000000],
    ["Kai Havertz", "GER", "ARS", "Forward", 65000000],
    // Liverpool
    ["Alisson", "BRA", "LIV", "Goalkeeper", 35000000],
    ["Virgil van Dijk", "NED", "LIV", "Defender", 30000000],
    ["Trent Alexander-Arnold", "ENG", "LIV", "Defender", 70000000],
    ["Ryan Gravenberch", "NED", "LIV", "Midfielder", 50000000],
    ["Alexis Mac Allister", "ARG", "LIV", "Midfielder", 60000000],
    ["Mohamed Salah", "EGY", "LIV", "Forward", 55000000],
    ["Luis Díaz", "COL", "LIV", "Forward", 65000000],
    ["Darwin Núñez", "URU", "LIV", "Forward", 65000000],
    ["Cody Gakpo", "NED", "LIV", "Forward", 50000000],
    // Chelsea
    ["Robert Sánchez", "ESP", "CHE", "Goalkeeper", 20000000],
    ["Enzo Fernández", "ARG", "CHE", "Midfielder", 80000000],
    ["Moisés Caicedo", "ECU", "CHE", "Midfielder", 80000000],
    ["Cole Palmer", "ENG", "CHE", "Forward", 100000000],
    ["Nicolas Jackson", "SEN", "CHE", "Forward", 50000000],
    // Tottenham
    ["Son Heung-min", "KOR", "TOT", "Forward", 50000000],
    ["James Maddison", "ENG", "TOT", "Midfielder", 50000000],
    ["Cristian Romero", "ARG", "TOT", "Defender", 55000000],
    // Manchester United
    ["André Onana", "CMR", "MUN", "Goalkeeper", 30000000],
    ["Lisandro Martínez", "ARG", "MUN", "Defender", 45000000],
    ["Kobbie Mainoo", "ENG", "MUN", "Midfielder", 60000000],
    ["Bruno Fernandes", "POR", "MUN", "Midfielder", 65000000],
    ["Marcus Rashford", "ENG", "MUN", "Forward", 55000000],
    ["Rasmus Højlund", "DEN", "MUN", "Forward", 55000000],
    // Sociedad, Villarreal, etc — smaller squads
    ["Mikel Oyarzabal", "ESP", "RSO", "Forward", 35000000],
    ["Take Kubo", "JPN", "RSO", "Forward", 40000000],
    ["Alexander Isak", "SWE", "NEW", "Forward", 80000000],
    ["Bruno Guimarães", "BRA", "NEW", "Midfielder", 80000000],
    ["Ollie Watkins", "ENG", "AVL", "Forward", 60000000],
    ["Kaoru Mitoma", "JPN", "BHA", "Forward", 40000000],
    ["Mohammed Kudus", "GHA", "WHU", "Forward", 55000000],
    ["Eberechi Eze", "ENG", "CRY", "Midfielder", 45000000],
    ["Pedro Neto", "POR", "CHE", "Forward", 60000000],
    ["Iñaki Williams", "ESP", "ATH", "Forward", 25000000],
    ["Nico Williams", "ESP", "ATH", "Forward", 55000000],
    ["Alexander Sörloth", "NOR", "ATM", "Forward", 30000000],
    ["Dani Olmo", "ESP", "BAR", "Midfielder", 60000000],
  ];

  let playerCount = 0;
  for (const [name, natCode, clubCode, position, mv] of players) {
    const natId = countryIds[natCode] || null;
    const cId = clubIds[clubCode] || null;
    await q(
      `INSERT INTO players (name, full_name, nationality_id, current_club_id, position, market_value_eur)
       VALUES ($1, $1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [name, natId, cId, position, mv]
    );
    playerCount++;
  }
  console.log(`  ${playerCount} players`);

  // ---- FIXTURES ----
  console.log("[SEED] Fixtures (current season)...");
  const allClubCodes = [...laLigaClubs.map(c => c[1]), ...plClubs.map(c => c[1])];

  // Generate round-robin fixtures for each competition
  let fixtureCount = 0;

  // La Liga fixtures
  fixtureCount += await generateLeagueFixtures(
    laLigaClubs.map(c => [c[1], c[0]]), clubIds, laLigaId, "2025-08-15", 38
  );
  console.log(`  La Liga fixtures generated`);

  // Premier League fixtures
  fixtureCount += await generateLeagueFixtures(
    plClubs.map(c => [c[1], c[0]]), clubIds, plId, "2025-08-16", 38
  );
  console.log(`  Premier League fixtures generated`);
  console.log(`  ${fixtureCount} total fixtures`);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log("=".repeat(60));
  console.log(`[SEED] Complete in ${elapsed}s`);
  console.log("=".repeat(60));

  await pool.end();
}

async function generateLeagueFixtures(teams, clubIds, competitionId, startDate, totalMatchdays) {
  let count = 0;
  const start = new Date(startDate);
  const now = new Date();

  // Generate matchday pairs (simplified round-robin)
  for (let matchday = 1; matchday <= totalMatchdays; matchday++) {
    const matchDate = new Date(start);
    matchDate.setDate(matchDate.getDate() + (matchday - 1) * 7);

    // 10 matches per matchday (20 teams / 2)
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const homeCode = shuffled[i][0];
      const awayCode = shuffled[i + 1][0];
      const homeId = clubIds[homeCode];
      const awayId = clubIds[awayCode];
      if (!homeId || !awayId) continue;

      const isFinished = matchDate < now;
      const status = isFinished ? "finished" : "scheduled";
      const homeScore = isFinished ? Math.floor(Math.random() * 4) : null;
      const awayScore = isFinished ? Math.floor(Math.random() * 3) : null;

      // Add some time variance to match_date (15:00, 17:30, 20:00)
      const hours = [15, 17, 20][Math.floor(Math.random() * 3)];
      const mins = [0, 30][Math.floor(Math.random() * 2)];
      matchDate.setHours(hours, mins, 0, 0);

      await q(
        `INSERT INTO fixtures (competition_id, matchday, match_date, home_team_id, away_team_id,
           home_score, away_score, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [competitionId, matchday, matchDate.toISOString(), homeId, awayId, homeScore, awayScore, status]
      );
      count++;
    }
  }
  return count;
}

seedDemoData().catch((err) => {
  console.error("[SEED FATAL ERROR]:", err);
  process.exit(1);
});
