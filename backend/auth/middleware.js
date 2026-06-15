const { verifyAccessToken } = require("./jwt");

// Returns { user, tokenInvalid }
// - user = { id, email } if a valid Bearer token was sent
// - user = null with tokenInvalid = false when no Bearer header was sent
//   (legitimate anonymous request)
// - user = null with tokenInvalid = true when a Bearer header WAS sent but
//   verification failed (expired/tampered). Callers can use this signal to
//   return an auth error and prompt the client to refresh, instead of
//   silently downgrading the user to anonymous.
function extractUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, tokenInvalid: false };
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyAccessToken(token);
    return {
      user: { id: payload.sub, email: payload.email },
      tokenInvalid: false,
    };
  } catch {
    return { user: null, tokenInvalid: true };
  }
}

module.exports = { extractUser };
