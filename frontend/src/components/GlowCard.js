import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';

export default function GlowCard({ title, subtitle, accent = colors.accentBlue, right, children }) {
  return (
    <LinearGradient
      colors={[withAlpha(accent, 0.26), colors.glass2, colors.glass2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.shell}
    >
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.texts}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
        {children ? <View style={styles.body}>{children}</View> : null}
      </View>
    </LinearGradient>
  );
}

function withAlpha(hex, alpha) {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  shell: { borderRadius: 18, padding: 1 },
  card: {
    borderRadius: 17,
    backgroundColor: colors.glass2,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: '#000',
    shadowOpacity: 0.36,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  texts: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontWeight: '900', fontSize: 15, letterSpacing: 0.25, includeFontPadding: false },
  subtitle: { marginTop: 5, color: colors.muted, fontWeight: '700', fontSize: 12.5, lineHeight: 17, includeFontPadding: false },
  right: { alignItems: 'flex-end', justifyContent: 'center' },
  body: { marginTop: 12 },
});
