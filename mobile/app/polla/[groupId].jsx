import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GET_POLLA_GROUPS, GET_LEADERBOARD, GET_FIXTURES } from '../../src/apollo/queries';
import { colors } from '../../src/styles/colors';
import { fonts } from '../../src/styles/typography';
import LeaderboardList from '../../src/components/polla/LeaderboardList';

const TABS = ['Leaderboard', 'Upcoming'];

function SegmentControl({ tabs, activeTab, onTabPress }) {
  return (
    <View style={segmentStyles.container}>
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <Pressable
            key={tab}
            onPress={() => onTabPress(tab)}
            style={[
              segmentStyles.tab,
              isActive && segmentStyles.tabActive,
            ]}
          >
            <Text
              style={[
                segmentStyles.tabText,
                isActive && segmentStyles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const segmentStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.surfaceContainerHigh,
  },
  tabText: {
    fontFamily: fonts.lexend,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: colors.primary,
  },
});

function StatusBadge({ status }) {
  let icon = 'time-outline';
  let color = colors.onSurfaceVariant;
  if (status === 'won') {
    icon = 'checkmark-circle';
    color = colors.tertiary;
  } else if (status === 'lost') {
    icon = 'close-circle';
    color = colors.error;
  }
  return <Ionicons name={icon} size={18} color={color} />;
}

export default function GroupDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState('Leaderboard');

  // Fetch group info from cache (already loaded in list)
  const { data: groupsData } = useQuery(GET_POLLA_GROUPS, {
    fetchPolicy: 'cache-first',
  });
  const group = groupsData?.myPollaGroups?.find((g) => g.id === groupId) ?? {};

  // Leaderboard
  const { data: lbData, loading: lbLoading } = useQuery(GET_LEADERBOARD, {
    variables: { groupId },
    skip: activeTab !== 'Leaderboard',
  });
  const leaderboardEntries = (lbData?.pollaLeaderboard ?? []).map((entry) => ({
    rank: entry.rank,
    displayName: entry.displayName,
    avatarUrl: null,
    totalPoints: entry.points,
    exactPredictions: entry.correctPredictions,
  }));

  // Fixtures for upcoming
  const { data: fixturesData, loading: fixturesLoading } = useQuery(GET_FIXTURES, {
    variables: { competition: group.competition, status: 'SCHEDULED', limit: 20 },
    skip: activeTab !== 'Upcoming' || !group.competition,
  });
  const upcomingFixtures = fixturesData?.fixtures ?? [];

  // User bets -- placeholder array; replace with real query when available
  const userBets = [];

  const handleShare = async () => {
    try {
      const message = group.inviteCode
        ? `Join my Pulpo Polla group "${group.name}"! Use code: ${group.inviteCode}\npulpo://polla/join/${group.inviteCode}`
        : `Check out my Polla group "${group.name}" on Pulpo!`;
      await Share.share({ message });
    } catch (_) {
      // user cancelled
    }
  };

  const handleInvite = () => {
    if (group.inviteCode) {
      router.push({ pathname: '/polla/invite', params: { inviteCode: group.inviteCode } });
    }
  };

  const renderContent = () => {
    if (activeTab === 'Leaderboard') {
      if (lbLoading) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        );
      }
      return <LeaderboardList entries={leaderboardEntries} />;
    }

    if (activeTab === 'Upcoming') {
      if (fixturesLoading) {
        return (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        );
      }
      if (upcomingFixtures.length === 0) {
        return (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              {t('polla.no_upcoming', { defaultValue: 'No upcoming fixtures.' })}
            </Text>
          </View>
        );
      }
      return (
        <FlatList
          data={upcomingFixtures}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.fixtureList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: `/polla/${groupId}/bet`,
                  params: { fixtureId: item.id },
                })
              }
              style={({ pressed }) => [
                styles.fixtureCard,
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.fixtureTeams}>
                {item.homeTeam} vs {item.awayTeam}
              </Text>
              <Text style={styles.fixtureDate}>
                {item.matchDate ? new Date(Number(item.matchDate)).toLocaleDateString() : ''}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.onSurfaceVariant}
              />
            </Pressable>
          )}
        />
      );
    }

    // My Bets
    if (userBets.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {t('polla.no_bets', { defaultValue: 'No predictions yet.' })}
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        data={userBets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.fixtureList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.betRow}>
            <View style={styles.betInfo}>
              <Text style={styles.betMatch}>
                {item.homeTeam} vs {item.awayTeam}
              </Text>
              <Text style={styles.betPrediction}>{item.prediction}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        )}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.groupName} numberOfLines={1}>
            {group.name ?? ''}
          </Text>
          <View style={styles.headerMeta}>
            {group.memberCount != null && (
              <Text style={styles.memberCount}>
                {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
              </Text>
            )}
            {group.competition && (
              <View style={styles.compBadge}>
                <Text style={styles.compBadgeText}>{group.competition}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable onPress={handleInvite} style={styles.iconBtn}>
            <Ionicons name="person-add-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleShare} style={styles.iconBtn}>
            <Ionicons name="share-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Segment Control */}
      <SegmentControl
        tabs={TABS}
        activeTab={activeTab}
        onTabPress={setActiveTab}
      />

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.lexendLight,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
  },
  groupName: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 20,
    color: colors.onSurface,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  memberCount: {
    fontFamily: fonts.lexendLight,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  compBadge: {
    backgroundColor: colors.primaryAlpha20,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  compBadgeText: {
    fontFamily: fonts.lexend,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
  },
  // --- Content ---
  content: {
    flex: 1,
  },
  // --- Fixture list ---
  fixtureList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  fixtureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  fixtureTeams: {
    flex: 1,
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.onSurface,
  },
  fixtureDate: {
    fontFamily: fonts.lexendLight,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginRight: 8,
  },
  // --- Bets ---
  betRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  betInfo: {
    flex: 1,
  },
  betMatch: {
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.onSurface,
    marginBottom: 2,
  },
  betPrediction: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 13,
    color: colors.primary,
  },
});
