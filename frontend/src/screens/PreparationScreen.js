import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import GlowCard from '../components/GlowCard';
import Screen from '../components/Screen';
import { colors } from '../theme/colors';

const ITEMS = [
  { title: 'Study Material', subtitle: 'Syllabus • Notes • Previous papers • Mock tests', icon: 'book-outline', accent: colors.accentBlue },
  { title: 'Strategy', subtitle: 'Timetable • Weak areas • Revision cycles', icon: 'analytics-outline', accent: colors.accentGreen },
  { title: 'SSB / Interview', subtitle: 'GTO • Psychology • PI • Confidence building', icon: 'people-outline', accent: colors.accentOrange },
  { title: 'Current Affairs', subtitle: 'Daily updates • Defence news • GK boosters', icon: 'newspaper-outline', accent: colors.accentPurple },
];

export default function PreparationScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <Text style={styles.subtitle}>Get Ready</Text>
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

