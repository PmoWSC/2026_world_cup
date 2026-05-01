import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/typography';
import PulpoAvatar from '../chat/PulpoAvatar';

const SUGGESTED_QUERIES = [
  'Who wins El Cl\u00e1sico this weekend?',
  'Top scorers in Premier League',
  'Arsenal vs Liverpool prediction',
];

export default function EmptyChatState({ onSuggestionPress }) {
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Floating Pulpo avatar */}
      <Animated.View style={floatStyle}>
        <PulpoAvatar size={96} />
      </Animated.View>

      {/* Wordmark */}
      <Text style={styles.wordmark}>PULPO.AI</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>Your Football Oracle</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Hint text */}
      <Text style={styles.hint}>
        Ask me anything about La Liga, Premier League, predictions, players, transfers...
      </Text>

      {/* Suggested query pill buttons */}
      <View style={styles.suggestionsContainer}>
        {SUGGESTED_QUERIES.map((query) => (
          <Pressable
            key={query}
            style={styles.suggestionButton}
            onPress={() => onSuggestionPress?.(query)}
          >
            <Text style={styles.suggestionText}>{query}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    flex: 1,
  },
  wordmark: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 32,
    color: colors.primary,
    letterSpacing: -1,
    textTransform: 'uppercase',
    marginTop: 12,
  },
  subtitle: {
    fontFamily: fonts.lexend,
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.3,
    marginVertical: 24,
  },
  hint: {
    fontFamily: fonts.lexendLight,
    fontSize: 14,
    color: 'rgba(171, 171, 171, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: 24,
  },
  suggestionsContainer: {
    gap: 12,
    width: '100%',
    alignItems: 'center',
  },
  suggestionButton: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  suggestionText: {
    fontFamily: fonts.lexend,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
});
