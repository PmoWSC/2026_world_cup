import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GET_FIXTURE, GET_MY_BETS } from '../../../src/apollo/queries';
import { PLACE_BET } from '../../../src/apollo/mutations';

function TeamCrest({ url, name }) {
  if (url) {
    return <Image source={{ uri: url }} style={crestStyles.image} resizeMode="contain" />;
  }
  // Fallback: first 2 letters of team name as a monogram
  const initials = (name ?? '').trim().slice(0, 2).toUpperCase();
  return (
    <View style={crestStyles.placeholder}>
      <Text style={crestStyles.initials}>{initials}</Text>
    </View>
  );
}

const crestStyles = StyleSheet.create({
  image: {
    width: 56,
    height: 56,
    marginBottom: 8,
  },
  placeholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  initials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
import { colors, gradients } from '../../../src/styles/colors';
import { fonts } from '../../../src/styles/typography';
import ScoreStepper from '../../../src/components/polla/ScoreStepper';

function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!targetDate) return;

    const tick = () => {
      const now = Date.now();
      const target = typeof targetDate === 'number' ? targetDate : Number(targetDate);
      const diff = target - now;
      if (diff <= 0) {
        setRemaining('CLOSED');
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${hours}h ${mins}m`);
    };

    tick();
    intervalRef.current = setInterval(tick, 60000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [targetDate]);

  return remaining;
}

export default function BetScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groupId, fixtureId } = useLocalSearchParams();

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  // Fetch this specific fixture. Using GET_FIXTURE(id) avoids the prior
  // approach of pulling a list of 50 and hoping the one we want was in it.
  const { data: fixtureData } = useQuery(GET_FIXTURE, {
    variables: { id: fixtureId },
    fetchPolicy: 'cache-and-network',
    skip: !fixtureId,
  });
  const fixture = fixtureData?.fixture ?? {};
  const homeName = fixture.homeTeam?.name ?? 'Home';
  const awayName = fixture.awayTeam?.name ?? 'Away';
  const homeCrest = fixture.homeTeam?.crestUrl;
  const awayCrest = fixture.awayTeam?.crestUrl;

  const countdown = useCountdown(fixture.matchDate);

  const [placeBet, { loading }] = useMutation(PLACE_BET, {
    refetchQueries: [{ query: GET_MY_BETS, variables: { groupId } }],
  });

  const handleConfirm = async () => {
    try {
      await placeBet({
        variables: {
          groupId,
          betTypeSlug: 'match:exact_score',
          fixtureId,
          prediction: { home_score: homeScore, away_score: awayScore },
        },
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.back();
    } catch (err) {
      Alert.alert(
        t('polla.error', { defaultValue: 'Error' }),
        err.message ?? t('polla.bet_failed', { defaultValue: 'Could not place prediction.' }),
      );
    }
  };

  const isClosingSoon =
    fixture.matchDate && Number(fixture.matchDate) - Date.now() < 3600000 * 3;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
        </Pressable>

        {/* Fixture Header */}
        <View style={styles.fixtureHeader}>
          <View style={styles.teamBlock}>
            <TeamCrest url={homeCrest} name={homeName} />
            <Text style={styles.teamName} numberOfLines={2}>{homeName}</Text>
          </View>

          <Text style={styles.vsText}>VS</Text>

          <View style={styles.teamBlock}>
            <TeamCrest url={awayCrest} name={awayName} />
            <Text style={styles.teamName} numberOfLines={2}>{awayName}</Text>
          </View>
        </View>

        {/* Countdown badge */}
        {countdown ? (
          <View
            style={[
              styles.countdownBadge,
              isClosingSoon && styles.countdownUrgent,
            ]}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={isClosingSoon ? colors.error : colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.countdownText,
                isClosingSoon && styles.countdownTextUrgent,
              ]}
            >
              {countdown === 'CLOSED'
                ? t('polla.closed', { defaultValue: 'CLOSED' })
                : `${t('polla.closing_in', { defaultValue: 'CLOSING IN' })} ${countdown}`}
            </Text>
          </View>
        ) : null}

        {/* Score Steppers */}
        <View style={styles.steppersRow}>
          <ScoreStepper
            value={homeScore}
            onChange={setHomeScore}
            label={homeName}
          />
          <View style={styles.stepperDivider}>
            <Text style={styles.dashText}>-</Text>
          </View>
          <ScoreStepper
            value={awayScore}
            onChange={setAwayScore}
            label={awayName}
          />
        </View>

        {/* Confirm button */}
        <Pressable
          onPress={handleConfirm}
          disabled={loading || countdown === 'CLOSED'}
        >
          <LinearGradient
            colors={gradients.primaryToSecondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.confirmButton,
              (loading || countdown === 'CLOSED') && styles.confirmButtonDisabled,
            ]}
          >
            <Text style={styles.confirmButtonText}>
              {loading
                ? t('polla.confirming', { defaultValue: 'Confirming...' })
                : t('polla.confirm_prediction', { defaultValue: 'Confirm Prediction' })}
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 4,
    marginBottom: 16,
  },
  // --- Fixture Header ---
  fixtureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  teamBlock: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 18,
    color: colors.onSurface,
    textAlign: 'center',
  },
  vsText: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 16,
    color: colors.secondary,
    marginHorizontal: 16,
  },
  // --- Countdown ---
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    gap: 6,
    marginBottom: 32,
  },
  countdownUrgent: {
    backgroundColor: 'rgba(255, 110, 132, 0.15)',
  },
  countdownText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countdownTextUrgent: {
    color: colors.error,
  },
  // --- Steppers ---
  steppersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  stepperDivider: {
    paddingHorizontal: 12,
    paddingBottom: 28,
  },
  dashText: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 28,
    color: colors.onSurfaceVariant,
  },
  // --- Confirm ---
  confirmButton: {
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 15,
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
