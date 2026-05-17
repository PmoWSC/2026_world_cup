import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ApolloProvider } from "@apollo/client";
import { client } from "../src/apollo/client";
import { useDisclaimer } from "../src/hooks/useDisclaimer";
import DisclaimerModal from "../src/components/DisclaimerModal";
import "../src/i18n/i18n";

// Fonts (Space Grotesk + Lexend) are bundled natively via the expo-font
// plugin in app.json. They are available from the first frame, so there is
// no async load, no SplashScreen gate, and no race that can block render.

export default function RootLayout() {
  const { loading: disclaimerLoading, accepted, accept } = useDisclaimer();

  // While reading SecureStore: the native splash stays up. Returning null
  // is fast (<10ms typically) and prevents a Stack mount that would have
  // to be unmounted right after if the user has not accepted yet.
  if (disclaimerLoading) {
    return null;
  }

  // First-launch gate. Apple Guideline 5.3 (Gaming/Gambling) compliance:
  // user must explicitly acknowledge that Pulpo.ai is not a betting platform
  // before any chat or polla feature becomes interactive.
  if (!accepted) {
    return <DisclaimerModal onAccept={accept} />;
  }

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
