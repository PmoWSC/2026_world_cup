import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ApolloProvider } from "@apollo/client";
import { client } from "../src/apollo/client";
import { useDisclaimer } from "../src/hooks/useDisclaimer";
import { useAuthStore } from "../src/store/authStore";
import { useChatStore } from "../src/store/chatStore";
import DisclaimerModal from "../src/components/DisclaimerModal";
import "../src/i18n/i18n";

// Fonts (Space Grotesk + Lexend) are bundled natively via the expo-font
// plugin in app.json. They are available from the first frame, so there is
// no async load, no SplashScreen gate, and no race that can block render.

export default function RootLayout() {
  const { loading: disclaimerLoading, accepted, accept } = useDisclaimer();
  const authHydrated = useAuthStore((s) => s.hydrated);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const chatHydrated = useChatStore((s) => s.hydrated);
  const hydrateChat = useChatStore((s) => s.hydrate);

  // Restore auth (token + refreshToken + user) and the persistent sessionId
  // from SecureStore on cold start. Without these, every app launch reset
  // both the login AND the anonymous rate-limit counter — so closing/
  // reopening the app gave the user 5 fresh free questions.
  useEffect(() => {
    hydrateAuth();
    hydrateChat();
  }, [hydrateAuth, hydrateChat]);

  // While reading SecureStore (disclaimer + auth + chat session): the
  // native splash stays up. Returning null is fast (<10ms typically) and
  // prevents a Stack mount that would have to be unmounted right after.
  if (disclaimerLoading || !authHydrated || !chatHydrated) {
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
