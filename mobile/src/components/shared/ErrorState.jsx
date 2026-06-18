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

export default function ErrorState({ message, onRetry, onGoHome }) {
  const shake = useSharedValue(0);

  useEffect(() => {
    shake.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(-5, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 200, easing: Easing.inOut(Easing.ease) }),
        withTiming(-3, { duration: 200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 150, easing: Easing.inOut(Easing.ease) }),
        withDelay(2000, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${shake.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={shakeStyle}>
        <Text style={styles.emoji}>{'\uD83D\uDC19'}{'\uD83E\uDD37'}</Text>
      </Animated.View>

      <Text style={styles.title}>Oops! My tentacles got tangled</Text>

      <Text style={styles.message}>
        {message || 'Something went wrong. Please try again.'}
      </Text>

      {onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      )}

      {onGoHome && (
        <Pressable onPress={onGoHome}>
          <Text style={styles.goHomeText}>Go Home</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 12,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 18,
    color: colors.onSurface,
    textAlign: 'center',
    marginTop: 4,
  },
  message: {
    fontFamily: fonts.lexendLight,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 9999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 14,
    color: colors.primary,
  },
  goHomeText: {
    fontFamily: fonts.lexend,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
});
