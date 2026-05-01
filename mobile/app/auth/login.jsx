import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../src/hooks/useAuth";
import { colors, gradients } from "../../src/styles/colors";
import { fonts, typography } from "../../src/styles/typography";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function handleLogin() {
    setError(null);
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
      router.back();
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Pulpo Avatar */}
        <Text style={styles.avatar}>{"\uD83D\uDC19"}</Text>

        {/* Title */}
        <Text style={styles.title}>Welcome Back</Text>

        {/* Error */}
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.onSurfaceVariant}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />

        {/* Password */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.onSurfaceVariant}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
        />

        {/* Sign In Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogin}
          disabled={isLoading}
          style={styles.buttonWrapper}
        >
          <LinearGradient
            colors={gradients.primaryToSecondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Create Account Link */}
        <TouchableOpacity
          onPress={() => router.push("/auth/register")}
          style={styles.linkWrapper}
        >
          <Text style={styles.linkText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  avatar: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    ...typography.displaySmall,
    color: colors.onSurface,
    marginBottom: 8,
  },
  error: {
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
  },
  input: {
    width: "100%",
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 16,
    fontFamily: fonts.lexend,
    fontSize: 16,
    color: colors.onSurface,
  },
  buttonWrapper: {
    width: "100%",
    marginTop: 8,
  },
  button: {
    width: "100%",
    borderRadius: 9999,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 16,
    color: colors.onSurface,
  },
  linkWrapper: {
    marginTop: 12,
  },
  linkText: {
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.primary,
  },
});
