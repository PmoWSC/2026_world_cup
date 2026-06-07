import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

// Persistent session ID. Without this, the rate limit on the backend
// (5 messages/day per sessionId for anonymous users) was being bypassed
// every cold start — a brand-new random ID was generated and the user
// got 5 fresh questions just by closing and reopening the app.
const SESSION_KEY = 'pulpo_session_id_v1';

function newSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useChatStore = create((set, get) => ({
  messages: [],
  remainingMessages: null,
  dailyLimit: null,       // se llena con el primer chat response del backend
  isLoading: false,
  sessionId: null,        // null hasta hydrate; el _layout no monta el chat antes
  hydrated: false,
  resetAt: null,
  showRegistrationPrompt: false,

  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: msg.id || Date.now().toString(),
          role: msg.role,
          content: msg.content,
          visualization: msg.visualization || null,
          timestamp: msg.timestamp || new Date().toISOString(),
        },
      ],
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setRemainingMessages: (remainingMessages) => set({ remainingMessages }),

  setDailyLimit: (dailyLimit) => set({ dailyLimit }),

  setResetAt: (resetAt) => set({ resetAt }),

  setShowRegistrationPrompt: (showRegistrationPrompt) => set({ showRegistrationPrompt }),

  clearChat: () =>
    set({ messages: [], remainingMessages: null, dailyLimit: null, isLoading: false, resetAt: null }),

  // Read (or create-and-persist) the sessionId. Called once on cold start
  // from the root layout. The id is stable across cold starts on the same
  // device, so the backend can rate-limit anonymous users honestly.
  hydrate: async () => {
    try {
      let sid = await SecureStore.getItemAsync(SESSION_KEY);
      if (!sid) {
        sid = newSessionId();
        await SecureStore.setItemAsync(SESSION_KEY, sid);
      }
      set({ sessionId: sid });
    } catch (err) {
      console.warn('[chat] hydrate failed:', err.message);
      set({ sessionId: newSessionId() });
    } finally {
      set({ hydrated: true });
    }
  },
}));
