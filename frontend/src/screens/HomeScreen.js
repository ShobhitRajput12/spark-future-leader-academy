import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import DashboardCard from '../components/DashboardCard';
import Screen from '../components/Screen';
import { colors } from '../theme/colors';
import { getGreeting } from '../utils/greeting';

export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const cols = 2;
  const gap = 12;
  const cardWidth = useMemo(() => {
    const horizontalPadding = 18 * 2;
    const totalGap = gap * (cols - 1);
    return Math.floor((width - horizontalPadding - totalGap) / cols);
  }, [width]);

  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [fade, lift]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fade, transform: [{ translateY: lift }] }}>
          <View style={styles.top}>
            <View style={styles.pulseWrap}>
              <View style={styles.pulse}>
                <Ionicons name="shield-checkmark" size={16} color={colors.accentGreen} />
                <Text style={styles.pulseText}>Premium Dashboard</Text>
              </View>
            </View>

            <Text style={styles.title}>Spark Future Leader Academy</Text>
            <Text style={styles.subtitle}>Your Defence Career Guide</Text>
          </View>

          <View style={[styles.grid, { gap }]}>
            <DashboardCard
              style={{ width: cardWidth }}
              accent={colors.accentOrange}
              icon="medal-outline"
              title="Defence Careers"
              subtitle="Explore Opportunities"
              onPress={() => navigation.navigate('Careers')}
            />
            <DashboardCard
              style={{ width: cardWidth }}
              accent={colors.accentBlue}
              icon="chatbubble-ellipses-outline"
              title="Career Guide"
              subtitle="Ask Anything"
              badge="Ready"
              onPress={() => navigation.getParent()?.navigate('AI Chat')}
            />
            <DashboardCard
              style={{ width: cardWidth }}
              accent={colors.accentGreen}
              icon="rocket-outline"
              title="Entry Schemes"
              subtitle="How to Join"
              onPress={() => navigation.getParent()?.navigate('Schemes')}
            />
            <DashboardCard
              style={{ width: cardWidth }}
              accent={colors.accentPurple}
              icon="school-outline"
              title="Preparation"
              subtitle="Get Ready"
              onPress={() => navigation.navigate('Preparation')}
            />
            <DashboardCard
              style={{ width: cardWidth }}
              accent={colors.accentGreen}
              icon="fitness-outline"
              title="Fitness & Medical"
              subtitle="Stay Fit"
              onPress={() => navigation.navigate('FitnessMedical')}
            />
            <DashboardCard
              style={{ width: cardWidth }}
              accent={colors.accentBlue}
              icon="notifications-outline"
              title="Alerts & Updates"
              subtitle="New Updates"
              onPress={() => navigation.navigate('AlertsUpdates')}
            />
          </View>

          <View style={styles.footerSpace} />
        </Animated.View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 12 },
  top: { paddingTop: 8, paddingBottom: 16 },
  pulseWrap: { alignItems: 'flex-end', marginBottom: 10 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: 0.3 },
  subtitle: { marginTop: 6, color: colors.muted, fontSize: 13.5, lineHeight: 18 },
  pulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(45,255,149,0.26)',
    backgroundColor: 'rgba(45,255,149,0.08)',
  },
  pulseText: { color: colors.text, fontWeight: '800', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  footerSpace: { height: 18 },
});
