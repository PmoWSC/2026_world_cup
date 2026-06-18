import React from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/typography';

function LeaderboardRow({ item }) {
  const isFirst = item.rank === 1;
  const isSecond = item.rank === 2;

  return (
    <View
      style={[
        styles.row,
        isFirst && styles.rowFirst,
        isSecond && styles.rowSecond,
      ]}
    >
      <Text
        style={[
          styles.rank,
          isFirst && styles.rankFirst,
        ]}
      >
        {item.rank}
      </Text>

      {item.avatarUrl ? (
        <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {item.displayName?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
      )}

      <View style={styles.nameContainer}>
        <Text style={styles.displayName} numberOfLines={1}>
          {item.displayName}
        </Text>
        {item.exactPredictions != null && (
          <Text style={styles.exactLabel}>
            {item.exactPredictions} exact
          </Text>
        )}
      </View>

      <View style={styles.pointsContainer}>
        <Text
          style={[
            styles.points,
            isFirst && styles.pointsFirst,
          ]}
        >
          {item.totalPoints}
        </Text>
        <Text style={styles.ptsLabel}>PTS</Text>
      </View>
    </View>
  );
}

export default function LeaderboardList({ entries }) {
  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => String(item.rank) + (item.displayName ?? '')}
      renderItem={({ item }) => <LeaderboardRow item={item} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(72, 72, 72, 0.1)',
  },
  rowFirst: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  rowSecond: {
    backgroundColor: colors.primaryAlpha10,
  },
  rank: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 16,
    color: colors.onSurfaceVariant,
    width: 32,
    textAlign: 'center',
  },
  rankFirst: {
    color: colors.tertiary,
    fontSize: 18,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitial: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  displayName: {
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.onSurface,
  },
  exactLabel: {
    fontFamily: fonts.lexendLight,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 16,
    color: colors.onSurface,
  },
  pointsFirst: {
    color: colors.tertiary,
  },
  ptsLabel: {
    fontFamily: fonts.lexend,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
});
