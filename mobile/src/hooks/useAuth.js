import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { LOGIN, REGISTER, REFRESH_TOKEN } from '../apollo/mutations';

export function useAuth() {
  const { user, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [loginMutate] = useMutation(LOGIN);
  const [registerMutate] = useMutation(REGISTER);
  const [refreshMutate] = useMutation(REFRESH_TOKEN);

  // Reset chat counter when transitioning between anonymous and authenticated.
  // The counters live in different identifiers on the backend (sessionId vs
  // user.id), so the value the UI is showing — pulled from the last chat
  // response while still anonymous — is stale immediately after login. We
  // null it out so the label hides until the next chat response populates
  // the real number for the new identifier.
  function resetChatCounter() {
    const store = useChatStore.getState();
    store.setRemainingMessages(null);
    store.setDailyLimit(null);
    store.setResetAt(null);
  }

  const login = useCallback(
    async (email, password) => {
      setIsLoading(true);
      try {
        const { data } = await loginMutate({
          variables: { email, password },
        });
        const result = data?.login;
        if (result) {
          setAuth(result.token, result.refreshToken, result.user);
          resetChatCounter();
        }
        return result;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [loginMutate, setAuth],
  );

  const register = useCallback(
    async (email, password, displayName) => {
      setIsLoading(true);
      try {
        const { data } = await registerMutate({
          variables: { email, password, displayName },
        });
        const result = data?.register;
        if (result) {
          setAuth(result.token, result.refreshToken, result.user);
          resetChatCounter();
        }
        return result;
      } catch (error) {
        console.error('Register error:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [registerMutate, setAuth],
  );

  const logout = useCallback(() => {
    storeLogout();
  }, [storeLogout]);

  return { user, isAuthenticated, login, register, logout, isLoading };
}
