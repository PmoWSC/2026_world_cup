import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JOIN_POLLA_GROUP } from '../../src/apollo/mutations';
import { GET_POLLA_GROUPS } from '../../src/apollo/queries';
import { colors, gradients } from '../../src/styles/colors';
import { fonts } from '../../src/styles/typography';

export default function JoinPollaScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [code, setCode] = useState('');

  // Prefill from deep link / share link if provided as ?code=...
  useEffect(() => {
    if (params.code && typeof params.code === 'string') {
      setCode(params.code.toUpperCase());
    }
  }, [params.code]);

  const [joinGroup, { loading }] = useMutation(JOIN_POLLA_GROUP, {
    refetchQueries: [{ query: GET_POLLA_GROUPS }],
  });

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert(
        t('polla.error', { defaultValue: 'Error' }),
        t('polla.code_required', { defaultValue: 'Please enter an invite code.' }),
      );
      return;
    }

    try {
      const { data } = await joinGroup({ variables: { inviteCode: trimmed } });
      const joined = data?.joinPollaGroup;
      if (joined?.id) {
        router.replace(`/polla/${joined.id}`);
      }
    } catch (err) {
      Alert.alert(
        t('polla.error', { defaultValue: 'Error' }),
        err.message ?? t('polla.join_failed', { defaultValue: 'Could not join group.' }),
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>{'< Back'}</Text>
      </Pressable>

      <Text style={styles.title}>
        {t('polla.join_pool', { defaultValue: 'Join Pool' })}
      </Text>

      <Text style={styles.subtitle}>
        {t('polla.join_pool_subtitle', {
          defaultValue: 'Enter the invite code you received from your friend.',
        })}
      </Text>

      <Text style={styles.inputLabel}>
        {t('polla.invite_code', { defaultValue: 'Invite Code' })}
      </Text>
      <TextInput
        style={styles.textInput}
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="ABCD1234"
        placeholderTextColor={colors.outline}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        autoFocus
        maxLength={16}
      />

      <Pressable onPress={handleJoin} disabled={loading}>
        <LinearGradient
          colors={gradients.primaryToSecondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.joinButton, loading && styles.joinButtonDisabled]}
        >
          <Text style={styles.joinButtonText}>
            {loading
              ? t('polla.joining', { defaultValue: 'Joining...' })
              : t('polla.join', { defaultValue: 'Join' })}
          </Text>
        </LinearGradient>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 28,
    color: colors.onSurface,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginBottom: 28,
    lineHeight: 20,
  },
  inputLabel: {
    fontFamily: fonts.lexendMedium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.onSurfaceVariant,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: fonts.lexend,
    fontSize: 18,
    letterSpacing: 4,
    color: colors.onSurface,
    marginBottom: 28,
  },
  joinButton: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 15,
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
