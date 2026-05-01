import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { typography, fonts } from '../../styles/typography';

function PodiumCard({ team, probability, rank }) {
  const isFirst = rank === 1;
  const isSecond = rank === 2;

  const cardBg = isSecond
    ? colors.surfaceContainerHigh
    : colors.surfaceContainer;

  const barColor = isFirst ? colors.secondary : colors.tertiary;

  const nameSize = isFirst ? 20 : isSecond ? 17 : 15;
  const paddingV = isFirst ? 20 : isSecond ? 16 : 14;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: cardBg, paddingVertical: paddingV },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.rankBadge}>
          {isFirst && <Text style={styles.crown}>{'\uD83D\uDC51'}</Text>}
          <Text
            style={[
              styles.rankText,
              isFirst && { color: colors.tertiary },
            ]}
          >
            #{rank}
          </Text>
        </View>
        <Text
          style={[
            styles.teamName,
            { fontSize: nameSize },
          ]}
          numberOfLines={1}
        >
          {team}
        </Text>
      </View>

      {/* Probability bar */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${probability}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      <Text style={[styles.probabilityText, { color: barColor }]}>
        {probability}%
      </Text>
    </View>
  );
}

export default function PodiumForecast({ data }) {
  if (!data || data.length === 0) return null;

  // Sort by rank to ensure correct order
  const sorted = [...data].sort((a, b) => a.rank - b.rank).slice(0, 3);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>NEURAL ANALYTICS</Text>
      <Text style={styles.heading}>Podium Forecast</Text>

      <View style={styles.cardStack}>
        {sorted.map((item) => (
          <PodiumCard
            key={item.rank}
            team={item.team}
            probability={item.probability}
            rank={item.rank}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fonts.lexend,
    fontSize: 9,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: '#a18eff',
  },
  heading: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 22,
    color: colors.onSurface,
    marginBottom: 8,
  },
  cardStack: {
    gap: 8,
  },
  card: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  crown: {
    fontSize: 16,
  },
  rankText: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  teamName: {
    fontFamily: fonts.spaceGroteskBold,
    color: colors.onSurface,
    flex: 1,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  probabilityText: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 16,
  },
});
