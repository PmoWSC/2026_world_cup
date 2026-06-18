import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloProvider as BaseApolloProvider,
  fromPromise,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://pulpo.white-systems.com/graphql';

const httpLink = createHttpLink({ uri: API_URL });

const authLink = setContext((_, { headers }) => {
  const token = useAuthStore.getState().token;
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

// Refresh-on-401 link. Access tokens last 15 min; without this, every
// request after that window would silently fall back to "anonymous"
// (backend sees no valid bearer). The mobile UI would still believe the
// user is logged in — that's the "4 of 20" bug. With this link, if the
// server responds with an auth error we transparently refresh the access
// token using the long-lived (30 day) refresh token, then replay the
// original request. If refresh itself fails (refresh token expired,
// revoked, etc.), we clear auth and let the UI naturally route back to
// login on the next interaction.
let refreshInFlight = null; // single in-flight refresh shared by concurrent failed requests

function isAuthError(graphQLErrors, networkError) {
  if (networkError && (networkError.statusCode === 401 || networkError.statusCode === 403)) {
    return true;
  }
  if (!graphQLErrors) return false;
  return graphQLErrors.some((err) => {
    const code = err.extensions?.code;
    if (code === 'UNAUTHENTICATED' || code === 'UNAUTHORIZED') return true;
    // Different resolvers throw slightly different strings: "Authentication
    // required" (polla resolver), "not authenticated", "invalid token", etc.
    // We match permissively so any of them triggers a silent token refresh
    // instead of bubbling up as an Alert to the user.
    const msg = (err.message || '').toLowerCase();
    return (
      msg.includes('authentication required') ||
      msg.includes('not authenticated') ||
      msg.includes('invalid token') ||
      msg.includes('unauthorized') ||
      msg.includes('jwt expired') ||
      msg.includes('token expired')
    );
  });
}

async function performRefresh() {
  const { refreshToken, setAuth, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    return null;
  }
  try {
    // Direct fetch (not Apollo) to avoid triggering this same link again.
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation RT($rt: String!) { refreshToken(refreshToken: $rt) { token refreshToken user { id email displayName } } }`,
        variables: { rt: refreshToken },
      }),
    });
    const json = await resp.json();
    const out = json?.data?.refreshToken;
    if (!out?.token) {
      logout();
      return null;
    }
    setAuth(out.token, out.refreshToken, out.user);
    return out.token;
  } catch (err) {
    console.warn('[auth] refresh failed:', err.message);
    logout();
    return null;
  }
}

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (!isAuthError(graphQLErrors, networkError)) return;
  // Don't recurse on the refresh mutation itself.
  if (operation.operationName === 'RT' || operation.operationName === 'RefreshToken') return;

  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }

  return fromPromise(refreshInFlight).flatMap((newToken) => {
    if (!newToken) return forward(operation); // refresh failed; let original error bubble
    operation.setContext(({ headers = {} }) => ({
      headers: { ...headers, Authorization: `Bearer ${newToken}` },
    }));
    return forward(operation);
  });
});

export const client = new ApolloClient({
  link: errorLink.concat(authLink).concat(httpLink),
  cache: new InMemoryCache(),
});

export { BaseApolloProvider as ApolloProvider };
