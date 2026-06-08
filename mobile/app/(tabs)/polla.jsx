import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { GET_POLLA_GROUPS } from '../../src/apollo/queries';
import { colors, gradients } from '../../src/styles/colors';
import { fonts } from '../../src/styles/typography';
import PulpoAvatar from '../../src/components/chat/PulpoAvatar';
import GroupCard from '../../src/components/polla/GroupCard';
import EmptyPollaState from '../../src/components/shared/EmptyPollaState';

function LoginPrompt({ onSignIn, t }) {
  return (
    <View style={styles.loginContainer}>
      <PulpoAvatar size={64} />
      <Text style={styles.loginTitle}>
        {t('polla.sign_in_prompt', { defaultValue: 'Sign in to play Polla' })}
      </Text>
      <Pressable onPress={onSignIn}>
        <LinearGradient
          colors={gradients.primaryToSecondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.signInButton}
        >
          <Text style={styles.signInText}>
            {t('auth.sign_in', { defaultValue: 'Sign In' })}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function PollaScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const { data, loading, refetch } = useQuery(GET_POLLA_GROUPS, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  const groups = data?.myPollaGroups ?? [];

  const handleCreatePool = () => {
    router.push('/polla/create');
  };

  const handleJoinPool = () => {
    router.push('/polla/join');
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LoginPrompt
          onSignIn={() => router.push('/auth/login')}
          t={t}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('polla.my_pools', { defaultValue: 'MY POOLS' })}
        </Text>
      </View>

      {loading && groups.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : groups.length === 0 ? (
        <EmptyPollaState
          onCreatePool={handleCreatePool}
          onJoinPool={handleJoinPool}
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              onPress={() => router.push(`/polla/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={loading}
        />
      )}

      {/* Floating Action Button */}
      <Pressable
        onPress={() => router.push('/polla/create')}
        style={styles.fabWrapper}
      >
        <LinearGradient
          colors={gradients.primaryToSecondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // --- Header ---
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 24,
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  // --- List ---
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  // --- Loading ---
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // --- Login prompt ---
  loginContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  loginTitle: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 20,
    color: colors.onSurface,
    textAlign: 'center',
  },
  signInButton: {
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  signInText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 14,
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  // --- FAB ---
  fabWrapper: {
    position: 'absolute',
    bottom: 100,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabIcon: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 28,
    color: '#000000',
    lineHeight: 30,
  },
});
