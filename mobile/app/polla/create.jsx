import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CREATE_POLLA_GROUP } from '../../src/apollo/mutations';
import { GET_POLLA_GROUPS } from '../../src/apollo/queries';
import { colors, gradients } from '../../src/styles/colors';
import { fonts } from '../../src/styles/typography';

const COMPETITIONS = [
  { id: 'la_liga_2025', label: 'La Liga' },
  { id: 'premier_league_2025', label: 'Premier League' },
  { id: 'libertadores_2026', label: 'Copa Libertadores' },
];

export default function CreatePollaScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [groupName, setGroupName] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState(null);

  const [createGroup, { loading }] = useMutation(CREATE_POLLA_GROUP, {
    refetchQueries: [{ query: GET_POLLA_GROUPS }],
  });

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert(
        t('polla.error', { defaultValue: 'Error' }),
        t('polla.name_required', { defaultValue: 'Please enter a group name.' }),
      );
      return;
    }
    if (!selectedCompetition) {
      Alert.alert(
        t('polla.error', { defaultValue: 'Error' }),
        t('polla.competition_required', {
          defaultValue: 'Please select a competition.',
        }),
      );
      return;
    }

    try {
      const { data } = await createGroup({
        variables: {
          name: groupName.trim(),
          competition: selectedCompetition,
        },
      });
      const newGroup = data?.createPollaGroup;
      if (newGroup?.id) {
        router.replace(`/polla/${newGroup.id}`);
      }
    } catch (err) {
      Alert.alert(
        t('polla.error', { defaultValue: 'Error' }),
        err.message ?? t('polla.create_failed', { defaultValue: 'Could not create group.' }),
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </Pressable>

        <Text style={styles.title}>
          {t('polla.create_pool', { defaultValue: 'Create Pool' })}
        </Text>

        {/* Group Name */}
        <Text style={styles.inputLabel}>
          {t('polla.group_name', { defaultValue: 'Group Name' })}
        </Text>
        <TextInput
          style={styles.textInput}
          value={groupName}
          onChangeText={setGroupName}
          placeholder={t('polla.group_name_placeholder', {
            defaultValue: 'e.g. Office Pool 2026',
          })}
          placeholderTextColor={colors.outline}
          maxLength={50}
          autoCorrect={false}
        />

        {/* Competition Picker */}
        <Text style={styles.inputLabel}>
          {t('polla.competition', { defaultValue: 'Competition' })}
        </Text>
        <View style={styles.competitionRow}>
          {COMPETITIONS.map((comp) => {
            const isSelected = selectedCompetition === comp.id;
            return (
              <Pressable
                key={comp.id}
                onPress={() => setSelectedCompetition(comp.id)}
                style={[
                  styles.competitionCard,
                  isSelected && styles.competitionCardSelected,
                ]}
              >
                <Text
                  style={[
                    styles.competitionLabel,
                    isSelected && styles.competitionLabelSelected,
                  ]}
                >
                  {comp.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Create Button */}
        <Pressable onPress={handleCreate} disabled={loading}>
          <LinearGradient
            colors={gradients.primaryToSecondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.createButton, loading && styles.createButtonDisabled]}
          >
            <Text style={styles.createButtonText}>
              {loading
                ? t('polla.creating', { defaultValue: 'Creating...' })
                : t('polla.create_pool', { defaultValue: 'Create Pool' })}
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 28,
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
    fontSize: 16,
    color: colors.onSurface,
    marginBottom: 24,
  },
  competitionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 36,
  },
  competitionCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  competitionCardSelected: {
    borderColor: colors.primary,
  },
  competitionLabel: {
    fontFamily: fonts.lexendMedium,
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  competitionLabelSelected: {
    color: colors.primary,
  },
  createButton: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 15,
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
