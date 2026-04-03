import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme/colors';

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export default function DashboardCard({
  title,
  subtitle,
  icon,
  accent = colors.accentBlue,
  badge,
  onPress,
  style,
  height: heightOverride,
  ambientSweep = false,
}) {
  const { width, height: screenH } = useWindowDimensions();
  const scale = useRef(new Animated.Value(1)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const [cardWidth, setCardWidth] = useState(0);

  const wScale = useMemo(() => clamp(width / 390, 0.85, 1.2), [width]);

  const cardMinHeight = useMemo(() => {
    const v = Math.round(screenH * 0.228 * wScale);
    return clamp(v, 140, 240);
  }, [screenH, wScale]);

  const cardH = useMemo(() => {
    const provided = typeof heightOverride === 'number' && Number.isFinite(heightOverride);
    if (!provided) return cardMinHeight;
    return Math.max(0, Math.floor(heightOverride));
  }, [cardMinHeight, heightOverride]);

  const hScale = useMemo(() => clamp(cardH / 200, 0.72, 1.1), [cardH]);
  const uiScale = useMemo(() => Math.min(wScale, hScale), [hScale, wScale]);

  const cardPadding = useMemo(() => {
    if (!cardH) return 0;
    const v = Math.round(cardH * 0.11);
    return clamp(v, 6, 20);
  }, [cardH]);

  const iconWrapSize = useMemo(() => {
    const base = Math.round(width * 0.092 * uiScale);
    const maxByCard = Math.round(cardH * 0.28);
    return clamp(base, 34, Math.min(52, maxByCard));
  }, [cardH, uiScale, width]);

  const iconWrapRadius = useMemo(() => {
    const v = Math.round(iconWrapSize * 0.33);
    return clamp(v, 12, 18);
  }, [iconWrapSize]);

  const radii = useMemo(() => {
    const wrapRadius = clamp(Math.round(18 * uiScale), 16, 22);
    const shellRadius = wrapRadius;
    const cardRadius = clamp(wrapRadius - 1, 15, 21);
    return { wrapRadius, shellRadius, cardRadius };
  }, [uiScale]);

  const iconSize = useMemo(() => clamp(Math.round(22 * uiScale), 18, 26), [uiScale]);
  const rowMarginBottom = useMemo(() => clamp(Math.round(10 * uiScale), 6, 12), [uiScale]);
  const titleFontSize = useMemo(() => clamp(Math.round(15 * uiScale), 12, 18), [uiScale]);
  const subtitleFontSize = useMemo(() => clamp(Math.round(12.5 * uiScale), 10, 15), [uiScale]);
  const subtitleLineHeight = useMemo(() => clamp(Math.round(17 * uiScale), 13, 20), [uiScale]);
  const subtitleTop = useMemo(() => clamp(Math.round(4 * uiScale), 2, 7), [uiScale]);

  const badgeFontSize = useMemo(() => clamp(Math.round(12 * uiScale), 10, 14), [uiScale]);
  const badgePadH = useMemo(() => clamp(Math.round(10 * uiScale), 7, 12), [uiScale]);
  const badgePadV = useMemo(() => clamp(Math.round(6 * uiScale), 4, 8), [uiScale]);
  const badgeDotSize = useMemo(() => clamp(Math.round(7 * uiScale), 5, 8), [uiScale]);

  const gradientColors = useMemo(() => {
    return [withAlpha(accent, 0.45), withAlpha(accent, 0.02), 'rgba(255,255,255,0.02)'];
  }, [accent]);

  const sweepColor = useMemo(() => withAlpha(accent, 0.18), [accent]);
  const sweepEdge = useMemo(() => withAlpha(accent, 0.02), [accent]);

  useEffect(() => {
    if (!ambientSweep) return;
    let cancelled = false;
    let sweepAnim = null;
    const runSweep = () => {
      if (cancelled) return;
      sweep.setValue(0);
      sweepAnim = Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 3600, useNativeDriver: true }),
        Animated.delay(5000),
      ]);
      sweepAnim.start(({ finished }) => {
        if (finished && !cancelled) runSweep();
      });
    };

    runSweep();
    return () => {
      cancelled = true;
      sweepAnim?.stop?.();
    };
  }, [ambientSweep, sweep]);

  const sweepWidth = useMemo(() => clamp(Math.round(width * 0.52), 160, 220), [width]);
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
      <Animated.View style={[styles.wrap, { borderRadius: radii.wrapRadius }, style, { transform: [{ scale }] }]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.shell, { borderRadius: radii.shellRadius }]}
        >
          <View
            style={[
              styles.card,
              { height: cardH, padding: cardPadding, borderRadius: radii.cardRadius },
            ]}
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
              <View pointerEvents="none" style={[styles.bgClip, { borderRadius: radii.cardRadius }]}>
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
              <View style={[styles.row, { marginBottom: rowMarginBottom }]}>
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
                  <Ionicons name={icon} size={iconSize} color={accent} />
                </View>
                {badge ? (
                  <View
                    style={[
                      styles.badge,
                      {
                        borderColor: withAlpha(accent, 0.35),
                        paddingHorizontal: badgePadH,
                        paddingVertical: badgePadV,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.badgeDot,
                        { backgroundColor: accent, height: badgeDotSize, width: badgeDotSize },
                      ]}
                    />
                    <Text style={[styles.badgeText, { fontSize: badgeFontSize }]}>{badge}</Text>
                  </View>
                ) : null}
              </View>

              <Text numberOfLines={1} style={[styles.title, { fontSize: titleFontSize }]}>
                {title}
              </Text>
              <Text
                numberOfLines={2}
                style={[
                  styles.subtitle,
                  {
                    marginTop: subtitleTop,
                    fontSize: subtitleFontSize,
                    lineHeight: subtitleLineHeight,
                    includeFontPadding: Platform.OS === 'android',
                    paddingBottom: Platform.OS === 'android' ? 1 : 0,
                  },
                ]}
              >
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
  wrap: {},
  shell: { padding: 1 },
  card: {
    backgroundColor: colors.glass2,
    shadowColor: '#000',
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  bgClip: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', zIndex: 0 },
  content: { position: 'relative', zIndex: 1 },
  ambientSweep: {
    position: 'absolute',
    left: 0,
    top: -34,
    bottom: -34,
    opacity: 0.64,
    zIndex: 0,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: colors.glass,
  },
  badgeDot: { height: 7, width: 7, borderRadius: 999 },
  title: { color: colors.text, fontWeight: '900', fontSize: 15, letterSpacing: 0.25, includeFontPadding: false },
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
    includeFontPadding: false,
  },
  badgeText: { color: colors.text, fontWeight: '700', fontSize: 12, includeFontPadding: false },
});
