import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardCard from '../components/DashboardCard';
import Screen from '../components/Screen';
import { colors } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const isDesktop = width >= 1200;
  const isLandscapeTablet = width >= 901 && width < 1200;
  const isStackedHeader = width < 901;
  const isSmallPhone = width <= 480;
  const isTinyPhone = width < 400;

  const logoSize = isDesktop ? 96 : isLandscapeTablet ? 80 : isTinyPhone ? 56 : isSmallPhone ? 60 : 64;

  const badgeRefW = useRef(0);
  const [badgeW, setBadgeW] = useState(0);

  const wScale = useMemo(() => clamp(width / 390, 0.85, 1.2), [width]);
  const hScale = useMemo(() => clamp(height / 844, 0.78, 1.12), [height]);
  const uiScale = useMemo(() => Math.min(wScale, hScale), [hScale, wScale]);

  const outerPadding = useMemo(() => {
    const v = Math.round(width * 0.046);
    return clamp(v, 12, 22);
  }, [width]);
  const cols = 2;
  const colGap = useMemo(() => clamp(Math.round(12 * uiScale), 8, 16), [uiScale]);
  const rowGapBase = useMemo(() => clamp(Math.round(14 * uiScale), 6, 16), [uiScale]);

  const cardWidth = useMemo(() => {
    const horizontalPadding = outerPadding * 2;
    const totalGap = colGap * (cols - 1);
    return Math.floor((width - horizontalPadding - totalGap) / cols);
  }, [colGap, cols, outerPadding, width]);

  const topPad = useMemo(() => clamp(Math.round(10 * uiScale), 6, 14), [uiScale]);
  const bottomPad = useMemo(
    () => clamp(Math.round(8 * uiScale), 4, 12) + (insets?.bottom || 0),
    [insets?.bottom, uiScale]
  );
  const heroToGridGap = useMemo(() => clamp(Math.round(10 * uiScale), 4, 14), [uiScale]);

  const availableHeight = useMemo(() => {
    const safeTop = insets?.top || 0;
    return Math.max(0, Math.floor(height - safeTop - topPad - bottomPad));
  }, [bottomPad, height, insets?.top, topPad]);

  const layout = useMemo(() => {
    const minHeroTarget = clamp(Math.round(116 * uiScale), 96, 160);
    const maxHero = clamp(Math.round(230 * uiScale), 170, 280);
    const minRowTarget = clamp(Math.round(96 * uiScale), 78, 140);
    const maxRow = clamp(Math.round(210 * uiScale), 150, 260);

    let heroRatio = 0.27;
    let rowGap = rowGapBase;

    let heroH = clamp(Math.floor(availableHeight * heroRatio), 0, maxHero);
    let rowH = Math.floor((availableHeight - heroH - heroToGridGap - 2 * rowGap) / 3);

    for (let i = 0; i < 12 && rowH < minRowTarget && heroH > minHeroTarget; i += 1) {
      heroRatio = Math.max(0.18, heroRatio - 0.02);
      rowGap = Math.max(4, rowGap - 1);
      heroH = clamp(Math.floor(availableHeight * heroRatio), 0, maxHero);
      rowH = Math.floor((availableHeight - heroH - heroToGridGap - 2 * rowGap) / 3);
    }

    rowH = clamp(rowH, 0, maxRow);
    const gridH = Math.max(0, availableHeight - heroH - heroToGridGap);
    return { heroH, gridH, rowH, rowGap };
  }, [availableHeight, heroToGridGap, rowGapBase, uiScale]);

  const heroPadH = useMemo(() => clamp(outerPadding + Math.round(8 * uiScale), outerPadding, outerPadding + 16), [outerPadding, uiScale]);
  const heroPaddingV = useMemo(() => {
    if (isDesktop) return clamp(Math.round(layout.heroH * 0.12), 6, 22);
    const mult = isTinyPhone ? 0.088 : isSmallPhone ? 0.094 : 0.10;
    const max = isTinyPhone ? 15 : isSmallPhone ? 16 : 18;
    return clamp(Math.round(layout.heroH * mult), 6, max);
  }, [isDesktop, isSmallPhone, isTinyPhone, layout.heroH]);

  const heroRadius = useMemo(() => clamp(Math.round(28 * uiScale), 22, 38), [uiScale]);
  const heroGlowRadius = useMemo(() => clamp(heroRadius + 4, 24, 44), [heroRadius]);
  const heroGlowHeight = useMemo(() => clamp(Math.round(layout.heroH * 1.08), 150, 360), [layout.heroH]);

  const pulseFontSize = useMemo(() => clamp(Math.round(12 * uiScale), 10, 14), [uiScale]);
  const pulsePadH = useMemo(() => clamp(Math.round(10 * uiScale), 7, 12), [uiScale]);
  const pulsePadV = useMemo(() => clamp(Math.round(6 * uiScale), 4, 8), [uiScale]);
  const badgeTop = useMemo(() => clamp(Math.round(12 * uiScale), 8, 16), [uiScale]);

  const titleFontSize = useMemo(() => {
    const heroTextScale = clamp(layout.heroH / 210, 0.70, 1.08);
    const base = 27 * Math.min(uiScale, heroTextScale);
    const widthAdj = width <= 360 ? -3 : width <= 400 ? -1 : 0;
    const phoneAdj = isTinyPhone ? -3 : isSmallPhone ? -2 : 0;
    const tabletAdj = isLandscapeTablet ? 0 : 0;
    const badgeAdj = badgeW >= 96 ? -2 : 0;
    const approxTextW = width - outerPadding * 2 - heroPadH * 2 - badgeW - logoSize - 12;
    const wAdj2 = approxTextW < 230 ? -2 : approxTextW < 255 ? -1 : 0;
    const max = isDesktop ? 30 : isLandscapeTablet ? 29 : isSmallPhone ? 26 : 28;
    return clamp(Math.round(base + widthAdj + phoneAdj + tabletAdj + badgeAdj + wAdj2), 15, max);
  }, [badgeW, heroPadH, isDesktop, isLandscapeTablet, isSmallPhone, isTinyPhone, layout.heroH, logoSize, outerPadding, uiScale, width]);
  const titleLineHeight = useMemo(() => {
    if (isDesktop) return clamp(Math.round(titleFontSize * 1.16), 20, 34);
    const mult = isTinyPhone ? 1.04 : isSmallPhone ? 1.06 : 1.08;
    return clamp(Math.round(titleFontSize * mult), 18, 32);
  }, [isDesktop, isSmallPhone, isTinyPhone, titleFontSize]);
  const titleToSubtitle = useMemo(() => {
    if (isDesktop) return clamp(Math.round(8 * uiScale), 5, 12);
    const base = isTinyPhone ? 4 : isSmallPhone ? 5 : 6;
    return clamp(Math.round(base * uiScale), 4, 12);
  }, [isDesktop, isSmallPhone, isTinyPhone, uiScale]);
  const subtitleFontSize = useMemo(() => {
    const adj = isTinyPhone ? -2 : isSmallPhone ? -1 : 0;
    return clamp(Math.round(13 * uiScale + adj), 10, 15);
  }, [isSmallPhone, isTinyPhone, uiScale]);
  const subtitleLineHeight = useMemo(() => clamp(Math.round(subtitleFontSize * 1.35), 13, 20), [subtitleFontSize]);

  const heroFade = useRef(new Animated.Value(0)).current;
  const heroLift = useRef(new Animated.Value(10)).current;
  const cardEnter = useRef([...Array(6)].map(() => new Animated.Value(0))).current;
  const bg = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const heroAnim = Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(heroLift, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]);

    const cardsAnim = Animated.stagger(
      70,
      cardEnter.map((v) => Animated.timing(v, { toValue: 1, duration: 360, useNativeDriver: true }))
    );

    let cancelled = false;
    let bgAnim = null;
    const runBgSweep = () => {
      if (cancelled) return;
      bg.setValue(0);
      bgAnim = Animated.sequence([
        Animated.timing(bg, { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.delay(5000),
      ]);
      bgAnim.start(({ finished }) => {
        if (finished && !cancelled) runBgSweep();
      });
    };

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );

    runBgSweep();
    pulseLoop.start();
    Animated.sequence([heroAnim, Animated.delay(60), cardsAnim]).start();

    return () => {
      cancelled = true;
      bgAnim?.stop?.();
      pulseLoop.stop();
    };
  }, [bg, cardEnter, heroFade, heroLift, pulse]);

  const glowX = bg.interpolate({
    inputRange: [0, 1],
    outputRange: [-Math.max(120, width * 0.25), Math.max(120, width * 0.25)],
  });
  const glowOpacity = bg.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.22, 0.42, 0.22] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.35] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const enterStyle = (i) => ({
    opacity: cardEnter[i],
    transform: [{ translateY: cardEnter[i].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });

  return (
    <Screen padded={false}>
      <View style={[styles.container, { paddingHorizontal: outerPadding, paddingTop: topPad, paddingBottom: bottomPad }]}>
        <View style={[styles.heroWrap, { height: layout.heroH }]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heroBgGlow,
              { height: heroGlowHeight, opacity: glowOpacity, transform: [{ translateX: glowX }], borderRadius: heroGlowRadius },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(79,211,255,0.22)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <Animated.View style={{ opacity: heroFade, transform: [{ translateY: heroLift }] }}>
            <LinearGradient
              colors={[colors.glass2, 'rgba(255,255,255,0.015)', 'transparent']}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.hero,
                {
                  height: layout.heroH,
                  paddingHorizontal: heroPadH,
                  paddingVertical: heroPaddingV,
                  borderRadius: heroRadius,
                },
              ]}
            >
              {!isStackedHeader ? (
                <View style={styles.heroRow}>
                  <View style={styles.brandLeft}>
                    <View style={[styles.brandLogoWrap, { width: logoSize, height: logoSize }]}>
                      <Image
                        source={{
                          uri: 'https://res.cloudinary.com/dytoubgbw/image/upload/v1775549605/logo_qiajma.jpg',
                        }}
                        style={styles.brandLogoImg}
                      />
                    </View>
                    <View style={styles.brandText}>
                      <Text style={[styles.title, { fontSize: titleFontSize, lineHeight: titleLineHeight }]}>
                        P Obul Reddy Public School & Spark Future Leaders Academy
                      </Text>
                      <Text
                        style={[
                          styles.subtitle,
                          {
                            marginTop: titleToSubtitle,
                            fontSize: subtitleFontSize,
                            lineHeight: subtitleLineHeight,
                          },
                        ]}
                      >
                        Your Defence Career Guide
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => navigation.getParent()?.navigate('Profile')}
                    onLayout={(e) => {
                      const w = Math.round(e?.nativeEvent?.layout?.width || 0);
                      if (!w || w === badgeRefW.current) return;
                      badgeRefW.current = w;
                      setBadgeW(w);
                    }}
                    style={[styles.pulse, { paddingHorizontal: pulsePadH, paddingVertical: pulsePadV, marginTop: badgeTop }]}
                  >
                    <Animated.View pointerEvents="none" style={[styles.pulseGlow, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
                    <Ionicons name="person-circle" size={16} color={colors.accentGreen} />
                    <Text style={[styles.pulseText, { fontSize: pulseFontSize }]}>Profile</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.heroMobileWrap}>
                  <View style={styles.heroMobileTopRow}>
                    <View style={[styles.brandLogoWrap, { width: logoSize, height: logoSize }]}>
                      <Image
                        source={{
                          uri: 'https://res.cloudinary.com/dytoubgbw/image/upload/v1775549605/logo_qiajma.jpg',
                        }}
                        style={styles.brandLogoImg}
                      />
                    </View>

                    <Pressable
                      onPress={() => navigation.getParent()?.navigate('Profile')}
                      onLayout={(e) => {
                        const w = Math.round(e?.nativeEvent?.layout?.width || 0);
                        if (!w || w === badgeRefW.current) return;
                        badgeRefW.current = w;
                        setBadgeW(w);
                      }}
                      style={[styles.pulse, { paddingHorizontal: pulsePadH, paddingVertical: pulsePadV }]}
                    >
                      <Animated.View pointerEvents="none" style={[styles.pulseGlow, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]} />
                      <Ionicons name="person-circle" size={16} color={colors.accentGreen} />
                      <Text style={[styles.pulseText, { fontSize: pulseFontSize }]}>Profile</Text>
                    </Pressable>
                  </View>

                  <View style={styles.heroMobileText}>
                    <Text
                      style={[
                        styles.title,
                        styles.titleMobile,
                        isTinyPhone ? styles.titleSmallPhone : null,
                        { fontSize: titleFontSize, lineHeight: titleLineHeight },
                      ]}
                    >
                      P Obul Reddy Public School & Spark Future Leaders Academy
                    </Text>
                    <Text
                      style={[
                        styles.subtitle,
                        {
                          marginTop: titleToSubtitle,
                          fontSize: subtitleFontSize,
                          lineHeight: subtitleLineHeight,
                        },
                      ]}
                    >
                      Your Defence Career Guide
                    </Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        </View>

        <View style={[styles.grid, { height: layout.gridH, marginTop: heroToGridGap, columnGap: colGap, rowGap: layout.rowGap }]}>
          <Animated.View style={enterStyle(0)}>
            <DashboardCard
              style={{ width: cardWidth }}
              height={layout.rowH}
              accent={colors.accentOrange}
              icon="medal-outline"
              title="Defence Careers"
              subtitle="Explore Opportunities"
              ambientSweep
              onPress={() => navigation.navigate('Careers')}
            />
          </Animated.View>
          <Animated.View style={enterStyle(1)}>
            <DashboardCard
              style={{ width: cardWidth }}
              height={layout.rowH}
              accent={colors.accentBlue}
              icon="chatbubble-ellipses-outline"
              title="Career Guide"
              subtitle="Ask Anything"
              badge="Ready"
              ambientSweep
              onPress={() => navigation.getParent()?.navigate('AI Chat')}
            />
          </Animated.View>
          <Animated.View style={enterStyle(2)}>
            <DashboardCard
              style={{ width: cardWidth }}
              height={layout.rowH}
              accent={colors.accentGreen}
              icon="rocket-outline"
              title="Entry Schemes"
              subtitle="How to Join"
              ambientSweep
              onPress={() => navigation.getParent()?.navigate('Schemes')}
            />
          </Animated.View>
          <Animated.View style={enterStyle(3)}>
            <DashboardCard
              style={{ width: cardWidth }}
              height={layout.rowH}
              accent={colors.accentPurple}
              icon="school-outline"
              title="Preparation"
              subtitle="Get Ready"
              ambientSweep
              onPress={() => navigation.navigate('Preparation')}
            />
          </Animated.View>
          <Animated.View style={enterStyle(4)}>
            <DashboardCard
              style={{ width: cardWidth }}
              height={layout.rowH}
              accent={colors.accentGreen}
              icon="fitness-outline"
              title="Fitness & Medical"
              subtitle="Stay Fit"
              ambientSweep
              onPress={() => navigation.navigate('FitnessMedical')}
            />
          </Animated.View>
          <Animated.View style={enterStyle(5)}>
            <DashboardCard
              style={{ width: cardWidth }}
              height={layout.rowH}
              accent={colors.accentBlue}
              icon="notifications-outline"
              title="Alerts & Updates"
              subtitle="New Updates"
              ambientSweep
              onPress={() => navigation.navigate('AlertsUpdates')}
            />
          </Animated.View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroWrap: { justifyContent: 'flex-start' },
  heroBgGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
  hero: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass2,
    shadowColor: '#000',
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroMobileWrap: { flexDirection: 'column', width: '100%' },
  heroMobileTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroMobileText: { width: '100%', minWidth: 0, flexShrink: 1 },
  brandLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandText: { flex: 1, minWidth: 0 },
  brandLogoWrap: {
    borderRadius: 999,
    backgroundColor: '#fff',
    padding: 6,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  brandLogoImg: { width: '100%', height: '100%', borderRadius: 999, resizeMode: 'contain' },
  title: {
    color: colors.text,
    fontWeight: '900',
    letterSpacing: 0.25,
    marginTop: 6,
    flexShrink: 1,
    includeFontPadding: false,
  },
  titleMobile: {
    width: '100%',
    flexWrap: 'wrap',
  },
  titleSmallPhone: { marginTop: 2 },
  subtitle: {
    color: colors.muted,
    fontWeight: '600',
    flexShrink: 1,
    includeFontPadding: Platform.OS === 'android',
    paddingBottom: Platform.OS === 'android' ? 1 : 0,
  },
  pulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(45,255,149,0.26)',
    backgroundColor: 'rgba(45,255,149,0.10)',
  },
  pulseGlow: {
    position: 'absolute',
    left: -10,
    right: -10,
    top: -10,
    bottom: -10,
    borderRadius: 999,
    backgroundColor: 'rgba(43,255,155,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(43,255,155,0.22)',
  },
  pulseText: { color: colors.text, fontWeight: '800', fontSize: 12, includeFontPadding: false },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
