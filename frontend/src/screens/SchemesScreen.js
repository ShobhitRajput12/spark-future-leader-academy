import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import GlowCard from '../components/GlowCard';
import Screen from '../components/Screen';
import { getApiBaseUrl } from '../services/ai';
import { colors } from '../theme/colors';

const GUIDED = [
  {
    title: '10th',
    subtitle: 'Guided AI plan after Class 10',
    accent: colors.accentOrange,
    icon: 'school-outline',
    initialPrompt: 'I am in 10th and want to join defence. How can I join the defence?',
  },
  {
    title: '12th',
    subtitle: 'Guided AI plan after Class 12',
    accent: colors.accentBlue,
    icon: 'book-outline',
    initialPrompt: 'I am in 12th and want to join defence. How can I join the defence?',
  },
  {
    title: 'Graduate',
    subtitle: 'Guided AI plan after Graduation',
    accent: colors.accentPurple,
    icon: 'ribbon-outline',
    initialPrompt: 'I am a graduate and want to join defence. How can I join the defence?',
  },
  {
    title: 'Postgraduate',
    subtitle: 'Guided AI plan after Postgraduation',
    accent: colors.accentGreen,
    icon: 'medal-outline',
    initialPrompt: 'I am a postgraduate and want to join defence. How can I join the defence?',
  },
];

export default function SchemesScreen({ navigation }) {
  const [schemes, setSchemes] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/schemes`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || data?.message || 'Failed to load schemes');
        if (alive) setSchemes(Array.isArray(data) ? data : data?.schemes || []);
      } catch (e) {
        if (alive) setError(e?.message || 'Failed to load schemes');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const routeNotFound = String(error || '').toLowerCase().includes('route not found');
  const showGuided = routeNotFound;

  const onBack = () => {
    if (navigation?.canGoBack?.()) return navigation.goBack();
    return navigation?.navigate?.('Home');
  };

  return (
    <Screen padded={false}>
      <View style={styles.navHeader}>
        <Pressable onPress={onBack} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text numberOfLines={1} style={styles.navTitle}>
          Entry Schemes
        </Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <Text style={styles.subtitle}>How to Join</Text>
        </View>

        {error && !routeNotFound ? (
          <View style={styles.note}>
            <Ionicons name="warning-outline" size={16} color={colors.accentOrange} />
            <Text style={styles.noteText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {(showGuided ? GUIDED : schemes || []).map((s) => {
            const title = showGuided ? s.title : s.name;
            const subtitle = showGuided ? s.subtitle : s.short;
            const accent = s.accent || colors.accentBlue;
            const icon = showGuided ? s.icon : s.icon || 'grid-outline';
            const initialPrompt = showGuided ? s.initialPrompt : null;

            if (showGuided) {
              return (
                <Pressable
                  key={title}
                  onPress={() =>
                    navigation?.navigate?.(
                      'AI Chat',
                      initialPrompt ? { initialPrompt, autoSend: true } : { autoSend: true }
                    )
                  }
                  style={({ pressed }) => (pressed ? styles.pressed : null)}
                >
                  <GlowCard
                    title={title}
                    subtitle={subtitle}
                    accent={accent}
                    right={<Ionicons name={icon} size={20} color={accent} />}
                  />
                </Pressable>
              );
            }

            return (
              <GlowCard
                key={s.id || s.name}
                title={title}
                subtitle={subtitle}
                accent={accent}
                right={<Ionicons name={icon} size={20} color={accent} />}
              />
            );
          })}
        </View>

        {!schemes && !error ? (
          <View style={styles.note}>
            <Ionicons name="cloud-download-outline" size={16} color={colors.muted} />
            <Text style={styles.noteText}>Loading schemes…</Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24 },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    backgroundColor: colors.glass2,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  navTitle: { color: colors.text, fontSize: 22, fontWeight: '900', flex: 1, minWidth: 0, includeFontPadding: false },
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
  title: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: 0.25 },
  subtitle: { marginTop: 6, color: colors.muted, fontSize: 13.5, fontWeight: '700', includeFontPadding: false },
  list: { gap: 12 },
  note: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
  },
  noteText: { flex: 1, color: colors.muted, fontWeight: '600', fontSize: 12.5, lineHeight: 17, includeFontPadding: false },
  pressed: { opacity: 0.92 },
});
