import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider as BaseApolloProvider } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4000/graphql';

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

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export { BaseApolloProvider as ApolloProvider };
