import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

export default function LoadingPulpo() {
  const bobY = useSharedValue(0);
  const tentacle1 = useSharedValue(0);
  const tentacle2 = useSharedValue(0);
  const tentacle3 = useSharedValue(0);
  const dotOpacity1 = useSharedValue(0);
  const dotOpacity2 = useSharedValue(0);
  const dotOpacity3 = useSharedValue(0);

  useEffect(() => {
    // Main octopus bob up/down
    bobY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 750, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Tentacle wave animations with staggered timing
    tentacle1.value = withRepeat(
      withSequence(
        withTiming(12, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(-12, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    tentacle2.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(12, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(-12, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    tentacle3.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(12, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(-12, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Typing dots cycling
    dotOpacity1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.2, { duration: 400 })
      ),
      -1,
      true
    );

    dotOpacity2.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.2, { duration: 400 })
        ),
        -1,
        true
      )
    );

    dotOpacity3.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.2, { duration: 400 })
        ),
        -1,
        true
      )
    );
  }, []);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }],
  }));

  const tentacleStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateX: tentacle1.value }],
  }));

  const tentacleStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateX: tentacle2.value }],
  }));

  const tentacleStyle3 = useAnimatedStyle(() => ({
    transform: [{ translateX: tentacle3.value }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dotOpacity1.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dotOpacity2.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dotOpacity3.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={bobStyle}>
        <Text style={styles.emoji}>{'\uD83D\uDC19'}</Text>
      </Animated.View>

      {/* Tentacle wave lines */}
      <View style={styles.tentaclesContainer}>
        <Animated.View style={[styles.tentacleLine, tentacleStyle1]} />
        <Animated.View style={[styles.tentacleLine, tentacleStyle2]} />
        <Animated.View style={[styles.tentacleLine, tentacleStyle3]} />
      </View>

      {/* Analyzing text with typing dots */}
      <View style={styles.textRow}>
        <Text style={styles.text}>Pulpo is analyzing</Text>
        <View style={styles.dotsRow}>
          <Animated.Text style={[styles.dot, dot1Style]}>.</Animated.Text>
          <Animated.Text style={[styles.dot, dot2Style]}>.</Animated.Text>
          <Animated.Text style={[styles.dot, dot3Style]}>.</Animated.Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
    backgroundColor: colors.surfaceContainerLowest,
    flex: 1,
  },
  emoji: {
    fontSize: 64,
  },
  tentaclesContainer: {
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  tentacleLine: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  text: {
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  dotsRow: {
    flexDirection: 'row',
    width: 20,
  },
  dot: {
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
});
