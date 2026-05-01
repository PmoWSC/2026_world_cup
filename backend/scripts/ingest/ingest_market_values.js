const { query, fetchCSV, TRANSFERMARKT_BASE } = require("./utils");

async function ingestMarketValues() {
  console.log("[INGEST] Market values from Transfermarkt-datasets...");

  const playersCSV = await fetchCSV(
    `${TRANSFERMARKT_BASE}/players.csv`
  );

  console.log(`  [CSV] ${playersCSV.length} player records loaded from Transfermarkt`);

  // Get all our players with their clubs for matching
  const ourPlayers = await query(
    `SELECT p.id, p.name, c.name as club_name
     FROM players p
     LEFT JOIN clubs c ON c.id = p.current_club_id`
  );

  // Build a lookup by normalized name
  const playerLookup = new Map();
  for (const p of ourPlayers.rows) {
    const key = normalizeName(p.name);
    if (!playerLookup.has(key)) {
      playerLookup.set(key, []);
    }
    playerLookup.get(key).push(p);
  }

  let updated = 0;
  for (const tmPlayer of playersCSV) {
    const name = tmPlayer.name || tmPlayer.pretty_name;
    if (!name) continue;

    const key = normalizeName(name);
    const matches = playerLookup.get(key);
    if (!matches || matches.length === 0) continue;

    const marketValue = parseMarketValue(
      tmPlayer.market_value_in_eur || tmPlayer.current_club_domestic_competition_id
    );

    if (marketValue > 0) {
      const playerId = matches[0].id;
      await query(
        `UPDATE players SET
           market_value_eur = $1,
           transfermarkt_id = $2,
           image_url = COALESCE(image_url, $3)
         WHERE id = $4`,
        [
          marketValue,
          tmPlayer.player_id || null,
          tmPlayer.image_url || null,
          playerId,
        ]
      );
      updated++;
    }
  }

  console.log(`[INGEST] ${updated} players updated with market values`);
  return updated;
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
}

function parseMarketValue(val) {
  if (!val) return 0;
  const str = String(val).replace(/[€$,]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num);
}

module.exports = ingestMarketValues;

if (require.main === module) {
  ingestMarketValues()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[ERROR]", err);
      process.exit(1);
    });
}
