require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const { Pool } = require("pg");
const { parse } = require("csv-parse/sync");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const FOOTBALL_DATA_BASE = "https://api.football-data.org/v4";
const FOOTBALL_DATA_KEY = process.env.FOOTBALL_DATA_API_KEY;

const TRANSFERMARKT_BASE =
  "https://raw.githubusercontent.com/dcaribou/transfermarkt-datasets/master/data";

async function query(text, params) {
  return pool.query(text, params);
}

async function fetchFootballData(endpoint) {
  const url = `${FOOTBALL_DATA_BASE}${endpoint}`;
  console.log(`  [API] GET ${url}`);
  const res = await fetch(url, {
    headers: { "X-Auth-Token": FOOTBALL_DATA_KEY },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`football-data.org ${res.status}: ${body}`);
  }
  return res.json();
}

async function fetchCSV(url) {
  console.log(`  [CSV] GET ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CSV fetch ${res.status}: ${url}`);
  const text = await res.text();
  return parse(text, { columns: true, skip_empty_lines: true, relax_column_count: true });
}

async function upsert(table, conflictCol, data, columns) {
  if (data.length === 0) return 0;

  let inserted = 0;
  for (const row of data) {
    const values = columns.map((col) => row[col]);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
    const updateSet = columns
      .filter((c) => c !== conflictCol)
      .map((c, i) => {
        const idx = columns.indexOf(c);
        return `${c} = $${idx + 1}`;
      })
      .join(", ");

    await query(
      `INSERT INTO ${table} (${columns.join(", ")})
       VALUES (${placeholders})
       ON CONFLICT (${conflictCol}) DO UPDATE SET ${updateSet}`,
      values
    );
    inserted++;
  }
  return inserted;
}

async function closePool() {
  await pool.end();
}

module.exports = {
  query,
  fetchFootballData,
  fetchCSV,
  upsert,
  closePool,
  pool,
  TRANSFERMARKT_BASE,
};
