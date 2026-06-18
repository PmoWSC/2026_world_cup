import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/typography';

export default function GroupCard({ group, onPress }) {
  const topEntries = group.topMembers?.slice(0, 3) ?? [];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.groupName} numberOfLines={1}>
          {group.name}
        </Text>
        <View style={styles.competitionBadge}>
          <Text style={styles.competitionText}>{group.competition}</Text>
        </View>
      </View>

      <Text style={styles.memberCount}>
        {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
      </Text>

      {topEntries.length > 0 && (
        <View style={styles.miniLeaderboard}>
          {topEntries.map((entry, index) => (
            <View key={entry.userId ?? index} style={styles.miniRow}>
              <Text style={styles.miniRank}>{index + 1}</Text>
              <Text style={styles.miniName} numberOfLines={1}>
                {entry.displayName}
              </Text>
              <Text style={styles.miniPoints}>{entry.points}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  groupName: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 18,
    color: colors.onSurface,
    flex: 1,
    marginRight: 8,
  },
  competitionBadge: {
    backgroundColor: colors.primaryAlpha20,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  competitionText: {
    fontFamily: fonts.lexend,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.primary,
  },
  memberCount: {
    fontFamily: fonts.lexendLight,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginBottom: 10,
  },
  miniLeaderboard: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariantAlpha10,
    paddingTop: 8,
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  miniRank: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 13,
    color: colors.onSurfaceVariant,
    width: 20,
  },
  miniName: {
    fontFamily: fonts.lexend,
    fontSize: 13,
    color: colors.onSurface,
    flex: 1,
  },
  miniPoints: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 13,
    color: colors.primary,
  },
});
