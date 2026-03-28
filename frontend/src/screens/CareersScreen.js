import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import GlowCard from '../components/GlowCard';
import Screen from '../components/Screen';
import { colors } from '../theme/colors';

const CAREERS = [
  { title: 'Army', subtitle: 'Leadership • Ground operations • Technical branches', icon: 'walk-outline', accent: colors.accentGreen },
  { title: 'Navy', subtitle: 'Ships • Submarines • Naval aviation • Engineering', icon: 'boat-outline', accent: colors.accentBlue },
  { title: 'Air Force', subtitle: 'Flying • Technical • Ground duty • Space & cyber', icon: 'airplane-outline', accent: colors.accentOrange },
];

export default function CareersScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <Text style={styles.title}>Choose Your Path</Text>
          <Text style={styles.subtitle}>Explore Opportunities</Text>
        </View>

        <View style={styles.list}>
          {CAREERS.map((c) => (
            <GlowCard
              key={c.title}
              title={c.title}
              subtitle={c.subtitle}
              accent={c.accent}
              right={<Ionicons name={c.icon} size={20} color={c.accent} />}
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

