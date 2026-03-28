import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import GlowCard from '../components/GlowCard';
import Screen from '../components/Screen';
import { getApiBaseUrl } from '../services/ai';
import { colors } from '../theme/colors';

export default function SchemesScreen() {
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

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <Text style={styles.title}>Entry Schemes</Text>
          <Text style={styles.subtitle}>How to Join</Text>
        </View>

        {error ? (
          <View style={styles.note}>
            <Ionicons name="warning-outline" size={16} color={colors.accentOrange} />
            <Text style={styles.noteText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {(schemes || []).map((s) => (
            <GlowCard
              key={s.id || s.name}
              title={s.name}
              subtitle={s.short}
              accent={s.accent || colors.accentBlue}
              right={<Ionicons name={s.icon || 'grid-outline'} size={20} color={s.accent || colors.accentBlue} />}
            />
          ))}
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
  scroll: { paddingBottom: 24 },
  top: { paddingTop: 8, paddingBottom: 14 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  subtitle: { marginTop: 6, color: colors.muted, fontSize: 13.5, fontWeight: '700' },
  list: { gap: 12 },
  note: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  noteText: { flex: 1, color: colors.muted, fontWeight: '600', fontSize: 12.5, lineHeight: 17 },
});

