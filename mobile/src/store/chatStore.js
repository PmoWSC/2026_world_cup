import { create } from 'zustand';

function generateSessionId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useChatStore = create((set) => ({
  messages: [],
  remainingMessages: null,
  isLoading: false,
  sessionId: generateSessionId(),
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

  setResetAt: (resetAt) => set({ resetAt }),

  setShowRegistrationPrompt: (showRegistrationPrompt) => set({ showRegistrationPrompt }),

  clearChat: () =>
    set({ messages: [], remainingMessages: null, isLoading: false, resetAt: null }),
}));
