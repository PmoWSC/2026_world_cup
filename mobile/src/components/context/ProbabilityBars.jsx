import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../styles/colors';
import { typography, fonts } from '../../styles/typography';

function AnimatedBar({ percentage, variant }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(percentage, { duration: 800 });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const renderFill = () => {
    if (variant === 'home') {
      return (
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.barFillInner}
        />
      );
    }
    if (variant === 'away') {
      return (
        <View
          style={[
            styles.barFillInner,
            { backgroundColor: colors.tertiaryAlpha80 },
          ]}
        />
      );
    }
    // draw
    return (
      <View
        style={[
          styles.barFillInner,
          { backgroundColor: colors.onSurfaceVariant },
        ]}
      />
    );
  };

  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, animatedStyle]}>
        {renderFill()}
      </Animated.View>
    </View>
  );
}

export default function ProbabilityBars({ data }) {
  if (!data) return null;

  const { homeTeam, awayTeam, homeWin, draw, awayWin, models } = data;

  const outcomes = [
    {
      label: homeTeam || 'Home',
      value: homeWin,
      color: colors.secondary,
      variant: 'home',
    },
    {
      label: 'Draw',
      value: draw,
      color: colors.onSurfaceVariant,
      variant: 'draw',
    },
    {
      label: awayTeam || 'Away',
      value: awayWin,
      color: colors.tertiary,
      variant: 'away',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MATCH PREDICTION</Text>

      {outcomes.map((outcome) => (
        <View key={outcome.variant} style={styles.outcomeRow}>
          <View style={styles.outcomeHeader}>
            <Text style={styles.outcomeLabel}>{outcome.label}</Text>
            <Text style={[styles.outcomeValue, { color: outcome.color }]}>
              {outcome.value}%
            </Text>
          </View>
          <AnimatedBar percentage={outcome.value} variant={outcome.variant} />
        </View>
      ))}

      {models && models.length > 0 && (
        <View style={styles.modelsContainer}>
          <Text style={styles.modelsTitle}>Model Breakdown</Text>
          {models.map((model, index) => (
            <Text key={index} style={styles.modelText}>
              {model.name}: {model.weight}% weight
              {model.prediction ? ` — ${model.prediction}` : ''}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.primaryFixed,
    marginBottom: 4,
  },
  outcomeRow: {
    gap: 6,
  },
  outcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outcomeLabel: {
    fontFamily: fonts.lexend,
    fontSize: 12,
    textTransform: 'uppercase',
    color: colors.onSurfaceVariant,
  },
  outcomeValue: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 20,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFillInner: {
    flex: 1,
    borderRadius: 3,
  },
  modelsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    gap: 4,
  },
  modelsTitle: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  modelText: {
    fontFamily: fonts.lexendLight,
    fontSize: 11,
    color: colors.outline,
  },
});
