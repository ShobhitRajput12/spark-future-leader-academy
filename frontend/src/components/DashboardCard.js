import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';

export default function DashboardCard({
  title,
  subtitle,
  icon,
  accent = colors.accentBlue,
  badge,
  onPress,
  style,
  ambientSweep = false,
}) {
  const { width, height } = useWindowDimensions();
  const scale = useRef(new Animated.Value(1)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const [cardWidth, setCardWidth] = useState(0);

  const cardMinHeight = useMemo(() => {
    const v = Math.round(height * 0.228);
    return Math.min(214, Math.max(180, v));
  }, [height]);
  const cardPadding = useMemo(() => {
    const v = Math.round(height * 0.021);
    return Math.min(18, Math.max(16, v));
  }, [height]);
  const iconWrapSize = useMemo(() => {
    const v = Math.round(width * 0.092);
    return Math.min(52, Math.max(44, v));
  }, [width]);
  const iconWrapRadius = useMemo(() => {
    const v = Math.round(iconWrapSize * 0.33);
    return Math.min(16, Math.max(14, v));
  }, [iconWrapSize]);

  const gradientColors = useMemo(() => {
    return [withAlpha(accent, 0.45), withAlpha(accent, 0.02), 'rgba(255,255,255,0.02)'];
  }, [accent]);

  const sweepColor = useMemo(() => withAlpha(accent, 0.18), [accent]);
  const sweepEdge = useMemo(() => withAlpha(accent, 0.02), [accent]);

  useEffect(() => {
    if (!ambientSweep) return;
    sweep.setValue(0);
    const loop = Animated.loop(Animated.timing(sweep, { toValue: 1, duration: 3600, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [ambientSweep, sweep]);

  const sweepWidth = 190;
  const sweepTx = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-sweepWidth, (cardWidth || 320) + sweepWidth],
  });

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
          <View
            style={[styles.card, { minHeight: cardMinHeight, padding: cardPadding }]}
            onLayout={
              ambientSweep
                ? (e) => {
                    const w = e?.nativeEvent?.layout?.width || 0;
                    if (w && w !== cardWidth) setCardWidth(w);
                  }
                : undefined
            }
          >
            {ambientSweep ? (
              <View pointerEvents="none" style={styles.bgClip}>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.ambientSweep,
                    { width: sweepWidth, transform: [{ translateX: sweepTx }, { rotate: '-12deg' }] },
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', sweepEdge, sweepColor, sweepEdge, 'transparent']}
                    locations={[0, 0.28, 0.5, 0.72, 1]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
            ) : null}

            <View style={styles.content}>
              <View style={styles.row}>
                <View
                  style={[
                    styles.iconWrap,
                    {
                      backgroundColor: withAlpha(accent, 0.16),
                      height: iconWrapSize,
                      width: iconWrapSize,
                      borderRadius: iconWrapRadius,
                    },
                  ]}
                >
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
    backgroundColor: colors.glass2,
    shadowColor: '#000',
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  bgClip: { ...StyleSheet.absoluteFillObject, borderRadius: 17, overflow: 'hidden', zIndex: 0 },
  content: { position: 'relative', zIndex: 1 },
  ambientSweep: {
    position: 'absolute',
    left: 0,
    top: -34,
    bottom: -34,
    opacity: 0.64,
    zIndex: 0,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  title: { color: colors.text, fontWeight: '900', fontSize: 15, letterSpacing: 0.25 },
  subtitle: {
    color: 'rgba(244,247,255,0.78)',
    marginTop: 4,
    paddingLeft: 1,
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.glass,
  },
  badgeDot: { height: 7, width: 7, borderRadius: 999 },
  badgeText: { color: colors.text, fontWeight: '700', fontSize: 12 },
});
