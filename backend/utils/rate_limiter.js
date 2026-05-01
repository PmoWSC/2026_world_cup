const { query } = require("../config/db");

const ANON_LIMIT = parseInt(process.env.ANON_MSG_LIMIT, 10) || 5;
const USER_LIMIT = parseInt(process.env.DAILY_MSG_LIMIT, 10) || 30;

// Returns ISO date string of next Monday 00:00:00 UTC (start of next week)
function getWeekResetAt() {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon
  const daysUntilNextMonday = day === 0 ? 1 : 8 - day;
  const reset = new Date(now);
  reset.setUTCDate(now.getUTCDate() + daysUntilNextMonday);
  reset.setUTCHours(0, 0, 0, 0);
  return reset.toISOString();
}

// Week key: ISO date of the Monday that starts the current week (YYYY-MM-DD)
function getWeekKey() {
  const now = new Date();
  const day = now.getUTCDay();
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - (day === 0 ? 6 : day - 1));
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart.toISOString().slice(0, 10);
}

// isAnonymous=true  → 5 per day (identified by sessionId)
// isAnonymous=false → 30 per week (identified by userId)
async function checkRateLimit(identifier, isAnonymous = false) {
  const limit = isAnonymous ? ANON_LIMIT : USER_LIMIT;
  const periodKey = isAnonymous
    ? new Date().toISOString().slice(0, 10)
    : getWeekKey();

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
  const reset_at = isAnonymous ? null : getWeekResetAt();

  return { allowed, remaining, limit, reset_at };
}

module.exports = { checkRateLimit, ANON_LIMIT, USER_LIMIT };
