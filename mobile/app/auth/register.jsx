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

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const passwordValid = password.length >= 8;

  async function handleRegister() {
    setError(null);
    if (!displayName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!passwordValid) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      await register(email.trim().toLowerCase(), password, displayName.trim());
      router.back();
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
        <Text style={styles.title}>Join Pulpo</Text>

        {/* Error */}
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Display Name */}
        <TextInput
          style={styles.input}
          placeholder="Display Name"
          placeholderTextColor={colors.onSurfaceVariant}
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          textContentType="name"
          autoComplete="name"
        />

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
          textContentType="newPassword"
          autoComplete="new-password"
        />

        {/* Password validation hint */}
        {password.length > 0 && (
          <Text
            style={[
              styles.hint,
              { color: passwordValid ? colors.tertiary : colors.onSurfaceVariant },
            ]}
          >
            {passwordValid
              ? "Password strength: OK"
              : `Minimum 8 characters (${password.length}/8)`}
          </Text>
        )}

        {/* Create Account Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleRegister}
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
              {isLoading ? "Creating Account..." : "Create Account"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign In Link */}
        <TouchableOpacity
          onPress={() => router.push("/auth/login")}
          style={styles.linkWrapper}
        >
          <Text style={styles.linkText}>
            Already have an account?{" "}
            <Text style={styles.linkTextBold}>Sign In</Text>
          </Text>
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
  hint: {
    fontFamily: fonts.lexend,
    fontSize: 12,
    alignSelf: "flex-start",
    marginTop: -8,
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
    color: colors.onSurfaceVariant,
  },
  linkTextBold: {
    fontFamily: fonts.lexendMedium,
    color: colors.primary,
  },
});
