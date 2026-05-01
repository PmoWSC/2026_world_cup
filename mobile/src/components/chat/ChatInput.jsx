import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { colors, gradients } from '../../styles/colors';
import { fonts } from '../../styles/typography';

function PlusIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 3v10M3 8h10"
        stroke={colors.onSurfaceVariant}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ArrowUpIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19V5m0 0l-7 7m7-7l7 7"
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ChatInput({ onSubmit }) {
  const [text, setText] = useState('');
  const isEmpty = text.trim().length === 0;

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit?.(trimmed);
    setText('');
  }, [text, onSubmit]);

  return (
    <View style={styles.outerGlow}>
      <View style={styles.inner}>
        {/* Plus button */}
        <Pressable style={styles.plusButton}>
          <PlusIcon />
        </Pressable>

        {/* Text input */}
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Ask Pulpo..."
          placeholderTextColor={colors.onSurfaceVariant}
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />

        {/* Send button */}
        <Pressable
          onPress={handleSend}
          disabled={isEmpty}
          style={[styles.sendButton, isEmpty && styles.sendButtonDisabled]}
        >
          <LinearGradient
            colors={gradients.primaryToSecondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sendGradient}
          >
            <ArrowUpIcon />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerGlow: {
    marginHorizontal: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  inner: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'transparent',
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.onSurface,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    maxHeight: 80,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
