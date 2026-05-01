import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { fonts } from '../../styles/typography';

export default function InviteButton({ onInvite, onSearch }) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onInvite}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="link-outline" size={18} color={colors.onSurface} />
        <Text style={styles.buttonText}>Invite via Link</Text>
      </Pressable>

      <Pressable
        onPress={onSearch}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name="search-outline" size={18} color={colors.onSurface} />
        <Text style={styles.buttonText}>Search Users</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  pressed: {
    opacity: 0.75,
  },
  buttonText: {
    fontFamily: fonts.lexend,
    fontSize: 13,
    color: colors.onSurface,
  },
});
