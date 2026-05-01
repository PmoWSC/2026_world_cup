import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { colors, gradients } from '../../styles/colors';
import { fonts } from '../../styles/typography';

const BENEFITS = [
  { icon: '💬', text: '30 weekly questions — every week, automatically' },
  { icon: '🏆', text: 'Create Pollas and challenge your friends' },
  { icon: '📊', text: 'Full match predictions & model breakdowns' },
  { icon: '🔓', text: '100% free — no credit card needed' },
];

export default function RegistrationPromptModal({ visible, onDismiss }) {
  const router = useRouter();
  const bounce = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12, stiffness: 140 });
      bounce.value = withRepeat(
        withSequence(
          withTiming(-10, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    }
  }, [visible]);

  const pulpoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleRegister = () => {
    onDismiss();
    router.push('/auth/register');
  };

  const handleLogin = () => {
    onDismiss();
    router.push('/auth/login');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Pulpo */}
          <Animated.Text style={[styles.pulpoEmoji, pulpoStyle]}>
            🐙
          </Animated.Text>

          {/* Headline */}
          <Text style={styles.title}>You've used your 5 free questions!</Text>
          <Text style={styles.subtitle}>
            Pulpo wants to keep helping you win. Register free and get:
          </Text>

          {/* Benefits */}
          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b.text} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>{b.icon}</Text>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          {/* Primary CTA */}
          <Pressable onPress={handleRegister} style={styles.registerWrapper}>
            <LinearGradient
              colors={gradients.signature}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.registerButton}
            >
              <Text style={styles.registerText}>Register Free 🚀</Text>
            </LinearGradient>
          </Pressable>

          {/* Secondary CTA */}
          <Pressable onPress={handleLogin} style={styles.loginButton}>
            <Text style={styles.loginText}>I already have an account</Text>
          </Pressable>

          {/* Dismiss */}
          <Pressable onPress={onDismiss} style={styles.dismissButton}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryAlpha20,
  },

  // Pulpo
  pulpoEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },

  // Text
  title: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 20,
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  // Benefits
  benefits: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  benefitText: {
    flex: 1,
    fontFamily: fonts.lexendMedium,
    fontSize: 13,
    color: colors.onSurface,
    lineHeight: 18,
  },

  // Buttons
  registerWrapper: {
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  registerButton: {
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  registerText: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 15,
    color: '#000000',
    letterSpacing: 0.5,
  },
  loginButton: {
    paddingVertical: 10,
    marginBottom: 4,
  },
  loginText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
  },
  dismissButton: {
    paddingVertical: 8,
  },
  dismissText: {
    fontFamily: fonts.lexend,
    fontSize: 12,
    color: colors.outline,
    textAlign: 'center',
  },
});
