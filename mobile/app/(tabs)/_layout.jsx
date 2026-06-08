import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../../src/styles/colors";

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // On Android the system nav (3-button or gesture pill) sits inside the
  // window. Without honoring insets.bottom the tab bar lives behind it and
  // the icons get clipped by the system buttons. iOS already had its own
  // hardcoded 28pt for the home indicator; keep that as a floor.
  const tabBarBottomPadding =
    Platform.OS === "ios" ? Math.max(28, insets.bottom) : Math.max(12, insets.bottom);
  const tabBarHeight =
    Platform.OS === "ios" ? 60 + Math.max(28, insets.bottom) : 56 + Math.max(12, insets.bottom);

  return (
    <Tabs
      screenListeners={{
        tabPress: () => Haptics.selectionAsync(),
      }}
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surfaceAlpha80,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 1,
          borderTopColor: colors.primaryAlpha10,
          paddingTop: 12,
          paddingBottom: tabBarBottomPadding,
          height: tabBarHeight,
          elevation: 0,
        },
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.whiteAlpha40,
        tabBarLabelStyle: {
          textTransform: "uppercase",
          fontSize: 10,
          letterSpacing: 3,
          fontFamily: "Lexend-Regular",
        },
        headerStyle: {
          backgroundColor: "#000000",
        },
        headerTintColor: "#ffffff",
        headerTitleStyle: {
          fontFamily: "SpaceGrotesk-Bold",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.chat").toUpperCase(),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="polla"
        options={{
          title: t("tabs.polla").toUpperCase(),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
