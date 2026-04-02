import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import GlowCard from '../components/GlowCard';
import Screen from '../components/Screen';
import { colors } from '../theme/colors';

export default function ProfileScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={[colors.glass2, 'rgba(255,255,255,0.012)', 'transparent']}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>Cadet</Text>
            <Text style={styles.desc}>Build your plan • Track your progress</Text>
          </View>
        </LinearGradient>

        <View style={styles.list}>
          <GlowCard
            title="My Goals"
            subtitle="Set target exam (NDA / CDS / AFCAT...)"
            accent={colors.accentGreen}
            right={<Ionicons name="flag-outline" size={20} color={colors.accentGreen} />}
          />
          <GlowCard
            title="Saved Notes"
            subtitle="Quickly revisit schemes, tips and checklists"
            accent={colors.accentBlue}
            right={<Ionicons name="bookmark-outline" size={20} color={colors.accentBlue} />}
          />
          <GlowCard
            title="Notifications"
            subtitle="Alerts for forms, admit cards and results"
            accent={colors.accentOrange}
            right={<Ionicons name="notifications-outline" size={20} color={colors.accentOrange} />}
          />
          <GlowCard
            title="Settings"
            subtitle="API base URL, theme preferences"
            accent={colors.accentPurple}
            right={<Ionicons name="settings-outline" size={20} color={colors.accentPurple} />}
          >
            <View style={styles.settingRow}>
              <Ionicons name="moon-outline" size={16} color={colors.muted} />
              <Text style={styles.settingText}>Dark theme enabled</Text>
            </View>
          </GlowCard>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 24 },
  header: {
    marginTop: 10,
    marginBottom: 10,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.30,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  avatar: {
    height: 46,
    width: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: colors.text, fontSize: 18, fontWeight: '900' },
  desc: { marginTop: 6, color: colors.muted, fontWeight: '700', fontSize: 12.5 },
  list: { gap: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingText: { color: colors.muted, fontWeight: '700', fontSize: 12.5 },
});
