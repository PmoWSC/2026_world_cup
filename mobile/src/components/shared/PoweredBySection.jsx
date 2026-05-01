import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../../styles/colors';
import { fonts } from '../../styles/typography';

export default function PoweredBySection() {
  return (
    <View style={styles.container}>
      {/* Intelligence section */}
      <Text style={styles.tinyLabel}>INTELLIGENCE POWERED BY</Text>
      <View style={styles.partnersRow}>
        <Text style={styles.partnerText}>Claude AI</Text>
        <Text style={styles.separator}>{'\u00B7'}</Text>
        <Text style={styles.partnerText}>DigitalOcean</Text>
        <Text style={styles.separator}>{'\u00B7'}</Text>
        <Text style={styles.partnerText}>PostgreSQL</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Built by section */}
      <Text style={styles.tinyLabel}>BUILT BY</Text>
      <Text style={styles.wscBrand}>WSC</Text>
      <Text style={styles.wscFull}>White Systems Consulting</Text>

      {/* CTA */}
      <Text style={styles.ctaText}>
        Want something like this for your business?
      </Text>

      <Pressable>
        <LinearGradient
          colors={gradients.primaryToSecondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <Text style={styles.buttonText}>Contact WSC</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.surface,
  },
  tinyLabel: {
    fontFamily: fonts.lexend,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 4,
    color: colors.onSurfaceVariant,
    marginBottom: 8,
  },
  partnersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partnerText: {
    fontFamily: fonts.lexend,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  separator: {
    fontFamily: fonts.lexend,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: 'rgba(72, 72, 72, 0.2)',
    marginVertical: 20,
  },
  wscBrand: {
    fontFamily: fonts.spaceGroteskBold,
    fontSize: 18,
    color: colors.primary,
    marginTop: 4,
  },
  wscFull: {
    fontFamily: fonts.lexendLight,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  ctaText: {
    fontFamily: fonts.lexend,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  gradientButton: {
    borderRadius: 9999,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    fontFamily: fonts.lexendMedium,
    fontSize: 14,
    color: colors.onSurface,
    textAlign: 'center',
  },
});
