import { StyleSheet, View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../../styles/colors";

const LANGUAGES = [
  { code: "en", flag: "\ud83c\uddec\ud83c\udde7", name: "English" },
  { code: "es", flag: "\ud83c\uddea\ud83c\uddf8", name: "Espa\u00f1ol" },
  { code: "fr", flag: "\ud83c\uddeb\ud83c\uddf7", name: "Fran\u00e7ais" },
  { code: "pt", flag: "\ud83c\udde7\ud83c\uddf7", name: "Portugu\u00eas" },
  { code: "de", flag: "\ud83c\udde9\ud83c\uddea", name: "Deutsch" },
  { code: "it", flag: "\ud83c\uddee\ud83c\uddf9", name: "Italiano" },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
  };

  return (
    <View style={styles.container}>
      {LANGUAGES.map((lang) => {
        const isActive = currentLanguage === lang.code;
        return (
          <Pressable
            key={lang.code}
            style={[styles.row, isActive && styles.rowActive]}
            onPress={() => handleSelect(lang.code)}
          >
            <Text style={styles.flag}>{lang.flag}</Text>
            <Text style={[styles.name, isActive && styles.nameActive]}>
              {lang.name}
            </Text>
            {isActive && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerHigh,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  rowActive: {
    backgroundColor: colors.secondaryAlpha05,
  },
  flag: {
    fontSize: 22,
    marginRight: 16,
  },
  name: {
    fontFamily: "Lexend-Regular",
    fontSize: 15,
    color: colors.onSurface,
    flex: 1,
  },
  nameActive: {
    color: colors.secondary,
    fontFamily: "Lexend-Medium",
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
});
