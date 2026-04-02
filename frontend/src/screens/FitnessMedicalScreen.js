import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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
        <View style={styles.top}>
          <Text style={styles.subtitle}>Stay Fit</Text>
        </View>

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
  top: { paddingTop: 8, paddingBottom: 14 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  subtitle: { marginTop: 6, color: colors.muted, fontSize: 13.5, fontWeight: '700' },
  list: { gap: 12 },
});

