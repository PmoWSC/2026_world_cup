import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../styles/colors';
import { fonts } from '../../styles/typography';

function formatResetDate(isoString) {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return null;
  }
}

// Shown to authenticated users who exhausted their 20 daily questions
function AuthExhausted({ onGoPolla, resetAt }) {
  const resetLabel = formatResetDate(resetAt);

  return (
    <>
      <Text style={styles.title}>Tentacles need recharging! 🔋</Text>

      <Text style={styles.message}>
        You've used all 20 daily questions.
        {resetLabel ? `\nYour questions reset on ${resetLabel}.` : ''}
      </Text>

      <View style={styles.pollaBox}>
        <Text style={styles.pollaBoxTitle}>Meanwhile, you still have full Polla access!</Text>
        <Text style={styles.pollaBoxBody}>
          Create groups, invite friends and place bets on upcoming matches.{'\n'}
          <Text style={styles.pollaLimit}>Max 5 active Polla groups per account.</Text>
        </Text>
      </View>

      <Pressable onPress={onGoPolla}>
        <LinearGradient
          colors={gradients.primaryToSecondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <Text style={styles.buttonText}>Go to My Pollas</Text>
        </LinearGradient>
      </Pressable>

      <Text style={styles.upgradeHint}>
        Need more questions? Upgrade coming soon 🚀
      </Text>
    </>
  );
}

// Shown to anonymous users who dismissed the registration modal
function AnonExhausted({ onRegister }) {
  return (
    <>
      <Text style={styles.title}>You've used your 5 free questions!</Text>

      <Text style={styles.message}>
        Register free and get 20 daily questions, plus full access to Polla.
      </Text>

      <Pressable onPress={onRegister} style={styles.registerWrapper}>
        <LinearGradient
          colors={gradients.signature}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientButton}
        >
          <Text style={styles.buttonText}>Register Free 🚀</Text>
        </LinearGradient>
      </Pressable>
    </>
  );
}

export default function RateLimitExhausted({ onGoPolla, onRegister, isAuthenticated, resetAt }) {
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  return (
    <View style={styles.container}>
      <Animated.View style={pulseStyle}>
        <Text style={styles.emoji}>🐙💤</Text>
      </Animated.View>

      {isAuthenticated ? (
        <AuthExhausted onGoPolla={onGoPolla} resetAt={resetAt} />
      ) : (
        <AnonExhausted onRegister={onRegister} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 12,
  },
  emoji: {
    fontSize: 56,
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
    lineHeight: 22,
  },

  // Polla info box (authenticated)
  pollaBox: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 16,
    alignSelf: 'stretch',
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
    gap: 6,
    marginVertical: 4,
  },
  pollaBoxTitle: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 13,
    color: colors.secondary,
  },
  pollaBoxBody: {
    fontFamily: fonts.lexend,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  pollaLimit: {
    color: colors.outline,
    fontSize: 12,
  },

  // Buttons
  registerWrapper: {
    alignSelf: 'stretch',
  },
  gradientButton: {
    borderRadius: 9999,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
  },

  // Upgrade hint
  upgradeHint: {
    fontFamily: fonts.lexend,
    fontSize: 12,
    color: colors.outline,
    textAlign: 'center',
    marginTop: 4,
  },
});
