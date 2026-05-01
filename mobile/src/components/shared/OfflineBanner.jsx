import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
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

export default function OfflineBanner({ visible }) {
  const translateY = useSharedValue(-40);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : -40, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [visible]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.banner, slideStyle]}>
      <Text style={styles.text}>
        {'\uD83D\uDCE1'} No connection — showing cached content
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 110, 132, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.lexend,
    fontSize: 12,
    color: colors.onSurface,
  },
});
