import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
        <LinearGradient
          colors={[colors.glass2, 'rgba(255,255,255,0.012)', 'transparent']}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.top}
        >
          <Text style={styles.title}>Choose Your Path</Text>
          <Text style={styles.subtitle}>Explore Opportunities</Text>
        </LinearGradient>

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
