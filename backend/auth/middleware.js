const { verifyAccessToken } = require("./jwt");

function extractUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

module.exports = { extractUser };
