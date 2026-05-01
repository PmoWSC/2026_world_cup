import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { typography, fonts } from '../../styles/typography';

export default function TopPerformerCard({ data }) {
  if (!data) return null;

  const { name, club, position, nationality, stats, grade } = data;

  return (
    <View style={styles.container}>
      {/* Header: player name + grade badge */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.playerName}>{name}</Text>
          <Text style={styles.meta}>
            {nationality} {'\u2022'} {position}
          </Text>
          {club && <Text style={styles.club}>{club}</Text>}
        </View>

        {grade && (
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeText}>{grade}</Text>
          </View>
        )}
      </View>

      {/* Stats grid */}
      {stats && Object.keys(stats).length > 0 && (
        <View style={styles.statsGrid}>
          {Object.entries(stats).map(([label, value]) => (
            <View key={label} style={styles.statItem}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  playerName: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 20,
    color: colors.onSurface,
  },
  meta: {
    fontFamily: fonts.lexend,
    fontSize: 12,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  club: {
    fontFamily: fonts.lexendLight,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  gradeBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  gradeText: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 20,
    color: colors.tertiary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    minWidth: 64,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 18,
    color: colors.onSurface,
  },
  statLabel: {
    fontFamily: fonts.lexend,
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
