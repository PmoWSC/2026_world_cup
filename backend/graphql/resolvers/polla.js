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
        betType,
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
      return {
        id: updated.id,
        groupId: updated.group_id,
        userId: updated.user_id,
        betType: { slug: bet.bet_type_id },
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
