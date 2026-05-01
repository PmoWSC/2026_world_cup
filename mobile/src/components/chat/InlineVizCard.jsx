import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import ProbabilityBars from '../predictions/ProbabilityBars';

export default function InlineVizCard({ visualization }) {
  if (!visualization) return null;

  const { type, data } = visualization;

  const renderContent = () => {
    switch (type) {
      case 'PROBABILITY_BARS':
        return <ProbabilityBars data={data} />;

      default:
        return <FallbackCard type={type} data={data} />;
    }
  };

  return (
    <View style={styles.wrapper}>
      {renderContent()}
    </View>
  );
}

function FallbackCard({ type, data }) {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackType}>{type}</Text>
      <Text style={styles.fallbackData} numberOfLines={8}>
        {JSON.stringify(data, null, 2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariantAlpha10,
    marginTop: 12,
  },
  fallback: {
    gap: 8,
  },
  fallbackType: {
    ...typography.labelSmall,
    color: colors.onSurfaceVariant,
  },
  fallbackData: {
    ...typography.bodySmall,
    color: colors.whiteAlpha80,
    fontFamily: 'monospace',
  },
});
