import { StyleSheet, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import ChatPanel from "../../src/components/chat/ChatPanel";
import { colors } from "../../src/styles/colors";

export default function ChatScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "PULPO.AI",
      headerTitleStyle: {
        fontFamily: "SpaceGrotesk-Bold",
        fontSize: 20,
        color: colors.primary,
        letterSpacing: 1,
      },
      headerTitleAlign: "center",
      headerStyle: {
        backgroundColor: "#000000",
      },
      headerRight: () => (
        <Pressable
          onPress={() => router.push("/settings")}
          style={styles.headerButton}
        >
          <Ionicons name="settings-outline" size={22} color={colors.onSurfaceVariant} />
        </Pressable>
      ),
    });
  }, [navigation, router]);

  return (
    <View style={styles.container}>
      <ChatPanel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  headerButton: {
    marginRight: 16,
    padding: 4,
  },
});
