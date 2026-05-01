import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

const CHIPS = [
  'Live Simulations',
  'Historical Bias',
  'Player Stats',
  'Upcoming Matches',
  'League Standings',
];

export default function QuickChips({ onChipPress }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CHIPS.map((label) => (
        <Pressable
          key={label}
          onPress={() => onChipPress?.(label)}
          style={({ pressed }) => [
            styles.chip,
            pressed && styles.chipPressed,
          ]}
        >
          <Text style={styles.chipText}>{label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    paddingVertical: 4,
  },
  chipPressed: {
    opacity: 0.7,
  },
  chipText: {
    ...typography.chip,
    color: colors.whiteAlpha40,
  },
});
