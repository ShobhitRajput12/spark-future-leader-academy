import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardCard from '../components/DashboardCard';
import Screen from '../components/Screen';
import { colors } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cols = 2;
  const gap = 12;
  const cardWidth = useMemo(() => {
    const horizontalPadding = 18 * 2;
    const totalGap = gap * (cols - 1);
    return Math.floor((width - horizontalPadding - totalGap) / cols);
  }, [width]);

  const heroMinHeight = useMemo(() => {
    const v = Math.round(height * 0.218);
    return Math.min(198, Math.max(170, v));
  }, [height]);
  const heroPadding = useMemo(() => {
    const v = Math.round(height * 0.021);
    return Math.min(18, Math.max(16, v));
  }, [height]);
  const heroGlowHeight = useMemo(() => {
    const v = Math.round(heroMinHeight * 1.06);
    return Math.min(214, Math.max(182, v));
  }, [heroMinHeight]);

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

    const bgLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bg, { toValue: 1, duration: 6200, useNativeDriver: true }),
        Animated.timing(bg, { toValue: 0, duration: 6200, useNativeDriver: true }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );

    bgLoop.start();
    pulseLoop.start();
    Animated.sequence([heroAnim, Animated.delay(60), cardsAnim]).start();

    return () => {
      bgLoop.stop();
      pulseLoop.stop();
    };
  }, [bg, cardEnter, heroFade, heroLift, pulse]);

  const glowX = bg.interpolate({ inputRange: [0, 1], outputRange: [-Math.max(120, width * 0.25), Math.max(120, width * 0.25)] });
  const glowOpacity = bg.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.22, 0.42, 0.22] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.35] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const enterStyle = (i) => ({
    opacity: cardEnter[i],
    transform: [{ translateY: cardEnter[i].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  });

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets?.bottom || 0 }]}
      >
        <View style={styles.top}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heroBgGlow,
              { height: heroGlowHeight, opacity: glowOpacity, transform: [{ translateX: glowX }] },
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
              style={[styles.hero, { minHeight: heroMinHeight, padding: heroPadding }]}
            >
              <Pressable
                onPress={() => navigation.getParent()?.navigate('Profile')}
                style={[styles.pulse, styles.pulseInHero]}
              >
                <Animated.View
                  pointerEvents="none"
                  style={[styles.pulseGlow, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
                />
                <Ionicons name="person-circle" size={16} color={colors.accentGreen} />
                <Text style={styles.pulseText}>Profile</Text>
              </Pressable>
              <View style={styles.heroText}>
                <Text style={styles.title}>Spark Future Leader Academy</Text>
                <Text style={styles.subtitle}>Your Defence Career Guide</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>

        <View style={[styles.grid, { gap }]}>
          <Animated.View style={enterStyle(0)}>
            <DashboardCard
              style={{ width: cardWidth }}
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
              accent={colors.accentBlue}
              icon="notifications-outline"
              title="Alerts & Updates"
              subtitle="New Updates"
              ambientSweep
              onPress={() => navigation.navigate('AlertsUpdates')}
            />
          </Animated.View>
        </View>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 0 },
  top: { paddingTop: 10, paddingBottom: 16 },
  heroBgGlow: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 10,
    borderRadius: 26,
    overflow: 'hidden',
  },
  hero: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass2,
    shadowColor: '#000',
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', letterSpacing: 0.25, marginTop: 6 },
  subtitle: { marginTop: 6, color: colors.muted, fontSize: 13.5, lineHeight: 18, fontWeight: '600' },
  heroText: { paddingRight: 84 },
  pulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(45,255,149,0.26)',
    backgroundColor: 'rgba(45,255,149,0.10)',
    position: 'relative',
  },
  pulseInHero: { position: 'absolute', top: 12, right: 12 },
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
  pulseText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});


