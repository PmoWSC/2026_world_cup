import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { typography, fonts } from '../../styles/typography';

export default function GroupStandings({ data, groupName }) {
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Group header */}
      <Text style={styles.groupHeader}>GROUP {groupName}</Text>

      {/* Table header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.posCol]}>Pos</Text>
        <Text style={[styles.headerCell, styles.teamCol]}>Team</Text>
        <Text style={[styles.headerCell, styles.statCol]}>P</Text>
        <Text style={[styles.headerCell, styles.statCol]}>W</Text>
        <Text style={[styles.headerCell, styles.statCol]}>D</Text>
        <Text style={[styles.headerCell, styles.statCol]}>L</Text>
        <Text style={[styles.headerCell, styles.statCol]}>GD</Text>
        <Text style={[styles.headerCell, styles.statCol]}>Pts</Text>
      </View>

      {/* Data rows */}
      {data.map((row, index) => {
        const isQualifying = row.position <= 2;
        const isEven = index % 2 === 0;

        return (
          <View
            key={`${row.team}-${row.position}`}
            style={[
              styles.dataRow,
              {
                backgroundColor: isEven
                  ? colors.surfaceContainer
                  : colors.surfaceContainerHigh,
              },
              isQualifying && {
                borderLeftWidth: 3,
                borderLeftColor: colors.secondary,
              },
            ]}
          >
            <Text style={[styles.dataCell, styles.posCol, styles.posText]}>
              {row.position}
            </Text>
            <Text
              style={[styles.dataCell, styles.teamCol, styles.teamText]}
              numberOfLines={1}
            >
              {row.team}
            </Text>
            <Text style={[styles.dataCell, styles.statCol, styles.statText]}>
              {row.played}
            </Text>
            <Text style={[styles.dataCell, styles.statCol, styles.statText]}>
              {row.won}
            </Text>
            <Text style={[styles.dataCell, styles.statCol, styles.statText]}>
              {row.drawn}
            </Text>
            <Text style={[styles.dataCell, styles.statCol, styles.statText]}>
              {row.lost}
            </Text>
            <Text style={[styles.dataCell, styles.statCol, styles.statText]}>
              {row.goalDifference > 0
                ? `+${row.goalDifference}`
                : row.goalDifference}
            </Text>
            <Text style={[styles.dataCell, styles.statCol, styles.ptsText]}>
              {row.points}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  groupHeader: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.primaryFixed,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.surfaceContainerHighest,
  },
  headerCell: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  dataCell: {
    color: colors.onSurface,
  },
  posCol: {
    width: 30,
    textAlign: 'center',
  },
  teamCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  statCol: {
    width: 28,
    textAlign: 'center',
  },
  posText: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 13,
  },
  teamText: {
    fontFamily: fonts.lexend,
    fontSize: 12,
  },
  statText: {
    ...typography.dataSmall,
    fontSize: 12,
  },
  ptsText: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 13,
    color: colors.secondary,
  },
});
