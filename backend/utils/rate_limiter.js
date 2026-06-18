const { query } = require("../config/db");

const ANON_LIMIT = parseInt(process.env.ANON_MSG_LIMIT, 10) || 5;
const USER_LIMIT = parseInt(process.env.DAILY_MSG_LIMIT, 10) || 20;

// Returns ISO date string of the next UTC midnight (start of tomorrow)
function getDailyResetAt() {
  const reset = new Date();
  reset.setUTCDate(reset.getUTCDate() + 1);
  reset.setUTCHours(0, 0, 0, 0);
  return reset.toISOString();
}

// Day key: YYYY-MM-DD in UTC
function getDayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Both anonymous and authenticated reset DAILY:
//   - isAnonymous=true  → 5 per day  (identified by sessionId)
//   - isAnonymous=false → 20 per day (identified by userId)
async function checkRateLimit(identifier, isAnonymous = false) {
  const limit = isAnonymous ? ANON_LIMIT : USER_LIMIT;
  const periodKey = getDayKey();

  const result = await query(
    `INSERT INTO rate_limits (identifier, date, count)
     VALUES ($1, $2, 1)
     ON CONFLICT (identifier, date)
     DO UPDATE SET count = rate_limits.count + 1
     RETURNING count`,
    [identifier, periodKey]
  );

  const count = result.rows[0].count;
  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);
  const reset_at = getDailyResetAt();

  return { allowed, remaining, limit, reset_at };
}

module.exports = { checkRateLimit, ANON_LIMIT, USER_LIMIT };
