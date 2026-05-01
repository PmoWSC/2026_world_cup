import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Share,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { colors, gradients } from '../../src/styles/colors';
import { fonts } from '../../src/styles/typography';

export default function InviteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { inviteCode } = useLocalSearchParams();

  const deepLink = `pulpo://polla/join/${inviteCode}`;
  const shareMessage = `Join my Pulpo Polla group! Use code: ${inviteCode}`;

  const handleCopyCode = async () => {
    try {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert(
        t('polla.copied', { defaultValue: 'Copied!' }),
        t('polla.code_copied', { defaultValue: 'Invite code copied to clipboard.' }),
      );
    } catch (_) {
      // fallback — ignore
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: shareMessage });
    } catch (_) {
      // user cancelled
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back */}
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.heading}>
          {t('polla.invite_friends', { defaultValue: 'Invite Friends' })}
        </Text>

        {/* Invite code display */}
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>
            {t('polla.invite_code', { defaultValue: 'INVITE CODE' })}
          </Text>
          <Text style={styles.codeText}>{inviteCode}</Text>
        </View>

        {/* Deep link */}
        <View style={styles.deepLinkContainer}>
          <Text style={styles.deepLinkLabel}>
            {t('polla.deep_link', { defaultValue: 'Deep Link' })}
          </Text>
          <Text style={styles.deepLinkText} selectable>
            {deepLink}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleCopyCode}
            style={({ pressed }) => [
              styles.copyButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="copy-outline" size={18} color={colors.onSurface} />
            <Text style={styles.copyButtonText}>
              {t('polla.copy_code', { defaultValue: 'Copy Code' })}
            </Text>
          </Pressable>

          <Pressable onPress={handleShare}>
            <LinearGradient
              colors={gradients.primaryToSecondary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareButton}
            >
              <Ionicons name="share-outline" size={18} color="#000000" />
              <Text style={styles.shareButtonText}>
                {t('polla.share', { defaultValue: 'Share' })}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  heading: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 28,
    color: colors.onSurface,
    letterSpacing: -0.5,
    marginBottom: 40,
    textAlign: 'center',
  },
  // --- Code ---
  codeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  codeLabel: {
    fontFamily: fonts.lexendMedium,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: colors.onSurfaceVariant,
    marginBottom: 10,
  },
  codeText: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 32,
    color: colors.primary,
    letterSpacing: 6,
  },
  // --- Deep link ---
  deepLinkContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  deepLinkLabel: {
    fontFamily: fonts.lexendMedium,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 3,
    color: colors.onSurfaceVariant,
    marginBottom: 6,
  },
  deepLinkText: {
    fontFamily: fonts.lexendLight,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  // --- Actions ---
  actions: {
    gap: 14,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 28,
    paddingVertical: 16,
    gap: 8,
  },
  pressed: {
    opacity: 0.75,
  },
  copyButtonText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 14,
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    paddingVertical: 16,
    gap: 8,
  },
  shareButtonText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 14,
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
