import { StyleSheet, View, Text, Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import LanguageSelector from "../../src/components/shared/LanguageSelector";
import PoweredBySection from "../../src/components/shared/PoweredBySection";
import { useAuth } from "../../src/hooks/useAuth";
import { colors } from "../../src/styles/colors";
import { fonts } from "../../src/styles/typography";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleSignOut = () => {
    logout();
  };

  const handleSignIn = () => {
    router.push("/auth/login");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.header}>
          {t("settings.title", { defaultValue: "SETTINGS" })}
        </Text>
      </View>

      {/* Section 1: Language */}
      <Text style={styles.sectionLabel}>
        {t("settings.language", { defaultValue: "Language" })}
      </Text>
      <LanguageSelector />

      <View style={styles.divider} />

      {/* Section 2: Account */}
      <Text style={styles.sectionLabel}>
        {t("settings.account", { defaultValue: "Account" })}
      </Text>
      {isAuthenticated ? (
        <View style={styles.accountSection}>
          <Text style={styles.emailText}>{user?.email}</Text>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <Text style={styles.signOutText}>
              {t("settings.sign_out", { defaultValue: "Sign Out" })}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={handleSignIn}
          style={({ pressed }) => [pressed && styles.pressed]}
        >
          <Text style={styles.signInText}>
            {t("settings.sign_in", { defaultValue: "Sign In" })}
          </Text>
        </Pressable>
      )}

      <View style={styles.divider} />

      {/* Section 3: About */}
      <Text style={styles.sectionLabel}>
        {t("settings.about", { defaultValue: "About" })}
      </Text>
      <PoweredBySection />

      <View style={styles.divider} />

      {/* Section 4: App Info */}
      <Text style={styles.appVersion}>Pulpo.ai v1.0.0</Text>
      <Text style={styles.competitionMode}>Competition Mode: League Demo</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  backButton: {
    padding: 4,
  },
  backText: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 24,
    color: colors.primary,
    lineHeight: 28,
  },
  header: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 24,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  sectionLabel: {
    fontFamily: fonts.lexend,
    fontSize: 10,
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 3,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(72, 72, 72, 0.1)",
    marginVertical: 24,
  },
  accountSection: {
    gap: 12,
  },
  emailText: {
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.onSurface,
  },
  signOutText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 14,
    color: colors.error,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  signInText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 14,
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  appVersion: {
    fontFamily: fonts.lexendLight,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  competitionMode: {
    fontFamily: fonts.lexendLight,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
});
