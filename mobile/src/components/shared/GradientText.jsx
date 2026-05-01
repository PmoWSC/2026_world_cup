import React from 'react';
import { Text } from 'react-native';
import { colors } from '../../styles/colors';

/**
 * GradientText — renders text with the primary color as a simple fallback.
 *
 * A full gradient-text implementation would use MaskedView + LinearGradient,
 * but since MaskedView availability varies across Expo setups, this keeps
 * things lightweight and consistent with the design system.
 *
 * Props:
 *   text    — the string to display
 *   style   — additional Text style overrides
 *   colors  — unused for now (reserved for future gradient implementation)
 */
export default function GradientText({ text, style, colors: _gradientColors }) {
  return (
    <Text style={[{ color: colors.primary }, style]}>
      {text}
    </Text>
  );
}
