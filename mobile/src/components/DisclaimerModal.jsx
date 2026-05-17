import { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Image,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Localization from "expo-localization";
import * as Haptics from "expo-haptics";
import { colors, gradients } from "../styles/colors";
import { fonts } from "../styles/typography";
import enStrings from "../i18n/locales/en/translation.json";
import esStrings from "../i18n/locales/es/translation.json";

const PRIVACY_URL = "https://pulpo.white-systems.com/privacy";

// Per spec: EN if device locale is English, ES default for everything else.
function pickStrings() {
  const code = Localization.getLocales?.()[0]?.languageCode;
  return code === "en" ? enStrings.disclaimer : esStrings.disclaimer;
}

export default function DisclaimerModal({ onAccept }) {
  const t = pickStrings();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    if (accepting) return;
    setAccepting(true);
    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      await onAccept();
    } catch (e) {
      setAccepting(false);
    }
  };

  const openPrivacy = () => {
    Linking.openURL(PRIVACY_URL).catch(() => {
      // If the URL is unreachable (not yet hosted, no network), the OS shows
      // its own error dialog. We swallow the rejection here so the modal
      // does not crash.
    });
  };

  return (
    <Modal
      visible
      animationType="fade"
      presentationStyle="fullScreen"
      // Prevent Android hardware back from dismissing — accept is the only
      // exit. iOS modals at fullScreen do not support swipe-to-dismiss.
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Image
              source={require("../../assets/icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.body}>{t.intro}</Text>
            <Text style={styles.body}>{t.noBetting}</Text>
            <Text style={styles.body}>{t.noLiability}</Text>
            <Text style={styles.consent}>
              {t.consent}{" "}
              <Text style={styles.link} onPress={openPrivacy}>
                {t.privacyLink}
              </Text>
              .
            </Text>
          </View>
        </ScrollView>

        <View style={styles.ctaContainer}>
          <Pressable
            onPress={handleAccept}
            disabled={accepting}
            accessibilityRole="button"
            accessibilityLabel={t.acceptCta}
          >
            <LinearGradient
              colors={gradients.primaryToSecondary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cta, accepting && styles.ctaDisabled]}
            >
              {accepting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.ctaLabel}>{t.acceptCta}</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest, // #000000
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 600,
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 32,
    letterSpacing: -0.5,
    color: colors.onSurface,
    textAlign: "center",
    marginBottom: 24,
    textTransform: "uppercase",
  },
  body: {
    fontFamily: fonts.lexendLight,
    fontSize: 15,
    lineHeight: 24,
    color: colors.onSurface,
    opacity: 0.85,
    textAlign: "left",
    marginBottom: 18,
  },
  consent: {
    fontFamily: fonts.lexend,
    fontSize: 13,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: 8,
  },
  link: {
    color: colors.secondary, // #00e3fd
    textDecorationLine: "underline",
  },
  ctaContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.select({ ios: 40, android: 24, default: 24 }),
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
  },
  cta: {
    width: "100%",
    maxWidth: 600,
    minWidth: 240,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaLabel: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 16,
    letterSpacing: 1.5,
    color: "#000000",
    textTransform: "uppercase",
  },
});
