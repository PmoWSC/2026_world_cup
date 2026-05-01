import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/typography';

const MIN_SCORE = 0;
const MAX_SCORE = 20;

export default function ScoreStepper({ value, onChange, label }) {
  const handleDecrement = () => {
    if (value > MIN_SCORE) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < MAX_SCORE) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(value + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={handleDecrement}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            value <= MIN_SCORE && styles.buttonDisabled,
          ]}
          disabled={value <= MIN_SCORE}
        >
          <Text style={styles.buttonText}>-</Text>
        </Pressable>

        <Text style={styles.value}>{value}</Text>

        <Pressable
          onPress={handleIncrement}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            value >= MAX_SCORE && styles.buttonDisabled,
          ]}
          disabled={value >= MAX_SCORE}
        >
          <Text style={styles.buttonText}>+</Text>
        </Pressable>
      </View>

      {label != null && (
        <Text style={styles.label}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  buttonText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 22,
    color: colors.onSurface,
    lineHeight: 26,
  },
  value: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 48,
    color: colors.onSurface,
    minWidth: 60,
    textAlign: 'center',
  },
  label: {
    fontFamily: fonts.lexend,
    fontSize: 12,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
    letterSpacing: 2,
    marginTop: 8,
  },
});
