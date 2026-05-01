import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import QuickChips from './QuickChips';
import TypingIndicator from './TypingIndicator';
import PulpoAvatar from './PulpoAvatar';
import RateLimitExhausted from '../shared/RateLimitExhausted';
import RegistrationPromptModal from './RegistrationPromptModal';

function WelcomeState() {
  return (
    <View style={styles.welcomeContainer}>
      <PulpoAvatar size={48} />
      <Text style={styles.welcomeText}>
        Ask Pulpo anything about football
      </Text>
    </View>
  );
}

export default function ChatPanel() {
  const {
    messages,
    sendMessage,
    isLoading,
    remainingMessages,
    resetAt,
    isAuthenticated,
    showRegistrationPrompt,
    dismissRegistrationPrompt,
  } = useChat();
  const router = useRouter();

  const flatListRef = useRef(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length, isLoading]);

  const handleSend = useCallback((text) => sendMessage(text), [sendMessage]);

  const handleGoPolla = useCallback(() => {
    router.navigate('/(tabs)/polla');
  }, [router]);

  const renderMessage = useCallback(
    ({ item }) => <MessageBubble message={item} />,
    [],
  );

  const keyExtractor = useCallback(
    (item) => item.id ?? `${item.role}-${item.timestamp}`,
    [],
  );

  const isEmpty = messages.length === 0;
  const isRateLimited = remainingMessages === 0;

  // Counter label
  const counterLabel = (() => {
    if (remainingMessages == null) return null;
    if (isAuthenticated) {
      return `🐙 ${remainingMessages} of 30 weekly questions left`;
    }
    return `🐙 ${remainingMessages}/5 free questions left`;
  })();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {/* Messages area */}
        {isEmpty ? (
          <View style={styles.emptyFill}>
            <WelcomeState />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isLoading ? <TypingIndicator /> : null}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Bottom area */}
        <View style={styles.bottomSection}>
          {isRateLimited ? (
            <RateLimitExhausted
              onGoPolla={handleGoPolla}
              isAuthenticated={isAuthenticated}
              resetAt={resetAt}
              onRegister={() => router.push('/auth/register')}
            />
          ) : (
            <>
              <QuickChips onChipPress={handleSend} />
              <ChatInput onSubmit={handleSend} />
              {counterLabel && (
                <Text style={styles.rateLimit}>{counterLabel}</Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Registration prompt modal for anonymous users */}
      <RegistrationPromptModal
        visible={showRegistrationPrompt}
        onDismiss={dismissRegistrationPrompt}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  emptyFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  welcomeText: {
    ...typography.bodyLarge,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  bottomSection: {
    paddingBottom: 80,
    gap: 8,
  },
  rateLimit: {
    ...typography.bodySmall,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    opacity: 0.6,
    paddingVertical: 4,
  },
});
