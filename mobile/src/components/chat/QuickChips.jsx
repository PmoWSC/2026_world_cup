import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';

const CHIP_KEYS = [
  'live_simulations',
  'historical_bias',
  'player_stats',
  'upcoming_matches',
  'league_standings',
];

export default function QuickChips({ onChipPress }) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CHIP_KEYS.map((key) => {
        const label = t(`quick_chips.${key}`);
        return (
          <Pressable
            key={key}
            onPress={() => onChipPress?.(label)}
            style={({ pressed }) => [
              styles.chip,
              pressed && styles.chipPressed,
            ]}
          >
            <Text style={styles.chipText}>{label}</Text>
          </Pressable>
        );
      })}
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
