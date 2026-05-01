require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { Pool } = require("pg");
const { refreshLeaderboard } = require("./refresh_leaderboard");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Evaluate a single bet against the fixture result.
 * Returns { points, status } where status is 'won' | 'partial' | 'lost'.
 */
function evaluateBet(bet, result) {
  const { bet_type_slug } = bet;
  // Normalize prediction keys (accept both {home, away} and {home_score, away_score})
  const raw = bet.prediction;
  const prediction = {
    home_score: raw.home_score ?? raw.home,
    away_score: raw.away_score ?? raw.away,
    winner: raw.winner,
    first_goal: raw.first_goal,
    total_goals: raw.total_goals,
    both_score: raw.both_score,
  };
  const { home_score, away_score, first_goalscorer_player_id } = result;

  const totalGoals = home_score + away_score;
  const actualWinner =
    home_score > away_score ? "home" : away_score > home_score ? "away" : "draw";

  switch (bet_type_slug) {
    // ── Exact score ──────────────────────────────────────────────────
    case "match:exact_score": {
      const exactMatch =
        Number(prediction.home_score) === home_score &&
        Number(prediction.away_score) === away_score;
      if (exactMatch) return { points: 10, status: "won" };

      // Partial: correct winner
      const predWinner =
        Number(prediction.home_score) > Number(prediction.away_score)
          ? "home"
          : Number(prediction.away_score) > Number(prediction.home_score)
            ? "away"
            : "draw";
      if (predWinner === actualWinner) return { points: 3, status: "partial" };
      return { points: 0, status: "lost" };
    }

    // ── Match winner ─────────────────────────────────────────────────
    case "match:winner": {
      if (prediction.winner === actualWinner) return { points: 3, status: "won" };
      return { points: 0, status: "lost" };
    }

    // ── First goalscorer ─────────────────────────────────────────────
    case "match:first_goal": {
      if (
        first_goalscorer_player_id &&
        String(prediction.player_id) === String(first_goalscorer_player_id)
      ) {
        return { points: 8, status: "won" };
      }
      return { points: 0, status: "lost" };
    }

    // ── Total goals over/under 2.5 ──────────────────────────────────
    case "match:total_goals": {
      const predictedOver = prediction.over_under === "over";
      const actualOver = totalGoals > 2.5;
      if (predictedOver === actualOver) return { points: 4, status: "won" };
      return { points: 0, status: "lost" };
    }

    // ── Both teams to score ──────────────────────────────────────────
    case "match:both_score": {
      const bothScored = home_score > 0 && away_score > 0;
      const predictedBoth = prediction.both_score === true || prediction.both_score === "yes";
      if (predictedBoth === bothScored) return { points: 4, status: "won" };
      return { points: 0, status: "lost" };
    }

    // ── Halftime score ───────────────────────────────────────────────
    case "match:halftime_score": {
      const htHome = result.halftime_home_score;
      const htAway = result.halftime_away_score;
      if (htHome == null || htAway == null) return { points: 0, status: "lost" };

      const exactHT =
        Number(prediction.home_score) === htHome &&
        Number(prediction.away_score) === htAway;
      if (exactHT) return { points: 12, status: "won" };

      // Partial: correct halftime winner
      const htWinner =
        htHome > htAway ? "home" : htAway > htHome ? "away" : "draw";
      const predHTWinner =
        Number(prediction.home_score) > Number(prediction.away_score)
          ? "home"
          : Number(prediction.away_score) > Number(prediction.home_score)
            ? "away"
            : "draw";
      if (predHTWinner === htWinner) return { points: 4, status: "partial" };
      return { points: 0, status: "lost" };
    }

    default:
      console.warn(`[RESOLVE] Unknown bet type: ${bet_type_slug}`);
      return { points: 0, status: "lost" };
  }
}

/**
 * Resolve all pending bets for a given fixture.
 */
async function resolveBets(fixtureId) {
  console.log(`[RESOLVE] Resolving bets for fixture ${fixtureId}`);

  // 1. Get the fixture result
  const fixtureRes = await pool.query(
    `SELECT id, home_score, away_score, halftime_home_score, halftime_away_score,
            first_goalscorer_player_id
     FROM fixtures
     WHERE id = $1`,
    [fixtureId]
  );

  if (fixtureRes.rows.length === 0) {
    throw new Error(`Fixture ${fixtureId} not found`);
  }

  const result = fixtureRes.rows[0];
  if (result.home_score == null || result.away_score == null) {
    throw new Error(`Fixture ${fixtureId} does not have a confirmed result yet`);
  }

  // 2. Query all pending bets for this fixture across all groups
  const betsRes = await pool.query(
    `SELECT pb.id, pb.prediction, bt.slug AS bet_type_slug
     FROM polla_bets pb
     JOIN bet_types bt ON bt.id = pb.bet_type_id
     WHERE pb.fixture_id = $1 AND pb.status = 'pending'`,
    [fixtureId]
  );

  console.log(`[RESOLVE] Found ${betsRes.rows.length} pending bets`);

  let won = 0;
  let partial = 0;
  let lost = 0;

  // 3. Evaluate each bet
  for (const bet of betsRes.rows) {
    const { points, status } = evaluateBet(bet, result);

    // 4. Update the bet record
    await pool.query(
      `UPDATE polla_bets
       SET points_earned = $1, status = $2, updated_at = NOW()
       WHERE id = $3`,
      [points, status, bet.id]
    );

    if (status === "won") won++;
    else if (status === "partial") partial++;
    else lost++;
  }

  console.log(
    `[RESOLVE] Results: ${won} won, ${partial} partial, ${lost} lost`
  );

  // 5. Refresh the leaderboard materialized view
  await refreshLeaderboard(pool);
  console.log(`[RESOLVE] Leaderboard refreshed`);
}

// ── Standalone execution ─────────────────────────────────────────────
if (require.main === module) {
  const fixtureId = process.argv[2];
  if (!fixtureId) {
    console.error("Usage: node resolve_bets.js <fixtureId>");
    process.exit(1);
  }
  resolveBets(fixtureId)
    .then(() => {
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error("[RESOLVE FATAL]:", err);
      pool.end();
      process.exit(1);
    });
}

module.exports = { resolveBets, evaluateBet };
