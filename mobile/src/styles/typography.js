import { Platform } from "react-native";

export const fonts = {
  spaceGrotesk: Platform.select({
    ios: "SpaceGrotesk-Regular",
    android: "SpaceGrotesk-Regular",
    default: "SpaceGrotesk-Regular",
  }),
  spaceGroteskBold: Platform.select({
    ios: "SpaceGrotesk-Bold",
    android: "SpaceGrotesk-Bold",
    default: "SpaceGrotesk-Bold",
  }),
  lexendLight: "Lexend-Light",
  lexend: "Lexend-Regular",
  lexendMedium: "Lexend-Medium",
  system: Platform.select({
    web: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    ios: "Helvetica Neue",
    android: "Roboto",
    default: "System",
  }),
};

export const typography = {
  // Display / Hero (Space Grotesk)
  displayLarge: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 48,
    letterSpacing: -1,
    textTransform: "uppercase",
  },
  displayMedium: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 36,
    letterSpacing: -0.5,
  },
  displaySmall: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 28,
    letterSpacing: -0.5,
  },

  // Headlines (Space Grotesk)
  headlineLarge: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 24,
    letterSpacing: -0.3,
    textTransform: "uppercase",
  },
  headlineMedium: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 20,
    letterSpacing: -0.2,
  },
  headlineSmall: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 16,
  },

  // Data values (Space Grotesk)
  dataLarge: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 20,
  },
  dataSmall: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 14,
  },

  // Body (Lexend)
  bodyLarge: {
    fontFamily: fonts.lexendLight,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fonts.lexend,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: fonts.lexendLight,
    fontSize: 12,
    lineHeight: 18,
  },

  // Labels (Lexend)
  labelLarge: {
    fontFamily: fonts.lexendMedium,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  labelSmall: {
    fontFamily: fonts.lexend,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  labelTiny: {
    fontFamily: fonts.lexend,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 4,
  },

  // Chat specific
  chatUser: {
    fontFamily: fonts.system,
    fontSize: 16,
    lineHeight: 24,
  },
  chatPulpo: {
    fontFamily: fonts.system,
    fontSize: 16,
    lineHeight: 26,
  },

  // Chips
  chip: {
    fontFamily: fonts.lexend,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
};
