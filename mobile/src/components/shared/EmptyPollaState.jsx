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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../styles/colors';
import { fonts } from '../../styles/typography';

export default function EmptyPollaState({ onCreatePool, onJoinPool }) {
  const scaleValue = useSharedValue(1);

  useEffect(() => {
    scaleValue.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={pulseStyle}>
        <Text style={styles.emoji}>{'\uD83D\uDC19'}{'\uD83C\uDFC6'}</Text>
      </Animated.View>

      <Text style={styles.title}>Create your first pool!</Text>

      <Text style={styles.message}>
        Compete with friends by predicting match outcomes
      </Text>

      {onCreatePool && (
        <Pressable onPress={onCreatePool}>
          <LinearGradient
            colors={gradients.primaryToSecondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Create Pool</Text>
          </LinearGradient>
        </Pressable>
      )}

      {onJoinPool && (
        <Pressable onPress={onJoinPool}>
          <Text style={styles.joinText}>Join with code</Text>
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
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 22,
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
  gradientButton: {
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  buttonText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 14,
    color: colors.onSurface,
    textAlign: 'center',
  },
  joinText: {
    fontFamily: fonts.lexend,
    fontSize: 13,
    color: colors.primary,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
});
