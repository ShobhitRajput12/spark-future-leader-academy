import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import GlowCard from '../components/GlowCard';
import Screen from '../components/Screen';
import { colors } from '../theme/colors';

const PLACEHOLDER = [
  { title: 'NDA: Form Window', subtitle: 'Track official notification dates and apply early.', accent: colors.accentOrange, icon: 'calendar-outline' },
  { title: 'CDS: Admit Card', subtitle: 'Keep your documents ready and verify your details.', accent: colors.accentBlue, icon: 'document-text-outline' },
  { title: 'AFCAT: Result', subtitle: 'Shortlist steps and AFSB preparation checklist.', accent: colors.accentPurple, icon: 'trophy-outline' },
];

export default function AlertsUpdatesScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <Text style={styles.title}>Alerts & Updates</Text>
          <Text style={styles.subtitle}>New Updates</Text>
        </View>

        <View style={styles.list}>
          {PLACEHOLDER.map((a) => (
            <GlowCard
              key={a.title}
              title={a.title}
              subtitle={a.subtitle}
              accent={a.accent}
              right={<Ionicons name={a.icon} size={20} color={a.accent} />}
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

