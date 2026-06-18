import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../../styles/colors';
import { typography } from '../../styles/typography';
import PulpoAvatar from './PulpoAvatar';
import InlineVizCard from './InlineVizCard';

export default function MessageBubble({ message }) {
  const { role, content, visualization } = message;
  const isUser = role === 'user';

  if (isUser) {
    return (
      <View style={styles.userContainer}>
        <Text style={styles.userLabel}>STRATEGIST NODE 01</Text>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{content}</Text>
        </View>
      </View>
    );
  }

  // Assistant / Pulpo message
  return (
    <View style={styles.assistantContainer}>
      <View style={styles.assistantHeader}>
        <PulpoAvatar size={24} />
        <Text style={styles.assistantLabel}>PULPO INTELLIGENCE</Text>
      </View>
      <View style={styles.assistantBody}>
        <Text style={styles.assistantText}>{content}</Text>
        {visualization && <InlineVizCard visualization={visualization} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // User message styles
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    maxWidth: '85%',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  userLabel: {
    ...typography.labelTiny,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 16,
    borderLeftWidth: 2,
    borderLeftColor: colors.primaryAlpha20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  userText: {
    ...typography.chatUser,
    color: colors.whiteAlpha90,
  },

  // Assistant / Pulpo message styles
  assistantContainer: {
    alignSelf: 'flex-start',
    maxWidth: '95%',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  assistantLabel: {
    ...typography.labelSmall,
    color: colors.secondary,
    fontWeight: '700',
    fontSize: 10,
  },
  assistantBody: {
    borderLeftWidth: 2,
    borderLeftColor: colors.secondaryAlpha30,
    paddingLeft: 16,
    marginLeft: 12,
  },
  assistantText: {
    ...typography.chatPulpo,
    color: colors.whiteAlpha80,
  },
});
