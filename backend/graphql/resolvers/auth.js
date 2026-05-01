const bcrypt = require("bcrypt");
const { query } = require("../../config/db");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../../auth/jwt");

const SALT_ROUNDS = 12;

const authResolvers = {
  Mutation: {
    async register(_parent, { email, password, displayName }) {
      if (!email || !password || !displayName) {
        throw new Error("Email, password, and display name are required");
      }
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      const existing = await query(
        "SELECT id FROM users WHERE email = $1",
        [email.toLowerCase()]
      );
      if (existing.rows.length > 0) {
        throw new Error("Email already registered");
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const result = await query(
        `INSERT INTO users (email, password_hash, display_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, display_name, avatar_url, language_preference, created_at`,
        [email.toLowerCase(), passwordHash, displayName]
      );

      const user = result.rows[0];
      const token = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id);

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          languagePreference: user.language_preference,
          createdAt: user.created_at,
        },
      };
    },

    async login(_parent, { email, password }) {
      const result = await query(
        "SELECT id, email, password_hash, display_name, avatar_url, language_preference, created_at FROM users WHERE email = $1",
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        throw new Error("Invalid email or password");
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        throw new Error("Invalid email or password");
      }

      const token = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id);

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          languagePreference: user.language_preference,
          createdAt: user.created_at,
        },
      };
    },

    async refreshToken(_parent, { refreshToken: token }) {
      let payload;
      try {
        payload = verifyRefreshToken(token);
      } catch {
        throw new Error("Invalid or expired refresh token");
      }

      const result = await query(
        "SELECT id, email, display_name, avatar_url, language_preference, created_at FROM users WHERE id = $1",
        [payload.sub]
      );

      if (result.rows.length === 0) {
        throw new Error("User not found");
      }

      const user = result.rows[0];
      const newToken = generateAccessToken(user.id, user.email);
      const newRefreshToken = generateRefreshToken(user.id);

      return {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          languagePreference: user.language_preference,
          createdAt: user.created_at,
        },
      };
    },
  },
};

module.exports = authResolvers;
