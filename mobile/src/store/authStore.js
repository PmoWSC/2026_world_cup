import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

// Same pattern as src/hooks/useDisclaimer.js. Bumping the version key
// invalidates persisted tokens (useful if the JWT signing scheme changes).
const STORAGE_KEY = 'pulpo_auth_v1';

async function persist(payload) {
  try {
    if (payload && payload.token) {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(payload));
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
  } catch (err) {
    console.warn('[auth] persist failed:', err.message);
  }
}

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  // `hydrated` flips to true once the initial read from SecureStore is done.
  // The root layout uses this to keep the splash up until we know whether
  // the user has a valid session — avoids the flash of the Login screen on
  // every cold start.
  hydrated: false,

  setAuth: (token, refreshToken, user) => {
    set({
      token,
      refreshToken,
      user,
      isAuthenticated: !!token,
    });
    persist({ token, refreshToken, user });
  },

  logout: () => {
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    });
    persist(null);
  },

  getToken: () => get().token,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) {
        const { token, refreshToken, user } = JSON.parse(raw);
        if (token) {
          set({
            token,
            refreshToken,
            user,
            isAuthenticated: true,
          });
        }
      }
    } catch (err) {
      console.warn('[auth] hydrate failed:', err.message);
    } finally {
      set({ hydrated: true });
    }
  },
}));
