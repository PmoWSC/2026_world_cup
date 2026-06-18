const { query } = require("../../config/db");

function requireAuth(context) {
  if (!context.user) {
    throw new Error("Authentication required");
  }
  return context.user;
}

const pollaResolvers = {
  Query: {
    async myPollaGroups(_parent, _args, context) {
      const user = requireAuth(context);
      const result = await query(
        `SELECT pg.*, COUNT(pm2.id) as member_count
         FROM polla_groups pg
         JOIN polla_members pm ON pm.group_id = pg.id AND pm.user_id = $1
         LEFT JOIN polla_members pm2 ON pm2.group_id = pg.id
         GROUP BY pg.id
         ORDER BY pg.created_at DESC`,
        [user.id]
      );
      return result.rows.map(mapGroupRow);
    },

    async pollaGroup(_parent, { id }, context) {
      requireAuth(context);
      const result = await query(
        `SELECT pg.*, COUNT(pm.id) as member_count
         FROM polla_groups pg
         LEFT JOIN polla_members pm ON pm.group_id = pg.id
         WHERE pg.id = $1
         GROUP BY pg.id`,
        [id]
      );
      if (result.rows.length === 0) throw new Error("Group not found");
      return mapGroupRow(result.rows[0]);
    },

    async pollaLeaderboard(_parent, { groupId }, context) {
      requireAuth(context);
      const result = await query(
        `SELECT * FROM polla_leaderboard WHERE group_id = $1 ORDER BY rank ASC`,
        [groupId]
      );
      return result.rows.map((row) => ({
        userId: row.user_id,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        totalPoints: row.total_points,
        exactPredictions: row.exact_predictions,
        partialPredictions: row.partial_predictions,
        totalResolved: row.total_resolved,
        rank: row.rank,
      }));
    },

    async betTypes() {
      const result = await query(
        "SELECT * FROM bet_types WHERE is_active = true ORDER BY category, slug"
      );
      return result.rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        nameKey: row.name_key,
        descriptionKey: row.description_key,
        category: row.category,
        pointsCorrect: row.points_correct,
        pointsPartial: row.points_partial,
        isActive: row.is_active,
      }));
    },

    async myBets(_parent, { groupId }, context) {
      const user = requireAuth(context);
      const result = await query(
        `SELECT pb.*, bt.slug AS bt_slug, bt.name_key AS bt_name_key,
                bt.description_key AS bt_desc_key, bt.category AS bt_category,
                bt.points_correct AS bt_points_correct,
                bt.points_partial AS bt_points_partial,
                bt.is_active AS bt_is_active
         FROM polla_bets pb
         JOIN bet_types bt ON bt.id = pb.bet_type_id
         WHERE pb.group_id = $1 AND pb.user_id = $2
         ORDER BY pb.created_at DESC`,
        [groupId, user.id]
      );
      return result.rows.map((row) => ({
        id: row.id,
        groupId: row.group_id,
        userId: row.user_id,
        fixtureId: row.fixture_id,
        prediction: row.prediction,
        pointsEarned: row.points_earned,
        status: row.status,
        lockedAt: row.locked_at,
        createdAt: row.created_at,
        betType: {
          id: row.bet_type_id,
          slug: row.bt_slug,
          nameKey: row.bt_name_key,
          descriptionKey: row.bt_desc_key,
          category: row.bt_category,
          pointsCorrect: row.bt_points_correct,
          pointsPartial: row.bt_points_partial,
          isActive: row.bt_is_active,
        },
      }));
    },
  },

  // Resolver del campo fixture en PollaBet — carga lazy via fixtureId.
  // Solo se ejecuta si el cliente lo pide en su query.
  PollaBet: {
    async fixture(parent) {
      if (!parent.fixtureId) return null;
      const result = await query(
        `SELECT f.id, f.competition_id, f.matchday, f.group_name, f.stage,
                f.match_date, f.status,
                f.home_score, f.away_score,
                f.halftime_home_score, f.halftime_away_score,
                ht.id AS ht_id, ht.name AS ht_name, ht.short_name AS ht_short,
                COALESCE(NULLIF(ht.crest_url, ''), ht_co.flag_url) AS ht_crest,
                at.id AS at_id, at.name AS at_name, at.short_name AS at_short,
                COALESCE(NULLIF(at.crest_url, ''), at_co.flag_url) AS at_crest,
                c.id AS c_id, c.slug AS c_slug, c.name AS c_name, c.type AS c_type, c.season AS c_season
         FROM fixtures f
         LEFT JOIN clubs ht ON ht.id = f.home_team_id
         LEFT JOIN clubs at ON at.id = f.away_team_id
         LEFT JOIN countries ht_co ON ht_co.id = ht.country_id
         LEFT JOIN countries at_co ON at_co.id = at.country_id
         LEFT JOIN competitions c ON c.id = f.competition_id
         WHERE f.id = $1`,
        [parent.fixtureId]
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        matchday: row.matchday,
        groupName: row.group_name,
        stage: row.stage,
        matchDate: row.match_date,
        status: row.status,
        homeScore: row.home_score,
        awayScore: row.away_score,
        halftimeHomeScore: row.halftime_home_score,
        halftimeAwayScore: row.halftime_away_score,
        homeTeam: row.ht_id ? { id: row.ht_id, name: row.ht_name, shortName: row.ht_short, crestUrl: row.ht_crest } : null,
        awayTeam: row.at_id ? { id: row.at_id, name: row.at_name, shortName: row.at_short, crestUrl: row.at_crest } : null,
        competition: row.c_id ? { id: row.c_id, slug: row.c_slug, name: row.c_name, type: row.c_type, season: row.c_season } : null,
        venue: null,
      };
    },
  },

  Mutation: {
    async createPollaGroup(_parent, { name, competition, description }, context) {
      const user = requireAuth(context);
      const inviteCode = generateInviteCode();

      const result = await query(
        `INSERT INTO polla_groups (name, description, created_by, invite_code, competition)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, description || null, user.id, inviteCode, competition]
      );

      const group = result.rows[0];

      await query(
        `INSERT INTO polla_members (group_id, user_id, role)
         VALUES ($1, $2, 'admin')`,
        [group.id, user.id]
      );

      return mapGroupRow({ ...group, member_count: 1 });
    },

    async joinPollaGroup(_parent, { inviteCode }, context) {
      const user = requireAuth(context);

      const groupResult = await query(
        "SELECT * FROM polla_groups WHERE invite_code = $1 AND is_active = true",
        [inviteCode.toUpperCase()]
      );
      if (groupResult.rows.length === 0) {
        throw new Error("Invalid invite code or group is inactive");
      }

      const group = groupResult.rows[0];

      const memberCount = await query(
        "SELECT COUNT(*) as cnt FROM polla_members WHERE group_id = $1",
        [group.id]
      );
      if (parseInt(memberCount.rows[0].cnt) >= group.max_members) {
        throw new Error("Group is full");
      }

      await query(
        `INSERT INTO polla_members (group_id, user_id, role)
         VALUES ($1, $2, 'member')
         ON CONFLICT (group_id, user_id) DO NOTHING`,
        [group.id, user.id]
      );

      return mapGroupRow({ ...group, member_count: parseInt(memberCount.rows[0].cnt) + 1 });
    },

    async placeBet(_parent, { groupId, betTypeSlug, fixtureId, prediction }, context) {
      const user = requireAuth(context);

      const btResult = await query(
        "SELECT * FROM bet_types WHERE slug = $1 AND is_active = true",
        [betTypeSlug]
      );
      if (btResult.rows.length === 0) {
        throw new Error("Invalid bet type");
      }
      const betType = btResult.rows[0];

      if (fixtureId) {
        const fixture = await query(
          "SELECT match_date, status FROM fixtures WHERE id = $1",
          [fixtureId]
        );
        if (fixture.rows.length > 0) {
          const matchDate = new Date(fixture.rows[0].match_date);
          const lockTime = new Date(matchDate.getTime() - 5 * 60 * 1000);
          if (new Date() >= lockTime) {
            throw new Error("BET_LOCKED: Betting closes 5 minutes before kickoff");
          }
          if (fixture.rows[0].status !== "scheduled") {
            throw new Error("BET_LOCKED: Match has already started or finished");
          }
        }
      }

      const result = await query(
        `INSERT INTO polla_bets (group_id, user_id, bet_type_id, fixture_id, prediction, locked_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (group_id, user_id, bet_type_id, fixture_id)
         DO UPDATE SET prediction = $5, updated_at = NOW()
         RETURNING *`,
        [groupId, user.id, betType.id, fixtureId || null, JSON.stringify(prediction)]
      );

      const bet = result.rows[0];
      return {
        id: bet.id,
        groupId: bet.group_id,
        userId: bet.user_id,
        betType: mapBetType(betType),
        fixtureId: bet.fixture_id,
        prediction: bet.prediction,
        pointsEarned: bet.points_earned,
        status: bet.status,
        lockedAt: bet.locked_at,
        createdAt: bet.created_at,
      };
    },

    async updateBet(_parent, { betId, prediction }, context) {
      const user = requireAuth(context);

      const betResult = await query(
        `SELECT pb.*, f.match_date, f.status as fixture_status
         FROM polla_bets pb
         LEFT JOIN fixtures f ON f.id = pb.fixture_id
         WHERE pb.id = $1 AND pb.user_id = $2`,
        [betId, user.id]
      );
      if (betResult.rows.length === 0) {
        throw new Error("Bet not found");
      }

      const bet = betResult.rows[0];
      if (bet.match_date) {
        const lockTime = new Date(new Date(bet.match_date).getTime() - 5 * 60 * 1000);
        if (new Date() >= lockTime) {
          throw new Error("BET_LOCKED: Cannot update after betting closes");
        }
      }

      const result = await query(
        `UPDATE polla_bets SET prediction = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [JSON.stringify(prediction), betId]
      );

      const updated = result.rows[0];

      // Load the full bet_type row so we can populate the non-nullable
      // BetType fields (pointsCorrect, slug, category, ...) in the
      // returned PollaBet.
      const btResult = await query(
        "SELECT * FROM bet_types WHERE id = $1",
        [updated.bet_type_id]
      );
      const betType = btResult.rows[0];

      return {
        id: updated.id,
        groupId: updated.group_id,
        userId: updated.user_id,
        betType: mapBetType(betType),
        fixtureId: updated.fixture_id,
        prediction: updated.prediction,
        pointsEarned: updated.points_earned,
        status: updated.status,
        lockedAt: updated.locked_at,
        createdAt: updated.created_at,
      };
    },

    async leavePollaGroup(_parent, { groupId }, context) {
      const user = requireAuth(context);
      await query(
        "DELETE FROM polla_members WHERE group_id = $1 AND user_id = $2",
        [groupId, user.id]
      );
      return true;
    },
  },
};

function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function mapBetType(row) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    nameKey: row.name_key,
    descriptionKey: row.description_key,
    category: row.category,
    pointsCorrect: row.points_correct,
    pointsPartial: row.points_partial,
    isActive: row.is_active,
  };
}

function mapGroupRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    inviteCode: row.invite_code,
    competition: row.competition,
    isActive: row.is_active,
    maxMembers: row.max_members,
    memberCount: parseInt(row.member_count) || 0,
    createdAt: row.created_at,
  };
}

module.exports = pollaResolvers;
