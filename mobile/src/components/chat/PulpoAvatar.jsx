import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../styles/colors';

export default function PulpoAvatar({ size = 24 }) {
  const emojiSize = size * 0.6;

  return (
    <LinearGradient
      colors={gradients.primaryToSecondary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={{ fontSize: emojiSize, lineHeight: emojiSize * 1.2 }}>
        {'\uD83D\uDC19'}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
