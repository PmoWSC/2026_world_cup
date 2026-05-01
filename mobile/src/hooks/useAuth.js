import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';
import { useAuthStore } from '../store/authStore';
import { LOGIN, REGISTER, REFRESH_TOKEN } from '../apollo/mutations';

export function useAuth() {
  const { user, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [loginMutate] = useMutation(LOGIN);
  const [registerMutate] = useMutation(REGISTER);
  const [refreshMutate] = useMutation(REFRESH_TOKEN);

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
