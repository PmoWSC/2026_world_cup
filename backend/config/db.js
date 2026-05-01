const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("[DB POOL ERROR] Unexpected error on idle client:", err);
});

async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}

async function getClient() {
  const client = await pool.connect();
  return client;
}

module.exports = { pool, query, getClient };
