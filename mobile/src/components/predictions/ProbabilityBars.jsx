import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/typography';

const BARS = [
  { key: 'homeWin', labelKey: 'home', color: colors.primary },
  { key: 'draw',    labelKey: 'draw', color: colors.onSurfaceVariant },
  { key: 'awayWin', labelKey: 'away', color: colors.secondary },
];

function Bar({ label, value, color, teamName }) {
  const pct = Math.round(value * 100);
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>
        {teamName || label}
      </Text>
      <View style={styles.trackOuter}>
        <View style={[styles.trackFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barPct, { color }]}>{pct}%</Text>
    </View>
  );
}

export default function ProbabilityBars({ data }) {
  if (!data) return null;

  const { homeWin, draw, awayWin, homeTeam, awayTeam, models } = data;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.teamHome} numberOfLines={1}>{homeTeam || 'Home'}</Text>
        <Text style={styles.vs}>VS</Text>
        <Text style={styles.teamAway} numberOfLines={1}>{awayTeam || 'Away'}</Text>
      </View>

      {/* Main probability bars */}
      <View style={styles.barsSection}>
        <Bar label="Home" value={homeWin} color={colors.primary}   teamName={homeTeam} />
        <Bar label="Draw" value={draw}    color={colors.outline}    teamName="Draw" />
        <Bar label="Away" value={awayWin} color={colors.secondary}  teamName={awayTeam} />
      </View>

      {/* Model breakdown */}
      {Array.isArray(models) && models.length > 0 && (
        <View style={styles.modelsSection}>
          <Text style={styles.modelsTitle}>MODEL BREAKDOWN</Text>
          {models.map((m) => (
            <View key={m.name} style={styles.modelRow}>
              <Text style={styles.modelName}>{m.name?.toUpperCase()}</Text>
              <View style={styles.modelDots}>
                <Dot value={m.homeWin} color={colors.primary} />
                <Dot value={m.draw}    color={colors.outline} />
                <Dot value={m.awayWin} color={colors.secondary} />
              </View>
              <Text style={styles.modelPcts}>
                {Math.round(m.homeWin * 100)}% · {Math.round(m.draw * 100)}% · {Math.round(m.awayWin * 100)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Dot({ value, color }) {
  const size = 6 + Math.round(value * 14);
  return (
    <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: 0.3 + value * 0.7 }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  teamHome: {
    flex: 1,
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 13,
    color: colors.primary,
    textAlign: 'left',
  },
  vs: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 10,
    color: colors.outline,
    letterSpacing: 2,
  },
  teamAway: {
    flex: 1,
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 13,
    color: colors.secondary,
    textAlign: 'right',
  },

  // Bars
  barsSection: {
    gap: 10,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barLabel: {
    width: 80,
    fontFamily: fonts.lexendMedium,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    textAlign: 'right',
  },
  trackOuter: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  barPct: {
    width: 36,
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 12,
    textAlign: 'right',
  },

  // Model breakdown
  modelsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariantAlpha10,
    paddingTop: 12,
    gap: 8,
  },
  modelsTitle: {
    fontFamily: fonts.lexendMedium,
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 2,
    marginBottom: 4,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modelName: {
    width: 72,
    fontFamily: fonts.lexendMedium,
    fontSize: 9,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  modelDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modelPcts: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 10,
    color: colors.onSurfaceVariant,
    marginLeft: 4,
  },
  dot: {},
});
