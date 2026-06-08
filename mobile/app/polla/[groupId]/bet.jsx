import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GET_FIXTURES } from '../../../src/apollo/queries';
import { PLACE_BET } from '../../../src/apollo/mutations';
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

  // Fetch fixture details
  const { data: fixturesData } = useQuery(GET_FIXTURES, {
    variables: { limit: 50 },
    fetchPolicy: 'cache-first',
  });
  const fixture = fixturesData?.fixtures?.find((f) => f.id === fixtureId) ?? {};

  const countdown = useCountdown(fixture.matchDate);

  const [placeBet, { loading }] = useMutation(PLACE_BET);

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
            <Text style={styles.teamName}>{fixture.homeTeam?.name ?? fixture.homeTeam ?? 'Home'}</Text>
          </View>

          <Text style={styles.vsText}>VS</Text>

          <View style={styles.teamBlock}>
            <Text style={styles.teamName}>{fixture.awayTeam?.name ?? fixture.awayTeam ?? 'Away'}</Text>
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
            label={fixture.homeTeam?.name ?? fixture.homeTeam ?? 'Home'}
          />
          <View style={styles.stepperDivider}>
            <Text style={styles.dashText}>-</Text>
          </View>
          <ScoreStepper
            value={awayScore}
            onChange={setAwayScore}
            label={fixture.awayTeam?.name ?? fixture.awayTeam ?? 'Away'}
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
