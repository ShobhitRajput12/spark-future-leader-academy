import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';

export default function DashboardCard({ title, subtitle, icon, accent = colors.accentBlue, badge, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  const gradientColors = useMemo(() => {
    return [withAlpha(accent, 0.45), withAlpha(accent, 0.02), 'rgba(255,255,255,0.02)'];
  }, [accent]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 22, bounciness: 0 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 0 }).start()
      }
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Animated.View style={[styles.wrap, style, { transform: [{ scale }] }]}>
        <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.shell}>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: withAlpha(accent, 0.16) }]}>
                <Ionicons name={icon} size={22} color={accent} />
              </View>
              {badge ? (
                <View style={[styles.badge, { borderColor: withAlpha(accent, 0.35) }]}>
                  <View style={[styles.badgeDot, { backgroundColor: accent }]} />
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>

            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            <Text numberOfLines={2} style={styles.subtitle}>
              {subtitle}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
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
  pressed: { opacity: 0.98 },
  wrap: { borderRadius: 18 },
  shell: { borderRadius: 18, padding: 1 },
  card: {
    borderRadius: 17,
    backgroundColor: colors.card,
    padding: 14,
    minHeight: 122,
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  iconWrap: {
    height: 38,
    width: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },
  subtitle: { color: colors.muted, marginTop: 4, fontSize: 12.5, lineHeight: 17 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  badgeDot: { height: 7, width: 7, borderRadius: 999 },
  badgeText: { color: colors.text, fontWeight: '700', fontSize: 12 },
});

