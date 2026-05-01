import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import PulpoAvatar from './PulpoAvatar';

const DOT_COUNT = 3;
const STAGGER_MS = 200;

function AnimatedDot({ index }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      index * STAGGER_MS,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        false,
      ),
    );
  }, [index, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export default function TypingIndicator() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <PulpoAvatar size={24} />
        <Animated.Text style={styles.label}>PULPO INTELLIGENCE</Animated.Text>
      </View>
      <View style={styles.dotsRow}>
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <AnimatedDot key={i} index={i} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingLeft: 16,
    paddingVertical: 8,
    maxWidth: '95%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    ...typography.labelSmall,
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 32,
    paddingVertical: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.secondaryAlpha30,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
});
