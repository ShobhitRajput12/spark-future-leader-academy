import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import GlowCard from '../components/GlowCard';
import Screen from '../components/Screen';
import { colors } from '../theme/colors';

const PLACEHOLDER = [
  { title: 'NDA: Form Window', subtitle: 'Track official notification dates and apply early.', accent: colors.accentOrange, icon: 'calendar-outline', url: 'https://upsc.gov.in/' },
  { title: 'CDS: Admit Card', subtitle: 'Keep your documents ready and verify your details.', accent: colors.accentBlue, icon: 'document-text-outline', url: 'https://upsc.gov.in/' },
  { title: 'AFCAT: Result', subtitle: 'Shortlist steps and AFSB preparation checklist.', accent: colors.accentPurple, icon: 'trophy-outline', url: 'https://afcat.cdac.in/' },
];

export default function AlertsUpdatesScreen() {
  const openWebpage = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Unable to open webpage');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open webpage');
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <Text style={styles.title}>Alerts & Updates</Text>
          <Text style={styles.subtitle}>New Updates</Text>
        </View>

        <View style={styles.list}>
          {PLACEHOLDER.map((a) => (
            <Pressable
              key={a.title}
              onPress={() => openWebpage(a.url)}
              android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
              style={({ pressed }) => (pressed ? styles.pressed : null)}
            >
              <GlowCard
                title={a.title}
                subtitle={a.subtitle}
                accent={a.accent}
                right={<Ionicons name={a.icon} size={20} color={a.accent} />}
              />
            </Pressable>
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
  pressed: { opacity: 0.92 },
});
