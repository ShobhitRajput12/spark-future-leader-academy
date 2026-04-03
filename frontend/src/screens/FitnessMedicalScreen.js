import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import GlowCard from '../components/GlowCard';
import Screen from '../components/Screen';
import { colors } from '../theme/colors';

const ITEMS = [
  { title: 'Running', subtitle: 'Build stamina with intervals and steady runs', icon: 'speedometer-outline', accent: colors.accentGreen },
  { title: 'Strength', subtitle: 'Push-ups • Pull-ups • Squats • Core training', icon: 'barbell-outline', accent: colors.accentOrange },
  { title: 'Flexibility', subtitle: 'Warm-up • Mobility • Injury prevention', icon: 'body-outline', accent: colors.accentPurple },
  { title: 'Medical Basics', subtitle: 'Vision • Hearing • Posture • General health', icon: 'medical-outline', accent: colors.accentBlue },
];

export default function FitnessMedicalScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={[colors.glass2, 'rgba(255,255,255,0.012)', 'transparent']}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.top}
        >
          <Text style={styles.title}>Fitness & Medical</Text>
          <Text style={styles.subtitle}>Stay Fit</Text>
        </LinearGradient>

        <View style={styles.list}>
          {ITEMS.map((i) => (
            <GlowCard
              key={i.title}
              title={i.title}
              subtitle={i.subtitle}
              accent={i.accent}
              right={<Ionicons name={i.icon} size={20} color={i.accent} />}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  top: {
    marginTop: 10,
    marginBottom: 10,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass2,
    shadowColor: '#000',
    shadowOpacity: 0.30,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: 0.25, includeFontPadding: false },
  subtitle: { marginTop: 6, color: colors.muted, fontSize: 13.5, fontWeight: '700', includeFontPadding: false },
  list: { gap: 12 },
});
