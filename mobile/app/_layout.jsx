import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ApolloProvider } from "@apollo/client";
import { client } from "../src/apollo/client";
import "../src/i18n/i18n";

// Fonts (Space Grotesk + Lexend) are bundled natively via the expo-font
// plugin in app.json. They are available from the first frame, so there is
// no async load, no SplashScreen gate, and no race that can block render.

export default function RootLayout() {
  return (
    <ApolloProvider client={client}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings/index" options={{ presentation: "modal" }} />
        <Stack.Screen name="auth/login" options={{ presentation: "modal" }} />
        <Stack.Screen name="auth/register" options={{ presentation: "modal" }} />
      </Stack>
      <StatusBar style="light" />
    </ApolloProvider>
  );
}
