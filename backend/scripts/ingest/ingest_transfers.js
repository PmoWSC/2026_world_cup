const { query, fetchCSV, TRANSFERMARKT_BASE } = require("./utils");

async function ingestTransfers() {
  console.log("[INGEST] Transfers from Transfermarkt-datasets...");

  const transfersCSV = await fetchCSV(`${TRANSFERMARKT_BASE}/transfers.csv`);

  console.log(`  [CSV] ${transfersCSV.length} transfer records loaded`);

  // Only process recent transfers (last 3 seasons)
  const currentYear = new Date().getFullYear();
  const recentTransfers = transfersCSV.filter((t) => {
    const year = parseInt(t.transfer_season || t.season);
    return year >= currentYear - 3;
  });

  console.log(`  [FILTER] ${recentTransfers.length} recent transfers (last 3 seasons)`);

  let inserted = 0;
  for (const t of recentTransfers) {
    // Match player by transfermarkt_id or name
    let playerId = null;
    if (t.player_id) {
      const result = await query(
        "SELECT id FROM players WHERE transfermarkt_id = $1 LIMIT 1",
        [String(t.player_id)]
      );
      if (result.rows.length > 0) playerId = result.rows[0].id;
    }

    if (!playerId && t.player_name) {
      const result = await query(
        "SELECT id FROM players WHERE name ILIKE $1 LIMIT 1",
        [t.player_name]
      );
      if (result.rows.length > 0) playerId = result.rows[0].id;
    }

    if (!playerId) continue;

    // Resolve clubs
    const fromClubId = await resolveClub(t.from_club_name);
    const toClubId = await resolveClub(t.to_club_name);

    const fee = parseFee(t.transfer_fee || t.fee);

    await query(
      `INSERT INTO transfers (player_id, from_club_id, to_club_id, transfer_date, fee_eur, season)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [
        playerId,
        fromClubId,
        toClubId,
        t.transfer_date || null,
        fee,
        t.transfer_season || t.season || null,
      ]
    );
    inserted++;
  }

  console.log(`[INGEST] ${inserted} transfers inserted`);
  return inserted;
}

async function resolveClub(clubName) {
  if (!clubName) return null;
  const result = await query(
    "SELECT id FROM clubs WHERE name ILIKE $1 OR short_name ILIKE $1 LIMIT 1",
    [clubName]
  );
  return result.rows.length > 0 ? result.rows[0].id : null;
}

function parseFee(val) {
  if (!val || val === "free transfer" || val === "Ablösefrei" || val === "-") return 0;
  const str = String(val).replace(/[€$,]/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.round(num);
}

module.exports = ingestTransfers;

if (require.main === module) {
  ingestTransfers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[ERROR]", err);
      process.exit(1);
    });
}
