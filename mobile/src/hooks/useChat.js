import { useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { CHAT_MUTATION } from '../apollo/mutations';

export function useChat() {
  const {
    messages,
    remainingMessages,
    isLoading,
    sessionId,
    resetAt,
    showRegistrationPrompt,
    addMessage,
    setLoading,
    setRemainingMessages,
    setResetAt,
    setShowRegistrationPrompt,
  } = useChatStore();

  const { isAuthenticated } = useAuthStore();
  const { i18n } = useTranslation();
  const [chatMutate] = useMutation(CHAT_MUTATION);

  const sendMessage = useCallback(
    async (text) => {
      addMessage({ role: 'user', content: text });
      setLoading(true);

      try {
        const { data } = await chatMutate({
          variables: { message: text, language: i18n.language, sessionId },
        });

        const reply = data?.chat;
        if (reply) {
          if (reply.message) {
            addMessage({
              role: 'assistant',
              content: reply.message,
              visualization: reply.visualization,
            });
          }

          if (reply.remaining_messages != null) {
            setRemainingMessages(reply.remaining_messages);
          }

          if (reply.reset_at) {
            setResetAt(reply.reset_at);
          }

          // Trigger registration prompt when anonymous user exhausts free questions
          if (reply.remaining_messages === 0 && !isAuthenticated) {
            setShowRegistrationPrompt(true);
          }
        }
      } catch (error) {
        addMessage({
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        });
        console.error('Chat mutation error:', error);
      } finally {
        setLoading(false);
      }
    },
    [chatMutate, sessionId, i18n.language, isAuthenticated, addMessage, setLoading, setRemainingMessages, setResetAt, setShowRegistrationPrompt],
  );

  const dismissRegistrationPrompt = useCallback(() => {
    setShowRegistrationPrompt(false);
  }, [setShowRegistrationPrompt]);

  return {
    messages,
    sendMessage,
    isLoading,
    remainingMessages,
    resetAt,
    isAuthenticated,
    showRegistrationPrompt,
    dismissRegistrationPrompt,
  };
}
