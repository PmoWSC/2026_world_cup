import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { typography, fonts } from '../../styles/typography';

export default function FeaturedMatchup({ data }) {
  if (!data) return null;

  const { homeTeam, awayTeam, homeWin, awayWin, badge } = data;

  const badgeLabel = badge || 'LIVE MODEL UPDATE';
  const isRivalry = badge === 'RIVALRY FACTOR';
  const badgeColor = isRivalry ? colors.tertiary : colors.secondary;

  return (
    <View style={styles.container}>
      {/* Badge */}
      <View style={[styles.badge, { borderColor: badgeColor }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>
          {badgeLabel}
        </Text>
      </View>

      {/* Teams row */}
      <View style={styles.teamsRow}>
        {/* Home */}
        <View style={styles.teamCol}>
          <Text style={styles.teamName} numberOfLines={1}>
            {homeTeam}
          </Text>
          <Text style={[styles.winPct, { color: colors.secondary }]}>
            {homeWin}%
          </Text>
        </View>

        {/* VS divider */}
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>

        {/* Away */}
        <View style={styles.teamCol}>
          <Text style={styles.teamName} numberOfLines={1}>
            {awayTeam}
          </Text>
          <Text style={[styles.winPct, { color: colors.tertiary }]}>
            {awayWin}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 16,
    gap: 14,
    alignItems: 'center',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  badgeText: {
    fontFamily: fonts.lexend,
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  teamCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  teamName: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 18,
    color: colors.onSurface,
    textAlign: 'center',
  },
  winPct: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 28,
  },
  vsContainer: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 14,
    color: colors.secondary,
    letterSpacing: 2,
  },
});
