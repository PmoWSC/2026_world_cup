import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,

  setAuth: (token, refreshToken, user) =>
    set({
      token,
      refreshToken,
      user,
      isAuthenticated: !!token,
    }),

  logout: () =>
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    }),

  getToken: () => get().token,
}));
